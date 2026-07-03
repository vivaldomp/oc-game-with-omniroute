# Pacman Arcade Game — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a faithful Pacman arcade game replica using vanilla JS, CSS, HTML, and Canvas.

**Architecture:** Modular files (HTML shell + CSS + JS modules per entity). Game loop runs on rAF with fixed timestep. Game state machine drives all transitions. Entities are ES6 classes owned by `game.js`.

**Tech Stack:** Vanilla JavaScript (ES6), HTML5 Canvas 2D, Web Audio API.

---

### Task 0: Project Scaffold

**Files:**
- Create: `pacman/index.html`
- Create: `pacman/style.css`
- Create: `pacman/sounds/.gitkeep`

- [ ] **Step 0.1: Create directory structure**

```
mkdir -p /home/vivaldo/artificial_intelligence/omnirouter-test/pacman/sounds
```

- [ ] **Step 0.2: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PAC-MAN</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="hud">
    <div id="score-wrap">
      <span id="score-label">SCORE</span>
      <span id="score-value">0</span>
    </div>
    <div id="lives-wrap"></div>
  </div>
  <canvas id="game-canvas" width="448" height="496"></canvas>
  <div id="overlay" class="hidden">
    <div id="overlay-text"></div>
  </div>
  <script src="maze.js"></script>
  <script src="pacman.js"></script>
  <script src="ghost.js"></script>
  <script src="fruit.js"></script>
  <script src="audio.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

- [ ] **Step 0.3: Write style.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: monospace;
  color: #fff;
}

#hud {
  display: flex;
  justify-content: space-between;
  width: 448px;
  padding: 8px 16px;
  font-size: 16px;
}

#score-wrap { display: flex; gap: 8px; }
#score-label { color: #fff; }
#score-value { color: #fff; }
#lives-wrap { display: flex; align-items: center; gap: 4px; }
.life-icon {
  width: 12px; height: 12px;
  background: #ff0;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

#game-canvas {
  border: 2px solid #2121de;
  display: block;
}

#overlay {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

#overlay.hidden { display: none; }
#overlay-text {
  color: #ffb8ae;
  font-size: 24px;
  letter-spacing: 4px;
}
```

- [ ] **Step 0.4: Verify scaffold**

Open `pacman/index.html` in a browser. Expected: black page with blue-bordered canvas, "SCORE 0" at top.

---

### Task 1: Maze Data and Rendering

**Files:**
- Create: `pacman/maze.js`

- [ ] **Step 1.1: Define maze layout**

The maze is 28 columns × 31 rows. Tile size = 16px (canvas: 448×496).

```js
const TILE_SIZE = 16;
const COLS = 28;
const ROWS = 31;

// Tile types
const T = {
  EMPTY: 0,
  WALL: 1,
  PELLET: 2,
  POWER_PELLET: 3,
  GHOST_HOUSE: 4,
  TUNNEL: 5
};

const MAZE_DATA = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
```

- [ ] **Step 1.2: Write Maze class**

```js
class Maze {
  constructor() {
    this.data = MAZE_DATA.map(row => [...row]);
    this.totalPellets = 0;
    this.pelletsRemaining = 0;
    this.countPellets();
  }

