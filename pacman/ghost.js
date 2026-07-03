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
    this.dir = { dx: 0, dy: -1 };
    this.speed = 1.5;
    this.progress = 0;
    this.mode = 'SCATTER';
    this.frightenedTimer = 0;
    this.inHouse = name !== 'blink';
    this.houseTimer = name === 'pink' ? 0 : name === 'ink' ? 50 : 100;
    this.released = name === 'blink';
    this.ghostHouseBob = 0;
    this.syncPosition();
  }

  syncPosition() {
    this.x = this.col * TILE_SIZE + 8 + this.dir.dx * this.progress * TILE_SIZE;
    this.y = this.row * TILE_SIZE + 8 + this.dir.dy * this.progress * TILE_SIZE;
  }

  getTargetTile(pacman, blinky) {
    if (this.mode === 'SCATTER') return this.scatterTarget;
    if (this.mode === 'FRIGHTENED') return null;
    if (this.mode === 'EATEN') return { col: 14, row: 14 };

    switch (this.name) {
      case 'blink':
        return { col: pacman.col, row: pacman.row };
      case 'pink':
        return {
          col: pacman.col + pacman.dir.dx * 4,
          row: pacman.row + pacman.dir.dy * 4
        };
      case 'ink': {
        const ahead = {
          col: pacman.col + pacman.dir.dx * 2,
          row: pacman.row + pacman.dir.dy * 2
        };
        return {
          col: 2 * ahead.col - blinky.col,
          row: 2 * ahead.row - blinky.row
        };
      }
      case 'clyd': {
        const dx = pacman.col - this.col;
        const dy = pacman.row - this.row;
        const distSq = dx * dx + dy * dy;
        if (distSq > 64) return { col: pacman.col, row: pacman.row };
        return this.scatterTarget;
      }
      default:
        return this.scatterTarget;
    }
  }

  chooseDirection(maze, pacman, blinky) {
    const target = this.getTargetTile(pacman, blinky);

    const available = [];
    for (const d of DIRS) {
      const nc = this.col + d.dx;
      const nr = this.row + d.dy;
      if (maze.isWalkableByGhost(nc, nr)) {
        available.push(d);
      }
    }

    if (available.length === 0) {
      this.dir = { dx: -this.dir.dx, dy: -this.dir.dy };
      return;
    }

    let candidates;
    if (this.mode === 'FRIGHTENED') {
      candidates = available;
    } else {
      candidates = available.filter(d =>
        !(d.dx === -this.dir.dx && d.dy === -this.dir.dy)
      );
      if (candidates.length === 0) candidates = available;
    }

    if (this.mode === 'FRIGHTENED') {
      this.dir = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      let best = candidates[0];
      let bestDist = Infinity;
      const tx = this.mode === 'EATEN' ? 14 : target.col;
      const ty = this.mode === 'EATEN' ? 14 : target.row;
      for (const d of candidates) {
        const nc = this.col + d.dx;
        const nr = this.row + d.dy;
        const dist = (nc - tx) ** 2 + (nr - ty) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = d;
        }
      }
      this.dir = best;
    }
  }

  update(maze, pacman, blinky, frameCount) {
    if (this.inHouse) {
      this.houseTimer--;
      this.ghostHouseBob = Math.sin(frameCount / 10) * 2;
      if (this.houseTimer <= 0) {
        this.released = true;
        this.inHouse = false;
        this.col = 14;
        this.row = 11;
        this.progress = 0;
        this.dir = { dx: 0, dy: -1 };
        this.syncPosition();
      }
      return;
    }

    if (this.frightenedTimer > 0) {
      this.frightenedTimer--;
      if (this.frightenedTimer <= 0 && this.mode === 'FRIGHTENED') {
        this.mode = 'CHASE';
      }
    }

    if (this.mode === 'EATEN' && this.col === 14 && this.row === 14) {
      this.mode = 'CHASE';
      this.speed = 1.5;
    }

    let currentSpeed = this.speed;
    if (this.col < 0 || this.col >= COLS) {
      currentSpeed = this.speed * 0.5;
    }

    this.progress += currentSpeed / TILE_SIZE;

    if (this.progress >= 0.999) {
      this.progress -= 1;
      this.col += this.dir.dx;
      this.row += this.dir.dy;

      if (this.col < 0 && this.dir.dx < 0) {
        this.col = COLS - 1;
      } else if (this.col >= COLS && this.dir.dx > 0) {
        this.col = 0;
      }

      this.chooseDirection(maze, pacman, blinky);
    }

    this.syncPosition();
  }

  setFrightened(duration) {
    if (this.mode !== 'EATEN') {
      this.mode = 'FRIGHTENED';
      this.frightenedTimer = duration;
      this.dir = { dx: -this.dir.dx, dy: -this.dir.dy };
    }
  }

  eat() {
    this.mode = 'EATEN';
    this.speed = 3;
    this.frightenedTimer = 0;
    this.dir = { dx: -this.dir.dx, dy: -this.dir.dy };
  }

  render(ctx, frameCount) {
    const x = this.x;
    const y = this.y;

    if (this.inHouse) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(x, y + this.ghostHouseBob, 4, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (this.mode === 'EATEN') {
      this.drawEyes(ctx, x, y);
      return;
    }

    let bodyColor;
    if (this.mode === 'FRIGHTENED') {
      if (this.frightenedTimer < 60 && Math.floor(frameCount / 8) % 2 === 0) {
        bodyColor = '#fff';
      } else {
        bodyColor = '#2121de';
      }
    } else {
      bodyColor = this.color;
    }

    const r = TILE_SIZE / 2;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(x, y - 2, r, Math.PI, 0);
    ctx.lineTo(x + r, y + r - 2);

    const bw = r / 2;
    for (let i = 0; i < 4; i++) {
      const bx = x + r - i * bw;
      ctx.quadraticCurveTo(bx - bw / 2, y + r + 3, bx - bw, y + r - 4);
    }

    ctx.closePath();
    ctx.fill();

    if (this.mode === 'FRIGHTENED') {
      ctx.fillStyle = '#ffb8ae';
      ctx.beginPath();
      ctx.arc(x - 2, y - 1, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 2, y - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffb8ae';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 3);
      for (let i = -3; i <= 3; i += 2) {
        ctx.lineTo(x + i, y + 3 + (Math.abs(i) % 4 === 1 ? 2 : -2));
      }
      ctx.stroke();
    } else {
      this.drawEyes(ctx, x, y);
    }
  }

  drawEyes(ctx, x, y) {
    const dx = this.dir.dx || 0;
    const dy = this.dir.dy || 0;
    const eyeOffX = dx * 1.5;
    const eyeOffY = dy * 1.5;

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 1, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2121de';
    ctx.beginPath();
    ctx.arc(x - 3 + eyeOffX, y - 1 + eyeOffY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x + 3, y - 1, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2121de';
    ctx.beginPath();
    ctx.arc(x + 3 + eyeOffX, y - 1 + eyeOffY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  reset() {
    this.col = this.home.col;
    this.row = this.home.row;
    this.dir = { dx: 0, dy: -1 };
    this.speed = 1.5;
    this.progress = 0;
    this.mode = 'SCATTER';
    this.frightenedTimer = 0;
    this.inHouse = this.name !== 'blink';
    this.houseTimer = this.name === 'pink' ? 0 : this.name === 'ink' ? 50 : 100;
    this.released = this.name === 'blink';
    this.ghostHouseBob = 0;
    this.syncPosition();
  }
}
