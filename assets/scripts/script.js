const canvas = document.getElementById("gameCanvas");

const canvasSize = 300;

const cols = 20;
const rows = 20;

const cellSize = canvasSize / cols;

canvas.width = canvasSize;
canvas.height = canvasSize;

const up = document.getElementById("up");
const right = document.getElementById("right");
const down = document.getElementById("down");
const left = document.getElementById("left");

const ctx = canvas.getContext("2d");

let food = {};
randomFoodPosition();

const snake = [
    {
        row: Math.floor(rows / 2),
        col: Math.floor(cols / 2),
    }
];

let dir = {row: 0, col: 1};

const scoreElem = document.getElementById("score");
let score = 0;
scoreElem.textContent = score;

function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function render() {
    clearCanvas();
    drawSnake();
    drawFood();
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

function checkFoodCollision() {
    return (
        snake[0].row === food.row &&
        snake[0].col === food.col
    );
}

function randomFoodPosition() {
    food = {
        row: Math.floor(Math.random() * rows),
        col: Math.floor(Math.random() * cols),
    };
}

function drawFood() {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(
        food.col * cellSize,
        food.row * cellSize,
        cellSize,
        cellSize
    )
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

function moveSnake() {
    for (let i = snake.length - 1; i > 0; i--) {
        snake[i].row = snake[i - 1].row;
        snake[i].col = snake[i - 1].col;
    }

    snake[0].row += dir.row;
    snake[0].col += dir.col;
}

clearCanvas();

setInterval(() => {
    moveSnake();

    if (checkFoodCollision()) {
        const tail = {
            ...snake[snake.length - 1]
        }

        snake.push(tail);

        randomFoodPosition();

        score++;
        scoreElem.textContent = score;
    }

    if (checkBodyCollision() || checkWallCollision()) {
        gameOver();
        return;
    }

    render();
}, 200);

const directions = {
    up:    { row: -1, col: 0, invalid: () => dir.row === 1 },
    right: { row: 0, col: 1, invalid: () => dir.col === -1 },
    down:  { row: 1, col: 0, invalid: () => dir.row === -1 },
    left:  { row: 0, col: -1, invalid: () => dir.col === 1 },
};

up.addEventListener("click", () => {
    if (!directions.up.invalid()) dir = directions.up;
});

right.addEventListener("click", () => {
    if (!directions.right.invalid()) dir = directions.right;
});

down.addEventListener("click", () => {
    if (!directions.down.invalid()) dir = directions.down;
});

left.addEventListener("click", () => {
    if (!directions.left.invalid()) dir = directions.left;
});

document.addEventListener("keydown", (e) => {
    const keyMap = {
        ArrowUp: "up", w: "up", W: "up",
        ArrowRight: "right", d: "right", D: "right",
        ArrowDown: "down", s: "down", S: "down",
        ArrowLeft: "left", a: "left", A: "left",
    };

    const action = keyMap[e.key];
    if (!action) return;

    e.preventDefault();

    if (!directions[action].invalid()) {
        dir = directions[action];
    }
});