  countPellets() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.data[r][c] === T.PELLET || this.data[r][c] === T.POWER_PELLET) {
          this.totalPellets++;
        }
      }
    }
    this.pelletsRemaining = this.totalPellets;
  }

  isWalkable(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    const tile = this.data[row][col];
    return tile !== T.WALL && tile !== T.GHOST_HOUSE;
  }

  isWalkableByGhost(col, row) {
    if (col < 0 || col >= COLS) return false;
    if (row < 0 || row >= ROWS) return false;
    const tile = this.data[row][col];
    return tile !== T.WALL;
  }

  getTile(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return T.WALL;
    return this.data[row][col];
  }

  removePellet(col, row) {
    const tile = this.data[row][col];
    if (tile === T.PELLET || tile === T.POWER_PELLET) {
      this.data[row][col] = T.EMPTY;
      this.pelletsRemaining--;
      return tile;
    }
    return 0;
  }

  isAllPelletsEaten() {
    return this.pelletsRemaining === 0;
  }

  reset() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.data[r][c] = MAZE_DATA[r][c];
      }
    }
    this.pelletsRemaining = this.totalPellets;
  }

  render(ctx, frameCount) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const tile = this.data[r][c];

        switch (tile) {
          case T.WALL:
            ctx.fillStyle = '#2121de';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#000';
            // Inner cutout (rounded rect effect)
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            break;
          case T.PELLET:
            ctx.fillStyle = '#ffb8ae';
            ctx.beginPath();
            ctx.arc(x + 8, y + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case T.POWER_PELLET:
            const visible = Math.floor(frameCount / 8) % 2 === 0;
            if (visible) {
              ctx.fillStyle = '#ffb8ae';
              ctx.beginPath();
              ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          case T.TUNNEL:
            ctx.fillStyle = '#000';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            break;
          default:
            break;
        }
      }
    }
  }
}
```

- [ ] **Step 1.3: Quick visual check**

Open `index.html`, add a `<script>` block in devtools to `new Maze().render(ctx, 0)`. Verify maze renders with blue walls and pellet dots.

---

### Task 2: Pacman Entity

**Files:**
- Create: `pacman/pacman.js`

- [ ] **Step 2.1: Write Pacman class**

```js
class Pacman {
  constructor() {
    this.col = 14;
    this.row = 23;
    this.x = this.col * TILE_SIZE + 8;
    this.y = this.row * TILE_SIZE + 8;
    this.dir = { dx: 0, dy: 0 };
    this.nextDir = { dx: 0, dy: 0 };
    this.speed = 1.6; // 80% of max 2px/frame
    this.mouthAngle = 0;
    this.mouthOpening = true;
    this.alive = true;
    this.deathFrame = 0;
    this.moving = false;
  }

  setDirection(dx, dy) {
    this.nextDir = { dx, dy };
  }

  isAtTileCenter() {
    const cx = this.col * TILE_SIZE + 8;
    const cy = this.row * TILE_SIZE + 8;
    return Math.abs(this.x - cx) < 0.5 && Math.abs(this.y - cy) < 0.5;
  }

  snapToTile() {
    this.x = this.col * TILE_SIZE + 8;
    this.y = this.row * TILE_SIZE + 8;
  }

  update(maze) {
    if (!this.alive) {
      this.deathFrame++;
      return;
    }

    if (this.isAtTileCenter()) {
      this.snapToTile();

      // Try queued direction first
      const tc = this.col + this.nextDir.dx;
      const tr = this.row + this.nextDir.dy;
      if (maze.isWalkable(tc, tr)) {
        this.dir = { dx: this.nextDir.dx, dy: this.nextDir.dy };
      }

      // Check current direction
      const nc = this.col + this.dir.dx;
      const nr = this.row + this.dir.dy;
      if (!maze.isWalkable(nc, nr)) {
        this.dir = { dx: 0, dy: 0 };
        this.moving = false;
      } else {
        this.moving = true;
      }
    }

    if (this.moving) {
      // Tunnel wrap
      if (this.col < 0 && this.dir.dx < 0) {
        this.col = 27;
        this.x = this.col * TILE_SIZE + 8;
      } else if (this.col >= 28 && this.dir.dx > 0) {
        this.col = 0;
        this.x = this.col * TILE_SIZE + 8;
      }

      this.x += this.dir.dx * this.speed;
      this.y += this.dir.dy * this.speed;

      // Recalculate col/row from position
      const newCol = Math.round((this.x - 8) / TILE_SIZE);
      const newRow = Math.round((this.y - 8) / TILE_SIZE);
      if (newCol !== this.col || newRow !== this.row) {
        if (maze.isWalkable(newCol, newRow) || maze.getTile(newCol, newRow) === T.TUNNEL) {
          this.col = newCol;
          this.row = newRow;
        } else {
          this.snapToTile();
        }
      }
    }

    // Mouth animation
    this.mouthAngle += this.moving ? 0.15 : 0;
    if (this.mouthAngle >= 0.45) this.mouthOpening = false;
    if (this.mouthAngle <= 0) this.mouthOpening = true;
    this.mouthAngle += this.mouthOpening ? 0.05 : -0.05;
    this.mouthAngle = Math.max(0, Math.min(0.45, this.mouthAngle));
  }

