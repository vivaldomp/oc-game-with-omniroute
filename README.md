# PAC-MAN

Classic arcade PAC-MAN game built with HTML5 Canvas and JavaScript.

![Demo](docs/images/demo.png)

## About

This project was built collaboratively using **OpenCode** with [Superpowers Skills](https://github.com/obra/superpowers) by **@obra**, powered by **DeepSeekV4-Flash** routed through **[OminiRoute](https://omniroute.online/)** as the AI provider gateway.

### Features

- Full maze, ghost AI (Blinky, Pinky, Inky, Clyde), power pellets, and fruit
- Scatter/Chase mode cycling with frightened mode
- Ghost eat combo scoring (200, 400, 800, 1600)
- Web Audio API sound effects and music
- Volume controls with mute toggles
- High score persistence via localStorage
- Touch D-pad controls for mobile devices (auto-detected)
- iOS/mobile Safari audio unlock

### Bug Fixes

- Fright sound now loops for the full power-pellet duration
- Eaten ghosts properly return to the ghost house and revive
- Audio context correctly resumes on first user interaction
- Consistent volume initialization (defaults to full)

## Sound Assets

Sound effects sourced from [Spriter's Resource](https://sounds.spriters-resource.com/arcade/pacman/asset/404131/).

## Deploy

Static site — deploy anywhere. Vercel config included.

```bash
npx vercel --prod
```

## Controls

### Keyboard

| Key | Action |
|---|---|
| Arrow keys / WASD | Move Pac-Man |
| `M` | Toggle mute |
| `Shift+S` | Toggle SFX mute |
| `Shift+M` | Toggle music mute |

### Touch (mobile)

On devices with a touchscreen (auto-detected via `pointer: coarse`), a D-pad appears below the game canvas:

- Tap **▲ ◀ ▶ ▼** to move Pac-Man
- Tap the center **●** button to start / restart
- The center button pulses when waiting for input

## Tech Stack

- **HTML5 Canvas** — rendering
- **Web Audio API** — sound with iOS unlock
- **Vanilla JS** — no framework
- **Vercel** — static deployment
