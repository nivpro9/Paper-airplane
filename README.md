# Retro Arcade Machine

A retro arcade machine with 4 classic games, built in HTML5/JavaScript for web and mobile.
Also includes a Python/Pygame desktop version.

## Play Online
Open `web/index.html` in any browser — or host on GitHub Pages for mobile access.

## Games

| Game | Desktop Controls | Mobile |
|------|-----------------|--------|
| **Pac-Man** | Arrow Keys | Swipe / D-pad |
| **Galaga** | Arrow Keys + Space | Buttons |
| **Donkey Kong** | Arrow Keys + Space | D-pad + Jump |
| **Street Fighter II** | A/D/W + J/K/L | Buttons |

## Features
- Name entry screen
- Neon LED arcade UI with particle effects
- High score leaderboard (saved to localStorage)
- Scanline CRT effect
- Animated starfield background
- Full mobile touch support

## Web Version (recommended)
No installation needed — works in any browser on phone or desktop.
```
open web/index.html
```

## Python Version
Requires Python 3.x and pygame-ce:
```
pip install pygame-ce
python main.py
```

## Project Structure
```
web/
  index.html          - Main arcade UI
  css/style.css       - Neon styling
  js/main.js          - App controller + score storage
  js/pacman.js        - Pac-Man
  js/galaga.js        - Galaga
  js/donkey_kong.js   - Donkey Kong
  js/street_fighter.js- Street Fighter II
main.py               - Python arcade UI
pacman.py             - Python Pac-Man
galaga.py             - Python Galaga
donkey_kong.py        - Python Donkey Kong
street_fighter.py     - Python Street Fighter II
scores.py             - Score management
```
