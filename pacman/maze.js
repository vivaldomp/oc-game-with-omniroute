const TILE_SIZE = 16;
const COLS = 28;
const ROWS = 31;

const TUNNEL_ROWS = new Set([11, 12]);

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
  [0,0,0,0,0,0,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,4,4,0,0,4,4,1,0,0,0,2,0,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
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
    if (row < 0 || row >= ROWS) return false;
    if (col < 0 || col >= COLS) {
      if (!TUNNEL_ROWS.has(row)) return false;
      const wrappedCol = ((col % COLS) + COLS) % COLS;
      const tile = this.data[row][wrappedCol];
      return tile !== T.WALL && tile !== T.GHOST_HOUSE;
    }
    const tile = this.data[row][col];
    return tile !== T.WALL && tile !== T.GHOST_HOUSE;
  }

  isWalkableByGhost(col, row) {
    if (row < 0 || row >= ROWS) return false;
    if (col < 0 || col >= COLS) {
      if (!TUNNEL_ROWS.has(row)) return false;
      const wrappedCol = ((col % COLS) + COLS) % COLS;
      return this.data[row][wrappedCol] !== T.WALL;
    }
    const tile = this.data[row][col];
    return tile !== T.WALL;
  }

  getTile(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return T.WALL;
    return this.data[row][col];
  }

  removePellet(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return 0;
    const tile = this.data[row][col];
    if (tile === T.PELLET || tile === T.POWER_PELLET) {
      this.data[row][col] = T.EMPTY;
      this.pelletsRemaining = Math.max(0, this.pelletsRemaining - 1);
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
