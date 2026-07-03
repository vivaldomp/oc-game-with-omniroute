class Pacman {
  constructor() {
    this.col = 14;
    this.row = 23;
    this.dir = {dx: 0, dy: 0};
    this.nextDir = {dx: 0, dy: 0};
    this.speed = 1.6;
    this.progress = 0;
    this.mouthAngle = 0;
    this.mouthOpening = true;
    this.alive = true;
    this.deathFrame = 0;
    this.moving = false;
    this.syncPosition();
  }

  syncPosition() {
    this.x = this.col * TILE_SIZE + 8 + this.dir.dx * this.progress * TILE_SIZE;
    this.y = this.row * TILE_SIZE + 8 + this.dir.dy * this.progress * TILE_SIZE;
  }

  setDirection(dx, dy) {
    this.nextDir = {dx, dy};
  }

  update(maze) {
    if (!this.alive) {
      this.deathFrame++;
      return;
    }

    if (this.progress < 0.001) {
      const nextCol = this.col + this.nextDir.dx;
      const nextRow = this.row + this.nextDir.dy;
      if (maze.isWalkable(nextCol, nextRow)) {
        this.dir = {dx: this.nextDir.dx, dy: this.nextDir.dy};
      }

      const currCol = this.col + this.dir.dx;
      const currRow = this.row + this.dir.dy;
      if (!maze.isWalkable(currCol, currRow)) {
        this.dir = {dx: 0, dy: 0};
      }
    }

    this.moving = this.dir.dx !== 0 || this.dir.dy !== 0;

    if (this.moving) {
      this.progress += this.speed / TILE_SIZE;

      if (this.progress >= 0.999) {
        this.progress -= 1;
        this.col += this.dir.dx;
        this.row += this.dir.dy;

        if (this.col < 0 && this.dir.dx < 0) {
          this.col = 27;
        } else if (this.col >= 28 && this.dir.dx > 0) {
          this.col = 0;
        }
      }
    }

    this.syncPosition();

    if (this.moving) {
      if (this.mouthOpening) {
        this.mouthAngle += 0.05;
        if (this.mouthAngle >= 0.45) {
          this.mouthAngle = 0.45;
          this.mouthOpening = false;
        }
      } else {
        this.mouthAngle -= 0.05;
        if (this.mouthAngle <= 0) {
          this.mouthAngle = 0;
          this.mouthOpening = true;
        }
      }
    } else {
      this.mouthAngle = 0;
    }
  }

  render(ctx) {
    if (!this.alive) {
      const p = this.deathFrame / 60;
      if (p >= 1) return;
      const radius = 8 * (1 - p * 0.5);
      if (radius <= 0) return;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, p * Math.PI * 2, Math.PI * 2 - p * Math.PI * 2);
      ctx.lineTo(this.x, this.y);
      ctx.fill();
      return;
    }

    let angle = 0;
    if (this.dir.dx === -1) angle = Math.PI;
    else if (this.dir.dy === -1) angle = -Math.PI / 2;
    else if (this.dir.dy === 1) angle = Math.PI / 2;

    const mouth = this.moving ? this.mouthAngle : 0;
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 8, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.lineTo(this.x, this.y);
    ctx.fill();
  }

  reset() {
    this.col = 14;
    this.row = 23;
    this.dir = {dx: 0, dy: 0};
    this.nextDir = {dx: 0, dy: 0};
    this.speed = 1.6;
    this.progress = 0;
    this.mouthAngle = 0;
    this.mouthOpening = true;
    this.alive = true;
    this.deathFrame = 0;
    this.moving = false;
    this.syncPosition();
  }
}
