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

const snake = [
    {
        row: Math.floor(rows / 2),
        col: Math.floor(cols / 2),
    }
];

let dir = {row: 0, col: 1};

function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height)
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
    snake[0].row += dir.row;
    snake[0].col += dir.col;
}

clearCanvas();

setInterval(() => {
    moveSnake();

    clearCanvas();
    drawSnake();
}, 200);

up.addEventListener("click", () => {
    dir = {row: -1, col: 0};
});

right.addEventListener("click", () => {
    dir = {row: 0, col: 1};
});

down.addEventListener("click", () => {
    dir = {row: 1, col: 0};
});

left.addEventListener("click", () => {
    dir = {row: 0, col: -1};
});
