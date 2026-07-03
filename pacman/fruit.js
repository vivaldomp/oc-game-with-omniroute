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
    this.level = 1;
    this.timer = 0;
    this.duration = 600;
    this.eaten = false;
  }

  spawn(level) {
    this.level = Math.min(level, FRUIT_TABLE.length);
    this.active = true;
    this.eaten = false;
    this.timer = 0;
    this.col = 14;
    this.row = 17;
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
    return fruitInfo.points;
  }

  render(ctx) {
    if (!this.active) return;
    const fruitInfo = FRUIT_TABLE[this.level - 1] || FRUIT_TABLE[FRUIT_TABLE.length - 1];
    const x = this.col * TILE_SIZE + 8;
    const y = this.row * TILE_SIZE + 8;
    ctx.fillStyle = fruitInfo.color;
    ctx.beginPath();
    ctx.arc(x, y, fruitInfo.size, 0, Math.PI * 2);
    ctx.fill();
  }

  reset() {
    this.active = false;
    this.eaten = false;
  }
}
