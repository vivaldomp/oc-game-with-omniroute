# Pacman Arcade Game — Design Spec

## Overview
Faithful replica of the original 1980 Pacman arcade game built with vanilla JavaScript, CSS, HTML, and Canvas. Pixel-perfect retro visual style. Assets sourced from OpenGameArt.org (audio only — all visuals drawn with Canvas primitives).

## File Structure
```
pacman/
├── index.html      # HTML shell: canvas, score/lives UI, script/style links
├── style.css       # Styling: layout, canvas border, HUD, overlays
├── game.js         # Game loop (rAF), state machine, input handling, orchestration
├── maze.js         # Maze 2D array, wall/pellet rendering, collision queries
├── pacman.js       # Pacman entity: movement, animation, direction queue, death
├── ghost.js        # Ghost entity: AI (SCATTER/CHASE/FRIGHTENED/EATEN), pathfinding, modes
├── fruit.js        # Fruit bonus: spawn timing, rendering, scoring
└── audio.js        # AudioManager: Web Audio API preloads, play/stop sounds
```

## Architecture

### Game Loop (`game.js`)
- `requestAnimationFrame` at 60fps
- Fixed timestep with delta accumulation
- State machine: `MENU → READY → PLAYING → DYING → (GAME_OVER | LEVEL_COMPLETE) → ...`
- `update(dt)` — processes input, moves entities, checks collisions, updates ghosts
- `render()` — clears canvas, draws maze → entities → fruit → HUD effects

### Maze (`maze.js`)
- 28×31 tile grid stored as 2D array
- Tile types: 0=empty, 1=wall, 2=pellet, 3=power pellet, 4=ghost house, 5=tunnel
- `render(ctx, frameCount)` — blue walls, pellet dots, blinking power pellets
- `isWalkable(tx, ty)`, `getPelletAt(tx, ty)`, `removePelletAt(tx, ty)`
- Tunnel wraps left-right edge

### Pacman (`pacman.js`)
- Tile-position + sub-pixel offset for smooth movement
- Direction queue: stores next input, applies at tile centers
- Speed: 80% max speed
- Mouth animation: 4-frame cycle (open → closing → closed → opening)
- `update(dt, maze)`, `die()`, `reset()`
- Death animation: flattening sequence over ~2s
- Rendered as yellow arc with animated mouth wedge

### Ghosts (`ghost.js`)
| Ghost | Color | Target Strategy |
|-------|-------|----------------|
| Blinky | Red | Pacman's current tile. Speeds up when <20 pellets remain. |
| Pinky | Pink | 4 tiles ahead of Pacman's facing direction |
| Inky | Cyan | Vector from Blinky to 2 tiles ahead of Pacman, doubled |
| Clyde | Orange | Pacman's tile when >8 tiles away, else scatter corner |

- Modes: SCATTER → CHASE (timed cycles), FRIGHTENED (power pellet), EATEN (eyes return)
- Mode timer cycles: Level 1: SCATTER 7s → CHASE 20s → SCATTER 7s → CHASE 20s...
- Shorter cycles each level
- Pathfinding: at each intersection, try available directions (not reverse), pick closest to target tile
- Ghost house: emerge in order (Pinky, Inky, Clyde), Blinky starts outside
- Frightened duration: 6s default, decreases per level
- Rendered as colored circle with white eyes pointing in movement direction

### Fruit (`fruit.js`)
- Appears twice per level below ghost house
- Points: 100 (cherry) → 300 → 500 → 700 → 1000 → 2000 → 3000 → 5000
- Rendered as colored circle with simple shape

### Audio (`audio.js`)
- Web Audio API with preloaded AudioBuffer sources
- Sounds from OpenGameArt.org: chomp (x2 alternating), power pellet, ghost frightened, ghost eaten, death, siren (pitch increases as pellets decrease), level start
- All loaded at game start via XHR/fetch

### Scoring & Lives
- Pellet: 10pts, Power Pellet: 50pts, Ghost: 200/400/800/1600, Fruit: 100–5000
- Lives: 3, displayed as small Pacman icons above canvas
- High score persisted to `localStorage`
- Score popup floating text (+100, etc.) during gameplay

### Controls
- Arrow keys / WASD — direction input
- Any key — start game / restart on game over

## Asset Sourcing
Audio files downloaded from OpenGameArt.org (CC0 / CC-BY license) and stored in `pacman/sounds/`. Visuals drawn entirely via Canvas 2D API — no sprite images needed.

## Out of Scope (v1)
- Intermission cutscenes
- Multiple mazes / level-to-level maze changes
- Gamepad API support
- Mobile/touch controls
