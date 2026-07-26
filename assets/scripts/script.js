const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasSize = 300;
const rows = 20;
const cols = 20;
const cellSize = canvasSize / cols;

canvas.width = canvasSize;
canvas.height = canvasSize;

const up = document.getElementById("up");
const right = document.getElementById("right");
const down = document.getElementById("down");
const left = document.getElementById("left");

const status = document.getElementById("status");

let scoreElem = document.getElementById("score");
let score = 0;

const snake = [];
let food = {};
let dir = { row: 0, col: 1 };

let gameLoop;

function clearCanvas() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    ctx.fillStyle = "#00ff00";

    for (const part of snake) {
        ctx.fillRect(
            part.col * cellSize,
            part.row * cellSize,
            cellSize,
            cellSize
        );
    }
}

function drawFood() {
    ctx.fillStyle = "#ffd700";

    ctx.fillRect(
        food.col * cellSize,
        food.row * cellSize,
        cellSize,
        cellSize
    );
}

function render() {
    clearCanvas();
    drawSnake();
    drawFood();
}

function isFoodOnSnake(row, col) {
    for (const part of snake) {
        if (
            part.row === row &&
            part.col === col
        ) {
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
    } while (isFoodOnSnake(row, col));

    food = { row, col };
}

function moveSnake() {
    for (let i = snake.length - 1; i > 0; i--) {
        snake[i].row = snake[i - 1].row;
        snake[i].col = snake[i - 1].col;
    }

    snake[0].row += dir.row;
    snake[0].col += dir.col;
}

function checkFoodCollision() {
    return (
        snake[0].row === food.row &&
        snake[0].col === food.col
    );
}

function checkBodyCollision() {
    const head = snake[0];

    for (let i = 1; i < snake.length; i++) {
        if (
            head.row === snake[i].row &&
            head.col === snake[i].col
        ) {
            return true;
        }
    }

    return false;
}

function checkWallCollision() {
    const head = snake[0];

    return (
        head.row < 0 ||
        head.row >= rows ||
        head.col < 0 ||
        head.col >= cols
    );
}

function gameTick() {
    const lastTail = {
        ...snake[snake.length - 1]
    };

    moveSnake();

    if (checkFoodCollision()) {
        snake.push(lastTail);

        randomFoodPosition();

        score++;
        scoreElem.textContent = score;
    }

    if (
        checkBodyCollision() ||
        checkWallCollision()
    ) {
        gameOver();
        return;
    }

    render();
}

function startGame() {
    snake.length = 0;

    snake.push({
        row: Math.floor(rows / 2),
        col: Math.floor(cols / 2),
    });

    dir = {
        row: 0,
        col: 1,
    };

    score = 0;
    scoreElem.textContent = score;

    randomFoodPosition();

    clearInterval(gameLoop);

    gameLoop = setInterval(gameTick, 200);

    render();
}

function gameOver() {
    clearInterval(gameLoop);

    ctx.fillStyle = "red";
    ctx.font = "32px 'Pixelify Sans'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "Game Over",
        canvas.width / 2,
        canvas.height / 2
    );

    status.textContent = "Restart";
    status.style.color = "#ff0000";
}

function restartGame() {
    if (status.textContent !== "Restart") {
        return;
    }

    status.innerHTML = `
        <h2>Score</h2>
        <p id="score">0</p>
    `;

    status.style.color = "#ccc";

    scoreElem =
        document.getElementById("score");

    startGame();
}

status.addEventListener("click", restartGame);

const directions = {
    up: {
        row: -1,
        col: 0,
        invalid: () => dir.row === 1
    },

    right: {
        row: 0,
        col: 1,
        invalid: () => dir.col === -1
    },

    down: {
        row: 1,
        col: 0,
        invalid: () => dir.row === -1
    },

    left: {
        row: 0,
        col: -1,
        invalid: () => dir.col === 1
    }
};

up.addEventListener("click", () => {
    if (!directions.up.invalid())
        dir = directions.up;
});

right.addEventListener("click", () => {
    if (!directions.right.invalid())
        dir = directions.right;
});

down.addEventListener("click", () => {
    if (!directions.down.invalid())
        dir = directions.down;
});

left.addEventListener("click", () => {
    if (!directions.left.invalid())
        dir = directions.left;
});

document.addEventListener(
    "keydown",
    (e) => {
        const keyMap = {
            ArrowUp: "up",
            w: "up",
            W: "up",

            ArrowRight: "right",
            d: "right",
            D: "right",

            ArrowDown: "down",
            s: "down",
            S: "down",

            ArrowLeft: "left",
            a: "left",
            A: "left",
        };

        const action = keyMap[e.key];

        if (!action) return;

        e.preventDefault();

        if (!directions[action].invalid()) {
            dir = directions[action];
        }
    }
);

startGame();
