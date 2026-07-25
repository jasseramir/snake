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
    snake[0].row += dir.row;
    snake[0].col += dir.col;
}

clearCanvas();

setInterval(() => {
    moveSnake();

    if (checkFoodCollision()) {
        randomFoodPosition();
        score++;
        scoreElem.textContent = score;
    }

    clearCanvas();
    drawSnake();
    drawFood();
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