  render(ctx) {
    if (!this.alive) {
      // Death animation: shrinking arc
      const progress = this.deathFrame / 60;
      if (progress > 1) return;
      ctx.fillStyle = '#ff0';
      const r = 8 * (1 - progress * 0.5);
      const startAngle = progress * Math.PI * 2;
      const endAngle = Math.PI * 2 - startAngle;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(this.x, this.y, Math.max(0, r), startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      return;
    }

    ctx.fillStyle = '#ff0';
    let angle = 0;
    if (this.dir.dx === -1) angle = Math.PI;
    else if (this.dir.dy === -1) angle = -Math.PI / 2;
    else if (this.dir.dy === 1) angle = Math.PI / 2;

    const mouth = this.moving ? this.mouthAngle : 0;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.arc(this.x, this.y, 8, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();
  }

  reset() {
    this.col = 14;
    this.row = 23;
    this.x = this.col * TILE_SIZE + 8;
    this.y = this.row * TILE_SIZE + 8;
    this.dir = { dx: 0, dy: 0 };
    this.nextDir = { dx: 0, dy: 0 };
    this.alive = true;
    this.deathFrame = 0;
    this.moving = false;
    this.mouthAngle = 0;
  }
}
```

- [ ] **Step 2.2: Quick visual check**

In devtools: `const p = new Pacman(); p.setDirection(-1, 0); p.update(maze); p.render(ctx);` — verify yellow circle with mouth renders and moves left.

---

### Task 3: Ghost Entity

**Files:**
- Create: `pacman/ghost.js`

- [ ] **Step 3.1: Write Ghost class**

```js
const GHOST_COLORS = {
  blink: '#ff0000',
  pink: '#ffb8ff',
  ink: '#00ffff',
  clyd: '#ffb852'
};

const GHOST_HOME = {
  blink: { col: 14, row: 11 },
  pink: { col: 14, row: 14 },
  ink: { col: 12, row: 14 },
  clyd: { col: 16, row: 14 }
};

const GHOST_SCATTER = {
  blink: { col: 25, row: 0 },
  pink: { col: 2, row: 0 },
  ink: { col: 27, row: 30 },
  clyd: { col: 0, row: 30 }
};

const DIRS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 }
];

class Ghost {
  constructor(name, color, scatterTarget) {
    this.name = name;
    this.color = color;
    this.scatterTarget = scatterTarget;
    this.home = GHOST_HOME[name];
    this.col = this.home.col;
    this.row = this.home.row;
    this.x = this.col * TILE_SIZE + 8;
    this.y = this.row * TILE_SIZE + 8;
    this.dir = { dx: 0, dy: -1 };
    this.speed = 1.5;
    this.mode = 'SCATTER'; // SCATTER, CHASE, FRIGHTENED, EATEN
    this.frightenedTimer = 0;
    this.inHouse = name !== 'blink';
    this.houseTimer = name === 'pink' ? 0 : name === 'ink' ? 50 : 100;
    this.released = name === 'blink';
    this.eyesTarget = { col: 14, row: 11 };
    this.ghostHouseBob = 0;
  }

  getTargetTile(pacman, blinky) {
    if (this.mode === 'SCATTER') return this.scatterTarget;
    if (this.mode === 'FRIGHTENED') return null;
    if (this.mode === 'EATEN') return { col: 14, row: 14 };

    switch (this.name) {
      case 'blink':
        return { col: pacman.col, row: pacman.row };
      case 'pink': {
        const t = { col: pacman.col + pacman.dir.dx * 4, row: pacman.row + pacman.dir.dy * 4 };
        return t;
      }
      case 'ink': {
        const ahead = { col: pacman.col + pacman.dir.dx * 2, row: pacman.row + pacman.dir.dy * 2 };
        const t = { col: ahead.col + (ahead.col - blinky.col), row: ahead.row + (ahead.row - blinky.row) };
        return t;
      }
      case 'clyd': {
        const dist = Math.abs(this.col - pacman.col) + Math.abs(this.row - pacman.row);
        if (dist > 8) return { col: pacman.col, row: pacman.row };
        return this.scatterTarget;
      }
      default:
        return { col: pacman.col, row: pacman.row };
    }
  }

  isAtTileCenter() {
    const cx = this.col * TILE_SIZE + 8;
    const cy = this.row * TILE_SIZE + 8;
    return Math.abs(this.x - cx) < 0.5 && Math.abs(this.y - cy) < 0.5;
  }

  snapToTile() {
    this.x = this.col * TILE_SIZE + 8;
    this.y = this.row * TILE_SIZE + 8;
  }

