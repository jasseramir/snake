const svg = document.getElementById("gameSvg");
const svgNS = "http://www.w3.org/2000/svg";

const rows = 20;
const cols = 20;
const cellSize = 32;
const tickSpeed = 170;
const bestKey = "snake-best";
const muteKey = "snake-muted";

const boardWidth = cols * cellSize;
const boardHeight = rows * cellSize;
// Body squares are 24 wide plus a 4px rounded stroke from the CSS
const squareSize = cellSize - 8;

svg.setAttribute("viewBox", `0 0 ${boardWidth} ${boardHeight}`);

const boardTiles = document.getElementById("boardTiles");
const foodElem = document.getElementById("food");
const bodyPath = document.getElementById("bodyPath");
const headElem = document.getElementById("head");
const fxElem = document.getElementById("fx");
const overlayElem = document.getElementById("overlay");

const up = document.getElementById("up");
const right = document.getElementById("right");
const down = document.getElementById("down");
const left = document.getElementById("left");

const status = document.getElementById("status");
const statusLabel = document.getElementById("statusLabel");
const scoreElem = document.getElementById("score");
const bestElem = document.getElementById("best");
const liveElem = document.getElementById("live");
const muteBtn = document.getElementById("mute");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const snake = [];
let food = {};
let dir = { row: 0, col: 1 };
let nextDir = dir;

let score = 0;
let best = loadBest();
let bestAtStart = best;

// idle | running | paused | over
let state = "idle";
let won = false;
let gameLoop;

/* ---------- Storage ---------- */

function loadBest() {
    try {
        return Number(localStorage.getItem(bestKey)) || 0;
    } catch {
        return 0;
    }
}

function saveBest() {
    try {
        localStorage.setItem(bestKey, String(best));
    } catch {
        // Storage can be blocked, the score still works in memory
    }
}

function loadMuted() {
    try {
        return localStorage.getItem(muteKey) === "1";
    } catch {
        return false;
    }
}

function saveMuted(value) {
    try {
        localStorage.setItem(muteKey, value ? "1" : "0");
    } catch {
        // Storage can be blocked, the setting still works in memory
    }
}

/* ---------- Sound ----------
   Every sound is synthesized with the Web Audio API, so the game ships
   no audio files and has no third-party audio licenses to track. */

const sfx = (() => {
    let audio = null;
    let master = null;
    let muted = loadMuted();

    // Browsers only allow audio after a user gesture, so the context is
    // created lazily from the first key press or tap.
    function ensure() {
        if (muted) return null;

        if (!audio) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;

            audio = new AudioCtx();
            master = audio.createGain();
            master.gain.value = 0.22;
            master.connect(audio.destination);
        }

        if (audio.state === "suspended") {
            audio.resume();
        }

        return audio;
    }

    function tone(freq, { at = 0, dur = 0.12, type = "square", vol = 0.4, to = 0 } = {}) {
        const ac = ensure();
        if (!ac) return;

        const t0 = ac.currentTime + at;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);

        if (to) {
            osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
        }

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.03);
    }

    function thud(dur = 0.28, vol = 0.6) {
        const ac = ensure();
        if (!ac) return;

        const t0 = ac.currentTime;
        const length = Math.floor(ac.sampleRate * dur);
        const buffer = ac.createBuffer(1, length, ac.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = ac.createBufferSource();
        const filter = ac.createBiquadFilter();
        const gain = ac.createGain();

        source.buffer = buffer;
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(900, t0);
        filter.frequency.exponentialRampToValueAtTime(90, t0 + dur);

        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        source.start(t0);
    }

    function arpeggio(notes, { at = 0, gap = 0.08, ...options } = {}) {
        notes.forEach((freq, i) => tone(freq, { at: at + i * gap, ...options }));
    }

    return {
        unlock: ensure,

        isMuted: () => muted,

        setMuted(value) {
            muted = value;
            saveMuted(value);
        },

        turn() {
            tone(330, { dur: 0.04, type: "triangle", vol: 0.16 });
        },

        start() {
            arpeggio([392, 523, 659], { gap: 0.07, dur: 0.1, type: "triangle", vol: 0.35 });
        },

        resume() {
            tone(440, { dur: 0.1, to: 560, type: "triangle", vol: 0.3 });
        },

        eat(points) {
            // The pitch creeps up as the score grows
            const base = 560 + Math.min(points, 15) * 14;

            tone(base, { dur: 0.08, to: base * 1.26, type: "square", vol: 0.26 });
            tone(base * 1.5, { at: 0.07, dur: 0.12, to: base * 2, type: "square", vol: 0.26 });
            tone(base, { dur: 0.16, type: "triangle", vol: 0.3 });
        },

        gameOver() {
            thud();
            arpeggio([330, 262, 196, 131], {
                at: 0.05,
                gap: 0.13,
                dur: 0.22,
                type: "sawtooth",
                vol: 0.22,
            });
        },

        newBest(delay = 0.7) {
            arpeggio([523, 659, 784, 1047], {
                at: delay,
                gap: 0.09,
                dur: 0.16,
                type: "triangle",
                vol: 0.36,
            });
        },

        win() {
            arpeggio([523, 659, 784, 1047, 1319], {
                gap: 0.1,
                dur: 0.2,
                type: "square",
                vol: 0.24,
            });
        },

        blip() {
            tone(600, { dur: 0.06, type: "triangle", vol: 0.3 });
        },
    };
})();

