
# Abyssal Breach

A fast, arcade-style **2D underwater descent** game made for **Daydream Campfire Lagos**.

Pilot a deep-sea fish diving into the abyss, dodging hazards as the ocean grows darker. Build up energy, trigger hyperspeed, and see how deep you can go before your hull collapses—or the abyss consumes you.

## Play

### Option A: Run locally (recommended)

Modern browsers often restrict loading assets when opening `index.html` directly from disk. Run a small local web server instead.

- **VS Code**
  - Install **Live Server**
  - Right-click `index.html` -> **Open with Live Server**

- **Python** (if installed)
  - Run in this folder:
    - `python -m http.server 8000`
  - Open:
    - `http://localhost:8000`

### Option B: Open `index.html`

You can try opening `index.html` directly, but **audio/assets may fail to load** depending on browser security settings.

## Controls

- **Left / Right Arrow**: Move
- **Space**: Hyperspeed (consumes energy)
- **Mouse Click (on Game Over)**: Restart

## Features

- Menu scene with ambient ocean audio and animated title
- Endless depth score (meters) with persistent high score via `localStorage`
- Hyperspeed mode with camera zoom + boosted scoring
- Enemy hazards (mines, rocks, predators)
- Energy cells to refill hyperspeed energy
- Dynamic deepening darkness as you descend

## Tech

- **Phaser 3** (loaded via CDN)
- Plain **HTML + JavaScript** (no build step)

## Project Structure

- `index.html`
  - Loads Phaser and starts the game
- `game.js`
  - `MenuScene` and `GameScene`
  - Rules, spawning, collisions, HUD
- `assets/`
  - `environment/` backgrounds
  - `player/` sprites
  - `enemies/` sprites
  - `sounds/` SFX and ambience

## Credits

- Created for **Daydream Campfire Lagos**
- Game Developers: Vincent, Kofi, and Ayo

## License

Add a license if you plan to distribute this publicly (e.g., MIT).
