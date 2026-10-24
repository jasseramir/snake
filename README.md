# Snake Game

A flat, dark-mode Snake game built with **HTML**, **CSS**, and **Vanilla JavaScript**. All the game art is **SVG**, and the sound effects are synthesized with the Web Audio API. Its look follows the design language of my portfolio: soft rounded shapes, no shadows, Plus Jakarta Sans, and a lavender, sky, and mint palette on navy.

## Features

- Flat dark UI with rounded shapes and one typeface
- All graphics are SVG: a snake made of squares, a simple square head with two eyes, a square apple that pulses, and a small burst effect when you eat
- Sound effects for starting, turning, eating, pausing, game over, winning and a new best score
- Mute button in the header (or press `M`), the choice is saved in the browser
- Edges wrap around: leave one side and enter from the opposite side
- Start screen, the game begins on your first move
- Best score saved in the browser (`localStorage`)
- Keyboard controls (WASD + Arrow Keys), on-screen buttons, and swipe on the board
- Random food generation, and the snake grows after eating
- Prevents 180° turns, even with two quick taps
- Collision with the snake's own body
- Pauses when the tab is hidden
- Restart with the center button, or with Enter or Space
- Responsive layout that fits one screen on phones
- Screen reader announcements for game over

## Built With

- HTML5
- CSS3 (custom properties, Grid, Flexbox)
- JavaScript (ES6)
- Inline SVG, drawn and updated from JavaScript
- Web Audio API (all sounds are generated in code)
- [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) from Google Fonts

## Controls

| Action  | Key    |
| ------- | ------ |
| Up      | W / ↑  |
| Down    | S / ↓  |
| Left    | A / ←  |
| Right   | D / →  |
| Restart | Enter / Space (after game over) |
| Mute / unmute | M |

You can also use the on-screen buttons, or swipe on the board.

## Run

Clone the repository:

```bash
git clone https://github.com/jasseramir/snake.git
```

Open `index.html` in your browser.

No dependencies or installation required.

## Customize

The colors live as custom properties at the top of `assets/styles/style.css`. The SVG art is styled with the same tokens, so changing one updates both the page and the board. The sprites (head, apple, tail) are plain SVG markup in `index.html`. Grid size and speed are constants at the top of `assets/scripts/script.js` (`rows`, `cols`, `tickSpeed`).

## Project Structure

```
.
├── index.html
├── LICENSE
├── README.md
└── assets/
    ├── images/
    │   └── favicon.svg
    ├── scripts/
    │   └── script.js
    └── styles/
        └── style.css
```

## Sound

There are no audio files in the project. Every sound is generated at runtime by the Web Audio API (`sfx` in `assets/scripts/script.js`), so there are no third-party audio licenses or attributions to manage. Browsers only allow audio after a user gesture, so sound starts with your first key press or tap.

## License

This project is open source and available under the MIT License.