  chooseDirection(maze, pacman, blinky) {
    if (!this.isAtTileCenter()) return;

    const target = this.getTargetTile(pacman, blinky);
    const reverse = { dx: -this.dir.dx, dy: -this.dir.dy };

    let available = DIRS.filter(d => {
      if (d.dx === reverse.dx && d.dy === reverse.dy && this.mode !== 'FRIGHTENED' && this.mode !== 'EATEN') return false;
      const nc = this.col + d.dx;
      const nr = this.row + d.dy;
      return maze.isWalkableByGhost(nc, nr);
    });

    if (available.length === 0) {
      available = DIRS.filter(d => {
        const nc = this.col + d.dx;
        const nr = this.row + d.dy;
        return maze.isWalkableByGhost(nc, nr);
      });
    }

    if (available.length === 0) return;

    if (this.mode === 'FRIGHTENED') {
      this.dir = available[Math.floor(Math.random() * available.length)];
      return;
    }

    if (this.mode === 'EATEN') {
      // Head toward ghost house
      const targetCol = 14;
      const targetRow = 14;
      let best = null;
      let bestDist = Infinity;
      for (const d of available) {
        const nc = this.col + d.dx;
        const nr = this.row + d.dy;
        const dist = Math.abs(nc - targetCol) + Math.abs(nr - targetRow);
        if (dist < bestDist) { bestDist = dist; best = d; }
      }
      if (best) this.dir = best;
      return;
    }

    if (target) {
      let best = null;
      let bestDist = Infinity;
      for (const d of available) {
        const nc = this.col + d.dx;
        const nr = this.row + d.dy;
        const dist = Math.abs(nc - target.col) + Math.abs(nr - target.row);
        if (dist < bestDist) { bestDist = dist; best = d; }
      }
      if (best) this.dir = best;
    }
  }

  update(maze, pacman, blinky, frameCount) {
    // Ghost house release
    if (this.inHouse) {
      if (this.houseTimer > 0) {
        this.houseTimer--;
        this.ghostHouseBob = Math.sin(frameCount * 0.1) * 3;
        return;
      }
      this.inHouse = false;
      this.released = true;
      this.col = 14;
      this.row = 11;
      this.x = this.col * TILE_SIZE + 8;
      this.y = this.row * TILE_SIZE + 8;
    }

    // Frightened timer
    if (this.mode === 'FRIGHTENED') {
      this.frightenedTimer--;
      if (this.frightenedTimer <= 0) {
        this.mode = 'CHASE';
      }
    }

    // Eaten reached home
    if (this.mode === 'EATEN' && this.col === 14 && this.row === 14) {
      this.mode = 'CHASE';
    }

    // Tunnel speed reduction
    const inTunnel = maze.getTile(this.col, this.row) === T.TUNNEL;
    const currentSpeed = inTunnel ? this.speed * 0.5 : this.speed;

    this.chooseDirection(maze, pacman, blinky);

    this.x += this.dir.dx * currentSpeed;
    this.y += this.dir.dy * currentSpeed;

    // Tunnel wrap
    if (this.col < 0 && this.dir.dx < 0) {
      this.col = 27; this.x = this.col * TILE_SIZE + 8;
    } else if (this.col >= 28 && this.dir.dx > 0) {
      this.col = 0; this.x = this.col * TILE_SIZE + 8;
    }

    const newCol = Math.round((this.x - 8) / TILE_SIZE);
    const newRow = Math.round((this.y - 8) / TILE_SIZE);
    if (newCol !== this.col || newRow !== this.row) {
      if (maze.isWalkableByGhost(newCol, newRow)) {
        this.col = newCol;
        this.row = newRow;
      }
    }
  }

  setFrightened(duration) {
    if (this.mode === 'EATEN') return;
    this.mode = 'FRIGHTENED';
    this.frightenedTimer = duration;
    this.dir = { dx: -this.dir.dx, dy: -this.dir.dy };
  }

  eat() {
    this.mode = 'EATEN';
    this.speed = 3;
  }

