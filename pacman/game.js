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
    this.highScoreEl = document.getElementById('highscore-value');

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
    this.frightSource = null;
    this.fruitSpawned = false;
    this.fruitEatCount = 0;
    this.chompToggle = false;
    this.musicPlaying = false;
  }

  init() {
    this.setupInput();
    this.setupTouchControls();
    this.setupVolumeControls();
    this.updateHighScore();
    this.showOverlay('PAC-MAN');
    this.updateDpadPulse();
    this.gameLoop(0);
  }

  setupTouchControls() {
    const dpad = document.getElementById('dpad');
    if (!dpad) return;

    const startBtn = dpad.querySelector('.start-btn');

    dpad.addEventListener('touchstart', (e) => {
      const btn = e.target.closest('.dpad-btn');
      if (!btn) return;
      e.preventDefault();

      if (this.audio) this.audio.unlock();

      if (this.state === STATE.MENU) {
        this.startLevel();
        return;
      }
      if (this.state === STATE.GAME_OVER) {
        this.restart();
        return;
      }

      const dir = btn.dataset.dir;
      if (dir) {
        switch (dir) {
          case 'up': this.pacman.setDirection(0, -1); break;
          case 'down': this.pacman.setDirection(0, 1); break;
          case 'left': this.pacman.setDirection(-1, 0); break;
          case 'right': this.pacman.setDirection(1, 0); break;
        }
      }
    }, { passive: false });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && startBtn) startBtn.classList.remove('pulse');
    });
  }

  updateDpadPulse() {
    const btn = document.querySelector('.start-btn');
    if (!btn) return;
    if (this.state === STATE.MENU || this.state === STATE.GAME_OVER) {
      btn.classList.add('pulse');
    } else {
      btn.classList.remove('pulse');
    }
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      if (this.audio) this.audio.unlock();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 's', 'S', 'm', 'M', 'w', 'W', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
      }

      if (this.state === STATE.MENU) {
        this.startLevel();
      } else if (this.state === STATE.GAME_OVER) {
        this.restart();
      }

      const key = e.key;
      switch (key) {
        case 'ArrowUp': case 'w': case 'W': this.pacman.setDirection(0, -1); break;
        case 'ArrowDown': this.pacman.setDirection(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': this.pacman.setDirection(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': this.pacman.setDirection(1, 0); break;
        case 's': case 'S':
          if (e.shiftKey) {
            if (this.audio) this.toggleSfxMute();
          } else {
            this.pacman.setDirection(0, 1);
          }
          break;
        case 'm': case 'M':
          if (e.shiftKey) {
            if (this.audio) this.toggleMusicMute();
          } else {
            if (this.audio) this.audio.toggleMute();
          }
          break;
      }
    });
  }

  setupVolumeControls() {
    this.sfxVolLevel = 4;
    this.musicVolLevel = 4;
    if (this.audio) {
      this.audio.setSfxVolume(1);
      this.audio.setMusicVolume(1);
    }
    this._sfxMuted = false;
    this._musicMuted = false;
    this._sfxBars = document.getElementById('sfx-bars');
    this._musicBars = document.getElementById('music-bars');
    this.renderVolumeBars();

    document.querySelectorAll('.vol-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.audio) return;
        const channel = btn.dataset.channel;
        const dir = parseInt(btn.dataset.dir, 10);
        if (channel === 'sfx') {
          this._sfxMuted = false;
          this.sfxVolLevel = Math.max(0, Math.min(4, this.sfxVolLevel + dir));
          this.audio.setSfxVolume(this.sfxVolLevel / 4);
        } else {
          this._musicMuted = false;
          this.musicVolLevel = Math.max(0, Math.min(4, this.musicVolLevel + dir));
          this.audio.setMusicVolume(this.musicVolLevel / 4);
        }
        this.renderVolumeBars();
      });
    });
  }

  renderVolumeBars() {
    const sfxText = '█'.repeat(this.sfxVolLevel) + '░'.repeat(4 - this.sfxVolLevel);
    const musicText = '█'.repeat(this.musicVolLevel) + '░'.repeat(4 - this.musicVolLevel);
    if (this._sfxBars) this._sfxBars.textContent = sfxText;
    if (this._musicBars) this._musicBars.textContent = musicText;
  }

  toggleSfxMute() {
    this._sfxMuted = !this._sfxMuted;
    if (this._sfxMuted) {
      this.audio.setSfxVolume(0);
    } else {
      this.audio.setSfxVolume(this.sfxVolLevel / 4);
    }
  }

  toggleMusicMute() {
    this._musicMuted = !this._musicMuted;
    if (this._musicMuted) {
      this.audio.setMusicVolume(0);
    } else {
      this.audio.setMusicVolume(this.musicVolLevel / 4);
    }
  }

  showOverlay(text) {
    this.overlay.classList.remove('hidden');
    this.overlayText.textContent = text;
  }

  hideOverlay() {
    this.overlay.classList.add('hidden');
  }

  startLevel() {
    this.state = STATE.READY;
    if (this.audio) this.audio.stopMusic();
    this.musicPlaying = false;
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
    if (this.frightSource) this.audio.stop(this.frightSource);
    this.frightSource = null;

    if (this.audio && this.audio.sounds['start']) {
      this.audio.play('start');
    }

    this.stateTimer = 120;
    this.showOverlay('READY!');
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
    this.updateHighScore();
    this.livesEl.innerHTML = '';
    for (let i = 0; i < this.lives; i++) {
      const div = document.createElement('div');
      div.className = 'life-icon';
      this.livesEl.appendChild(div);
    }
  }

  updateHighScore() {
    if (this.highScoreEl) {
      this.highScoreEl.textContent = this.highScore;
    }
  }

  gameLoop(timestamp) {
    this.update();
    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update() {
    this.frameCount++;
    this.updateDpadPulse();

    switch (this.state) {
      case STATE.MENU:
        return;

      case STATE.READY:
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.hideOverlay();
          this.state = STATE.PLAYING;
          if (this.audio && this.audio.sounds['siren']) {
            this.audio.stop(this.sirenSource);
            this.sirenSource = this.audio.play('siren', true);
          }
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
              this.updateHighScore();
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
    this.ghostModeTimer++;
    const phaseIdx = Math.floor(this.ghostModeIndex / 2);
    const isScatter = this.ghostModeIndex % 2 === 0;
    const currentDur = (isScatter
      ? SCATTER_DURATIONS[phaseIdx % SCATTER_DURATIONS.length]
      : CHASE_DURATIONS[phaseIdx % CHASE_DURATIONS.length]) * 60;

    if (this.ghostModeTimer >= currentDur) {
      this.ghostModeIndex++;
      this.ghostModeTimer = 0;
      const newMode = this.ghostModeIndex % 2 === 0 ? 'SCATTER' : 'CHASE';
      for (const g of GHOST_NAMES) {
        if (this.ghosts[g].mode !== 'FRIGHTENED' && this.ghosts[g].mode !== 'EATEN') {
          this.ghosts[g].mode = newMode;
          this.ghosts[g].dir = { dx: -this.ghosts[g].dir.dx, dy: -this.ghosts[g].dir.dy };
        }
      }
    }

    if (this.pacman.progress < 0.001) {
      const pelletType = this.maze.getTile(this.pacman.col, this.pacman.row);
      if (pelletType === T.PELLET) {
        this.maze.removePellet(this.pacman.col, this.pacman.row);
        this.score += 10;
        this.addScorePopup(this.pacman.col, this.pacman.row, 10);
        this.updateHUD();
        if (this.audio) {
          this.chompToggle = !this.chompToggle;
          this.audio.play(this.chompToggle ? 'eat_dot_0' : 'eat_dot_1');
        }
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
          if (this.frightSource) this.audio.stop(this.frightSource);
          this.frightSource = this.audio.play('fright_loop', true);
        }
      }

      if (this.fruit.active &&
          this.pacman.col === this.fruit.col && this.pacman.row === this.fruit.row) {
        const pts = this.fruit.eat();
        if (pts > 0) {
          this.score += pts;
          this.addScorePopup(this.fruit.col, this.fruit.row, pts);
          this.updateHUD();
          if (this.audio) this.audio.play('eat_fruit');
        }
      }
    }

    this.pacman.update(this.maze);

    for (const g of GHOST_NAMES) {
      this.ghosts[g].update(this.maze, this.pacman, this.ghosts.blink, this.frameCount);
    }

    if (this.frightSource && this.audio) {
      const anyFrightened = GHOST_NAMES.some(g => this.ghosts[g].mode === 'FRIGHTENED');
      if (!anyFrightened) {
        this.audio.stop(this.frightSource);
        this.frightSource = null;
        if (this.audio.sounds['siren']) {
          this.sirenSource = this.audio.play('siren', true);
        }
      }
    }

    this.fruit.update();

    if (this.audio && this.maze.totalPellets > 0) {
      this.audio.setPelletRatio(this.maze.pelletsRemaining / this.maze.totalPellets);
    }

    if (!this.fruitSpawned && this.maze.pelletsRemaining <= this.maze.totalPellets - 70) {
      this.fruit.spawn(this.level);
      this.fruitSpawned = true;
    }

    for (const g of GHOST_NAMES) {
      const ghost = this.ghosts[g];
      if (ghost.inHouse || ghost.mode === 'EATEN') continue;

      if (this.pacman.col === ghost.col && this.pacman.row === ghost.row) {
        if (ghost.mode === 'FRIGHTENED') {
          ghost.eat();
          this.ghostCombo++;
          const pts = 200 * Math.pow(2, this.ghostCombo - 1);
          this.score += pts;
          this.addScorePopup(ghost.col, ghost.row, pts);
          this.updateHUD();
          if (this.audio) {
            this.audio.play('eat_ghost');
            this.audio.play('eyes');
          }
        } else {
          this.pacman.alive = false;
          this.state = STATE.DYING;
          this.stateTimer = 120;
          if (this.audio) {
            this.audio.stopMusic();
            this.musicPlaying = false;
          }
          if (this.audio) {
            this.audio.stop(this.sirenSource);
            if (this.frightSource) this.audio.stop(this.frightSource);
            this.frightSource = null;
            this.audio.play('death');
          }
          return;
        }
      }
    }

    if (this.maze.isAllPelletsEaten()) {
      this.state = STATE.LEVEL_COMPLETE;
      this.stateTimer = 120;
      if (this.audio) {
        this.audio.stopMusic();
        if (this.frightSource) this.audio.stop(this.frightSource);
        this.frightSource = null;
        this.audio.playMusic('intermission');
        this.musicPlaying = true;
      }
    }

    this.scorePopups = this.scorePopups.filter(p => {
      p.life--;
      p.y--;
      return p.life > 0;
    });

    if (this.maze.pelletsRemaining < 20) {
      this.ghosts.blink.speed = 1.8;
    } else {
      this.ghosts.blink.speed = 1.5;
    }
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

window.addEventListener('DOMContentLoaded', async () => {
  const game = new Game('game-canvas', 'overlay', 'score-value', 'lives-wrap');
  game.audio = new AudioManager();
  await game.audio.loadSounds();
  window.game = game;
  game.init();
});