function updateMuteButton() {
    const muted = sfx.isMuted();

    muteBtn.dataset.muted = String(muted);
    muteBtn.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
}

function toggleMute() {
    sfx.setMuted(!sfx.isMuted());
    updateMuteButton();

    // Unmuting is a user gesture, so it can also create the audio context
    sfx.blip();
}

muteBtn.addEventListener("click", toggleMute);
updateMuteButton();

/* ---------- Drawing (SVG) ---------- */

const cx = (col) => col * cellSize + cellSize / 2;
const cy = (row) => row * cellSize + cellSize / 2;

function angleOf(d) {
    return (Math.atan2(d.row, d.col) * 180) / Math.PI;
}

function drawBoard() {
    let tiles = "";

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if ((row + col) % 2 === 0) {
                tiles += `M${col * cellSize} ${row * cellSize}h${cellSize}v${cellSize}h${-cellSize}z`;
            }
        }
    }

    boardTiles.setAttribute("d", tiles);
}

function drawFood() {
    foodElem.setAttribute("transform", `translate(${cx(food.col)} ${cy(food.row)})`);
}

function drawSnake() {
    let body = "";

    // Body: one square per cell (the head is drawn separately)
    for (let i = 1; i < snake.length; i++) {
        const part = snake[i];
        const x = cx(part.col) - squareSize / 2;
        const y = cy(part.row) - squareSize / 2;

        body += `M${x} ${y}h${squareSize}v${squareSize}h${-squareSize}z`;
    }

    bodyPath.setAttribute("d", body);

    // Head: drawn facing right, so it only needs moving and turning
    const head = snake[0];

    headElem.setAttribute(
        "transform",
        `translate(${cx(head.col)} ${cy(head.row)}) rotate(${angleOf(dir)})`
    );
}

function textLine({ text, size, weight, y, color }) {
    return `<text class="ov-text" x="${boardWidth / 2}" y="${y}" font-size="${size}" font-weight="${weight}" style="fill:${color}">${text}</text>`;
}

function setOverlay(markup) {
    overlayElem.innerHTML = markup ? `<g class="overlay-in">${markup}</g>` : "";
}

function dim(opacity) {
    return `<rect class="ov-dim" width="${boardWidth}" height="${boardHeight}" opacity="${opacity}" />`;
}