  render(ctx, frameCount) {
    if (this.inHouse) {
      const bx = this.home.col * TILE_SIZE + 8;
      const by = this.home.row * TILE_SIZE + 8 + this.ghostHouseBob;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (this.mode === 'EATEN') {
      // Draw eyes only
      this.drawEyes(ctx, this.x, this.y);
      return;
    }

    ctx.fillStyle = this.mode === 'FRIGHTENED'
      ? (this.frightenedTimer < 60 && Math.floor(frameCount / 6) % 2 === 0 ? '#fff' : '#2121de')
      : this.color;

    // Ghost body: rounded rect with wavy bottom
    const gx = this.x - 8;
    const gy = this.y - 8;
    ctx.beginPath();
    ctx.arc(this.x, gy + 8, 8, Math.PI, 0);
    ctx.lineTo(gx + 16, gy + 14);
    // Wavy bottom
    for (let i = 0; i < 4; i++) {
      const wx = gx + 12 + i * 3;
      ctx.lineTo(wx, gy + 14 + (i % 2 === 0 ? 3 : 0));
    }
    ctx.closePath();
    ctx.fill();

    if (this.mode !== 'FRIGHTENED') {
      this.drawEyes(ctx, this.x, this.y);
    }
  }

  drawEyes(ctx, x, y) {
    // White ovals
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 3, y - 2, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blue pupils in direction of movement
    ctx.fillStyle = '#2121de';
    const pd = { dx: this.dir.dx || 0, dy: this.dir.dy || -1 };
    ctx.beginPath();
    ctx.arc(x - 3 + pd.dx * 1.5, y - 2 + pd.dy * 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3 + pd.dx * 1.5, y - 2 + pd.dy * 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  reset() {
    const home = GHOST_HOME[this.name];
    this.col = home.col;
    this.row = home.row;
    this.x = this.col * TILE_SIZE + 8;
    this.y = this.row * TILE_SIZE + 8;
    this.dir = { dx: 0, dy: -1 };
    this.mode = 'SCATTER';
    this.frightenedTimer = 0;
    this.inHouse = this.name !== 'blink';
    this.houseTimer = this.name === 'pink' ? 0 : this.name === 'ink' ? 50 : 100;
    this.released = this.name === 'blink';
  }
}
```

---

### Task 4: Fruit Entity

**Files:**
- Create: `pacman/fruit.js`

- [ ] **Step 4.1: Write Fruit class**

```js
const FRUIT_TABLE = [
  { type: 'cherry', points: 100, color: '#ff0000', size: 6 },
  { type: 'strawberry', points: 300, color: '#ff6b6b', size: 6 },
  { type: 'orange', points: 500, color: '#ffb852', size: 6 },
  { type: 'apple', points: 700, color: '#ff0000', size: 6 },
  { type: 'melon', points: 1000, color: '#00ff00', size: 7 },
  { type: 'galaxian', points: 2000, color: '#ff00ff', size: 7 },
  { type: 'bell', points: 3000, color: '#ffff00', size: 7 },
  { type: 'key', points: 5000, color: '#00ffff', size: 7 }
];

class Fruit {
  constructor() {
    this.active = false;
    this.col = 14;
    this.row = 17;
    this.x = this.col * TILE_SIZE + 8;
    this.y = this.row * TILE_SIZE + 8;
    this.level = 1;
    this.timer = 0;
    this.duration = 600;
    this.eaten = false;
    this.pointsEarned = 0;
    this.showTimer = 0;
  }

  spawn(level) {
    this.level = Math.min(level, FRUIT_TABLE.length);
    this.active = true;
    this.eaten = false;
    this.timer = 0;
    this.col = 14;
    this.row = 17;
    this.x = this.col * TILE_SIZE + 8;
    this.y = this.row * TILE_SIZE + 8;
  }

  update() {
    if (!this.active) return;
    this.timer++;
    if (this.timer >= this.duration) {
      this.active = false;
    }
  }

  eat() {
    if (!this.active || this.eaten) return 0;
    this.eaten = true;
    this.active = false;
    const fruitInfo = FRUIT_TABLE[this.level - 1] || FRUIT_TABLE[FRUIT_TABLE.length - 1];
    this.pointsEarned = fruitInfo.points;
    this.showTimer = 60;
    return fruitInfo.points;
  }

  render(ctx) {
    if (!this.active) return;
    const fruitInfo = FRUIT_TABLE[this.level - 1] || FRUIT_TABLE[FRUIT_TABLE.length - 1];

    ctx.fillStyle = fruitInfo.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, fruitInfo.size, 0, Math.PI * 2);
    ctx.fill();
  }

  reset() {
    this.active = false;
    this.eaten = false;
  }
}
```

---

### Task 5: Audio Manager

**Files:**
- Create: `pacman/audio.js`

- [ ] **Step 5.1: Write AudioManager class**

```js
class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = {};
    this.muted = false;
  }

