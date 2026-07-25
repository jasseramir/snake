const canvas = document.getElementById("gameCanvas");

const canvasSize = 300;

const cols = 20;
const rows = 20;

const cellSize = canvasSize / cols;

canvas.width = canvasSize;
canvas.height = canvasSize;

const ctx = canvas.getContext("2d");

function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

clearCanvas();