function renderOverlay() {
    const mid = boardHeight / 2;

    if (state === "idle") {
        setOverlay(
            dim(0.55) +
                `<rect class="ov-pill" x="${boardWidth / 2 - 200}" y="${mid - 44}" width="400" height="88" rx="44" />` +
                textLine({
                    text: "Press an arrow to start",
                    size: 26,
                    weight: 800,
                    y: mid,
                    color: "var(--navy)",
                })
        );
        return;
    }

    if (state === "paused") {
        setOverlay(
            dim(0.86) +
                textLine({
                    text: "Paused",
                    size: 56,
                    weight: 800,
                    y: mid - 36,
                    color: "var(--txt)",
                }) +
                textLine({
                    text: "Press an arrow to resume",
                    size: 26,
                    weight: 700,
                    y: mid + 28,
                    color: "var(--lav)",
                })
        );
        return;
    }

    if (state === "over") {
        let markup =
            dim(0.86) +
            textLine({
                text: won ? "You win" : "Game over",
                size: 56,
                weight: 800,
                y: mid - 36,
                color: "var(--txt)",
            }) +
            textLine({
                text: `Score ${score}`,
                size: 28,
                weight: 700,
                y: mid + 28,
                color: "var(--lav)",
            });

        if (score > 0 && score > bestAtStart) {
            markup += textLine({
                text: "New best",
                size: 24,
                weight: 700,
                y: mid + 78,
                color: "var(--mint)",
            });
        }

        setOverlay(markup);
        return;
    }

    setOverlay("");
}

// A ring, a few sparks and a "+1" where the apple was eaten
function burst(row, col) {
    if (reduceMotion.matches) return;

    const group = document.createElementNS(svgNS, "g");
    group.setAttribute("transform", `translate(${cx(col)} ${cy(row)})`);

    let markup = `<circle class="fx-ring" r="11" />`;

    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
        const dx = Math.round(Math.cos(angle) * 24);
        const dy = Math.round(Math.sin(angle) * 24);
        const fill = i % 2 === 0 ? "var(--mint)" : "var(--sky)";

        markup += `<circle class="fx-dot" r="2.6" style="--dx:${dx}px;--dy:${dy}px;fill:${fill}" />`;
    }

    markup += `<text class="fx-plus" y="-12">+1</text>`;

    group.innerHTML = markup;
    fxElem.appendChild(group);

    setTimeout(() => group.remove(), 800);
}

function render() {
    drawFood();
    drawSnake();
}

/* ---------- HUD ---------- */

function updateHud() {
    scoreElem.textContent = score;
    bestElem.textContent = best;
    status.dataset.state = state;

    if (state === "over") {
        statusLabel.textContent = "Restart";
        status.setAttribute("aria-label", "Restart game");
    } else {
        statusLabel.textContent = "Score";
        status.setAttribute("aria-label", `Score ${score}`);
    }
}

/* ---------- Game logic ---------- */

function isOnSnake(row, col, parts = snake) {
    for (const part of parts) {
        if (part.row === row && part.col === col) {
            return true;
        }
    }

    return false;
}

function randomFoodPosition() {
    let row, col;

    do {
        row = Math.floor(Math.random() * rows);
        col = Math.floor(Math.random() * cols);
    } while (isOnSnake(row, col));

    food = { row, col };
}