  async loadSounds() {
    const soundList = [
      'chomp', 'power_pellet', 'ghost_frightened',
      'ghost_eaten', 'death', 'siren', 'level_start', 'fruit'
    ];

    for (const name of soundList) {
      try {
        const resp = await fetch(`sounds/${name}.wav`);
        const buffer = await resp.arrayBuffer();
        this.sounds[name] = await this.ctx.decodeAudioData(buffer);
      } catch (e) {
        console.warn(`Sound not loaded: ${name}`);
      }
    }
  }

  play(name, loop = false) {
    if (this.muted || !this.sounds[name]) return null;

    const source = this.ctx.createBufferSource();
    source.buffer = this.sounds[name];
    source.loop = loop;

    // Siren pitch increases as pellets decrease
    if (name === 'siren') {
      source.playbackRate.value = 0.8 + (1 - this.pelletRatio) * 0.4;
    }

    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(0);

    if (!loop) {
      source.onended = () => source.disconnect();
    }

    return source;
  }

  stop(source) {
    if (source) {
      try { source.stop(0); } catch (e) { /* already stopped */ }
    }
  }

  setPelletRatio(ratio) {
    this.pelletRatio = ratio;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
```

- [ ] **Step 5.2: Note on sound files**

Download WAV files from OpenGameArt.org and place in `pacman/sounds/`. For initial testing, the game runs silently if files are missing — audio is non-blocking.

---

### Task 6: Game Loop and State Machine

**Files:**
- Create: `pacman/game.js`

- [ ] **Step 6.1: Write the main game orchestrator**

```js
const STATE = {
  MENU: 'MENU',
  READY: 'READY',
  PLAYING: 'PLAYING',
  DYING: 'DYING',
  GAME_OVER: 'GAME_OVER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE'
};

const SCATTER_DURATIONS = [7, 7, 5, 5];
const CHASE_DURATIONS = [20, 20, 20, 1];
const FRIGHTENED_DURATION = 6;

const GHOST_NAMES = ['blink', 'pink', 'ink', 'clyd'];

class Game {
  constructor(canvasId, overlayId, scoreId, livesId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.overlay = document.getElementById(overlayId);
    this.overlayText = document.getElementById('overlay-text');
    this.scoreEl = document.getElementById(scoreId);
    this.livesEl = document.getElementById(livesId);

    this.maze = new Maze();
    this.pacman = new Pacman();
    this.fruit = new Fruit();

    this.ghosts = {
      blink: new Ghost('blink', GHOST_COLORS.blink, GHOST_SCATTER.blink),
      pink: new Ghost('pink', GHOST_COLORS.pink, GHOST_SCATTER.pink),
      ink: new Ghost('ink', GHOST_COLORS.ink, GHOST_SCATTER.ink),
      clyd: new Ghost('clyd', GHOST_COLORS.clyd, GHOST_SCATTER.clyd)
    };

    this.audio = null;
    this.state = STATE.MENU;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('pacman_highscore') || '0', 10);
    this.lives = 3;
    this.level = 1;
    this.frameCount = 0;
    this.stateTimer = 0;
    this.ghostModeTimer = 0;
    this.ghostModeIndex = 0;
    this.ghostCombo = 0;
    this.scorePopups = [];
    this.sirenSource = null;
    this.fruitSpawned = false;
    this.fruitEatCount = 0;
    this.keys = {};
    this.lastKey = '';
  }

  init() {
    this.setupInput();
    this.showOverlay('PAC-MAN', 0);
    this.gameLoop(0);
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      switch (key) {
        case 'ArrowUp': case 'w': case 'W': this.pacman.setDirection(0, -1); this.lastKey = key; break;
        case 'ArrowDown': case 's': case 'S': this.pacman.setDirection(0, 1); this.lastKey = key; break;
        case 'ArrowLeft': case 'a': case 'A': this.pacman.setDirection(-1, 0); this.lastKey = key; break;
        case 'ArrowRight': case 'd': case 'D': this.pacman.setDirection(1, 0); this.lastKey = key; break;
        case 'm': case 'M': if (this.audio) this.audio.toggleMute(); break;
      }

      if (this.state === STATE.MENU) {
        this.startLevel();
      } else if (this.state === STATE.GAME_OVER) {
        this.restart();
      }
    });
  }

  showOverlay(text, delay = 60) {
    this.overlay.classList.remove('hidden');
    this.overlayText.textContent = text;
    this.stateTimer = delay;
  }

  hideOverlay() {
    this.overlay.classList.add('hidden');
  }

  startLevel() {
    this.state = STATE.READY;
    this.hideOverlay();
    this.maze.reset();
    this.pacman.reset();
    for (const g of GHOST_NAMES) this.ghosts[g].reset();
    this.fruit.reset();
    this.ghostModeIndex = 0;
    this.ghostModeTimer = 0;
    this.ghostCombo = 0;
    this.fruitSpawned = false;
    this.fruitEatCount = 0;
    this.scorePopups = [];

    if (this.audio) {
      this.audio.play('level_start');
    }

    this.stateTimer = 120; // 2 seconds "READY!"
    this.showOverlay('READY!', 120);
  }

  restart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.updateHUD();
    this.startLevel();
  }

  updateHUD() {
    this.scoreEl.textContent = this.score;

    this.livesEl.innerHTML = '';
    for (let i = 0; i < this.lives; i++) {
      const div = document.createElement('div');
      div.className = 'life-icon';
      this.livesEl.appendChild(div);
    }
  }

  gameLoop(timestamp) {
    this.update();
    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update() {
    this.frameCount++;

    switch (this.state) {
      case STATE.MENU:
        return;

      case STATE.READY:
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.hideOverlay();
          this.state = STATE.PLAYING;
        }
        return;

      case STATE.PLAYING:
        this.updatePlaying();
        break;

      case STATE.DYING:
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.lives--;
          this.updateHUD();
          if (this.lives <= 0) {
            this.state = STATE.GAME_OVER;
            if (this.score > this.highScore) {
              this.highScore = this.score;
              localStorage.setItem('pacman_highscore', this.highScore.toString());
            }
            this.showOverlay('GAME OVER');
          } else {
            this.startLevel();
          }
        }
        return;

      case STATE.GAME_OVER:
        return;

      case STATE.LEVEL_COMPLETE:
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.level++;
          this.startLevel();
        }
        return;
    }
  }

  updatePlaying() {
    // Ghost mode cycling
    this.ghostModeTimer++;
    const currentDur = (this.ghostModeIndex % 2 === 0)
      ? SCATTER_DURATIONS[Math.floor(this.ghostModeIndex / 2) % SCATTER_DURATIONS.length] * 60
      : CHASE_DURATIONS[Math.floor(this.ghostModeIndex / 2) % CHASE_DURATIONS.length] * 60;

    if (this.ghostModeTimer >= currentDur) {
      this.ghostModeIndex++;
      this.ghostModeTimer = 0;
      const newMode = this.ghostModeIndex % 2 === 0 ? 'SCATTER' : 'CHASE';
      for (const g of GHOST_NAMES) {
        if (this.ghosts[g].mode !== 'FRIGHTENED' && this.ghosts[g].mode !== 'EATEN') {
          this.ghosts[g].mode = newMode;
          // Reverse direction on mode change
          this.ghosts[g].dir = { dx: -this.ghosts[g].dir.dx, dy: -this.ghosts[g].dir.dy };
        }
      }
    }

    // Update entities
    this.pacman.update(this.maze);

    for (const g of GHOST_NAMES) {
      this.ghosts[g].update(this.maze, this.pacman, this.ghosts.blink, this.frameCount);
    }

    this.fruit.update();

    // Pellet ratio for siren
    if (this.audio && this.maze.totalPellets > 0) {
      this.audio.setPelletRatio(this.maze.pelletsRemaining / this.maze.totalPellets);
    }

    // Check pellet eating
    const pelletType = this.maze.getTile(this.pacman.col, this.pacman.row);
    if (this.pacman.isAtTileCenter()) {
      if (pelletType === T.PELLET) {
        this.maze.removePellet(this.pacman.col, this.pacman.row);
        this.score += 10;
        this.addScorePopup(this.pacman.col, this.pacman.row, 10);
        this.updateHUD();
        if (this.audio) this.audio.play('chomp');

      } else if (pelletType === T.POWER_PELLET) {
        this.maze.removePellet(this.pacman.col, this.pacman.row);
        this.score += 50;
        this.addScorePopup(this.pacman.col, this.pacman.row, 50);
        this.updateHUD();
        this.ghostCombo = 0;
        for (const g of GHOST_NAMES) {
          this.ghosts[g].setFrightened(FRIGHTENED_DURATION * 60);
        }
        if (this.audio) {
          if (this.sirenSource) this.audio.stop(this.sirenSource);
          this.sirenSource = this.audio.play('power_pellet');
        }
      }
    }

    // Check fruit
    if (!this.fruitSpawned && this.maze.pelletsRemaining <= this.maze.totalPellets - 70) {
      this.fruit.spawn(this.level);
      this.fruitSpawned = true;
    }

    if (this.fruit.active && this.pacman.isAtTileCenter() &&
        this.pacman.col === this.fruit.col && this.pacman.row === this.fruit.row) {
      const pts = this.fruit.eat();
      if (pts > 0) {
        this.score += pts;
        this.addScorePopup(this.fruit.col, this.fruit.row, pts);
        this.updateHUD();
        if (this.audio) this.audio.play('fruit');
      }
    }

    // Check ghost collision
    for (const g of GHOST_NAMES) {
      const ghost = this.ghosts[g];
      if (ghost.inHouse) continue;
      if (ghost.mode === 'EATEN') continue;

      const dist = Math.abs(this.pacman.col - ghost.col) + Math.abs(this.pacman.row - ghost.row);
      if (dist < 1.5) {
        if (ghost.mode === 'FRIGHTENED') {
          ghost.eat();
          this.ghostCombo++;
          const pts = 200 * Math.pow(2, this.ghostCombo - 1);
          this.score += pts;
          this.addScorePopup(ghost.col, ghost.row, pts);
          this.updateHUD();
          if (this.audio) this.audio.play('ghost_eaten');
        } else {
          // Pacman dies
          this.pacman.alive = false;
          this.state = STATE.DYING;
          this.stateTimer = 120;
          if (this.audio) {
            this.audio.play('death');
          }
          return;
        }
      }
    }

    // Check all pellets eaten
    if (this.maze.isAllPelletsEaten()) {
      this.state = STATE.LEVEL_COMPLETE;
      this.stateTimer = 120;
    }

    // Update score popups
    this.scorePopups = this.scorePopups.filter(p => {
      p.life--;
      p.y -= 1;
      return p.life > 0;
    });
  }

  addScorePopup(col, row, pts) {
    this.scorePopups.push({
      x: col * TILE_SIZE + 8,
      y: row * TILE_SIZE,
      pts: pts,
      life: 60
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 448, 496);

    this.maze.render(ctx, this.frameCount);
    this.fruit.render(ctx);

    for (const g of GHOST_NAMES) {
      this.ghosts[g].render(ctx, this.frameCount);
    }

    this.pacman.render(ctx);

    // Render score popups
    ctx.fillStyle = '#00ffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (const p of this.scorePopups) {
      ctx.globalAlpha = p.life / 60;
      ctx.fillText(p.pts, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game('game-canvas', 'overlay', 'score-value', 'lives-wrap');
  game.audio = new AudioManager();
  game.audio.loadSounds();
  window.game = game;
  game.init();
});
```

---

### Task 7: Polish and Tuning

**Files:**
- Modify: `pacman/game.js`

- [ ] **Step 7.1: Add Blinky speed-up when <20 pellets remain**

In the `updatePlaying` method, add after ghost updates:

```js
// Blinky speed boost
if (this.maze.pelletsRemaining < 20) {
  this.ghosts.blink.speed = 1.8;
} else {
  this.ghosts.blink.speed = 1.5;
}
```

- [ ] **Step 7.2: Add high score display to HUD**

In `index.html`, add after the score-wrap div:

```html
<div id="highscore-wrap">
  <span id="highscore-label">HIGH SCORE</span>
  <span id="highscore-value">0</span>
</div>
```

In `game.js` `updateHUD()`, add:
```js
document.getElementById('highscore-value').textContent = this.highScore;
```

- [ ] **Step 7.3: Verify full game in browser**

Open `pacman/index.html` in a browser. Expected:
- Menu screen shows "PAC-MAN"
- Press any key → "READY!" → game starts
- Arrow keys move Pacman
- Ghosts chase with proper AI
- Power pellets turn ghosts blue
- Eating all pellets advances level
- Dying loses a life; all lives lost shows "GAME OVER"
- High score persists across refreshes