function gameTick() {
    dir = nextDir;

    // The edges wrap around, so leaving one side enters from the other
    const head = {
        row: (snake[0].row + dir.row + rows) % rows,
        col: (snake[0].col + dir.col + cols) % cols,
    };

    const ateFood = head.row === food.row && head.col === food.col;

    // The tail moves away this tick unless the snake is growing
    const body = ateFood ? snake : snake.slice(0, -1);

    if (isOnSnake(head.row, head.col, body)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (!ateFood) {
        snake.pop();
        render();
        return;
    }

    score++;

    if (score > best) {
        best = score;
    }

    if (snake.length === rows * cols) {
        won = true;
        render();
        gameOver();
        return;
    }

    burst(food.row, food.col);
    sfx.eat(score);

    randomFoodPosition();
    updateHud();
    render();
}

function startLoop() {
    clearInterval(gameLoop);

    state = "running";
    gameLoop = setInterval(gameTick, tickSpeed);

    updateHud();
    renderOverlay();
    render();
}

function pauseGame() {
    clearInterval(gameLoop);

    state = "paused";

    updateHud();
    renderOverlay();
    render();
}

function startGame() {
    clearInterval(gameLoop);

    snake.length = 0;

    const middleRow = Math.floor(rows / 2);
    const middleCol = Math.floor(cols / 2);

    for (let i = 0; i < 3; i++) {
        snake.push({ row: middleRow, col: middleCol - i });
    }

    dir = { row: 0, col: 1 };
    nextDir = dir;

    score = 0;
    bestAtStart = best;
    won = false;
    state = "idle";

    fxElem.innerHTML = "";

    randomFoodPosition();
    updateHud();
    renderOverlay();
    render();
}

function gameOver() {
    clearInterval(gameLoop);

    state = "over";

    saveBest();
    updateHud();
    renderOverlay();
    render();

    liveElem.textContent = `${won ? "You win" : "Game over"}. Score ${score}.`;

    if (won) {
        sfx.win();
    } else {
        sfx.gameOver();
    }

    if (score > 0 && score > bestAtStart) {
        sfx.newBest(won ? 0.75 : 0.9);
    }
}

function restartGame() {
    if (state !== "over") {
        return;
    }

    liveElem.textContent = "";
    status.blur();
    sfx.blip();
    startGame();
}

status.addEventListener("click", () => {
    sfx.unlock();
    restartGame();
});

/* ---------- Controls ---------- */

const directions = {
    up: {
        row: -1,
        col: 0,
        invalid: () => dir.row === 1,
    },

    right: {
        row: 0,
        col: 1,
        invalid: () => dir.col === -1,
    },

    down: {
        row: 1,
        col: 0,
        invalid: () => dir.row === -1,
    },

    left: {
        row: 0,
        col: -1,
        invalid: () => dir.col === 1,
    },
};

function turn(action) {
    // Any key press or tap is allowed to start the audio engine
    sfx.unlock();

    if (state === "over") {
        return;
    }

    const next = directions[action];

    // Compared with the last direction the snake actually moved,
    // so two quick taps can't fold it back onto itself
    if (next.invalid()) {
        return;
    }

    const changed = next.row !== nextDir.row || next.col !== nextDir.col;

    nextDir = next;

    if (state === "idle") {
        sfx.start();
        startLoop();
    } else if (state === "paused") {
        sfx.resume();
        startLoop();
    } else if (changed) {
        sfx.turn();
    }
}

up.addEventListener("click", () => turn("up"));
right.addEventListener("click", () => turn("right"));
down.addEventListener("click", () => turn("down"));
left.addEventListener("click", () => turn("left"));

const keyMap = {
    arrowup: "up",
    w: "up",

    arrowright: "right",
    d: "right",

    arrowdown: "down",
    s: "down",

    arrowleft: "left",
    a: "left",
};

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const action = keyMap[e.key.toLowerCase()];

    if (action) {
        e.preventDefault();
        turn(action);
        return;
    }

    if (e.key.toLowerCase() === "m" && !e.repeat) {
        toggleMute();
        return;
    }

    const isRestartKey = e.key === "Enter" || e.key === " ";

    if (state === "over" && isRestartKey && !e.target.closest("button")) {
        e.preventDefault();
        sfx.unlock();
        restartGame();
    }
});

// Swipe on the board
let touchStartX = 0;
let touchStartY = 0;

svg.addEventListener(
    "touchstart",
    (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    },
    { passive: true }
);

svg.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

    if (Math.abs(dx) > Math.abs(dy)) {
        turn(dx > 0 ? "right" : "left");
    } else {
        turn(dy > 0 ? "down" : "up");
    }
});

// A hidden tab throttles timers, so pause instead of letting the snake crawl
document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "running") {
        pauseGame();
    }
});

drawBoard();
startGame();
