# Pacman Background Music — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add background music with independent volume control to the Pacman arcade game.

**Architecture:** Extend `AudioManager` with a second gain node for music tracks, drive state-based music transitions in `Game`, and add HUD volume controls for both SFX and music channels.

**Tech Stack:** Vanilla JS, HTML Canvas, Web Audio API

---

### Task 1: Extend AudioManager with Dual Gain Nodes

**Files:**
- Modify: `pacman/audio.js:1-64`

- [ ] **Step 1: Add musicGain node and currentMusic track to constructor**

Replace the constructor to create both gain nodes and store a reference for the current music source:

```js
class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = {};
    this.muted = false;
    this.pelletRatio = 1;
    this.currentMusic = null;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.3;
    this.sfxGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.ctx.destination);
  }
```

- [ ] **Step 2: Add music filenames to loadSounds()**

Replace the `soundList` array to include the four music tracks:

```js
async loadSounds() {
  const soundList = [
    'chomp', 'power_pellet', 'ghost_frightened',
    'ghost_eaten', 'death', 'siren', 'level_start', 'fruit',
    'music_menu', 'music_gameplay', 'music_level_complete', 'music_game_over'
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
```

- [ ] **Step 3: Reroute play() to use sfxGain**

In the `play(name, loop)` method, change `gain.connect(this.ctx.destination)` to `gain.connect(this.sfxGain)`:

```js
play(name, loop = false) {
  if (this.muted || !this.sounds[name]) return null;

  const source = this.ctx.createBufferSource();
  source.buffer = this.sounds[name];
  source.loop = loop;

  if (name === 'siren') {
    source.playbackRate.value = 0.8 + (1 - this.pelletRatio) * 0.4;
  }

  const gain = this.ctx.createGain();
  gain.gain.value = 0.3;
  source.connect(gain);
  gain.connect(this.sfxGain);
  source.start(0);

  if (!loop) {
    source.onended = () => source.disconnect();
  }

  return source;
}
```

- [ ] **Step 4: Add playMusic() and stopMusic() methods**

Add these methods after `stop()`:

```js
playMusic(name) {
  this.stopMusic();
  if (this.muted || !this.sounds[name]) return;

  const source = this.ctx.createBufferSource();
  source.buffer = this.sounds[name];
  source.loop = true;
  source.connect(this.musicGain);
  source.start(0);
  this.currentMusic = source;
}

stopMusic() {
  if (this.currentMusic) {
    try { this.currentMusic.stop(0); } catch (e) { /* already stopped */ }
    this.currentMusic = null;
  }
}
```

- [ ] **Step 5: Add setMusicVolume(), setSfxVolume(), and toggleMuteMusic/Sfx**

Add after `toggleMute()`:

```js
setMusicVolume(v) {
  this.musicGain.gain.value = Math.max(0, Math.min(1, v));
}

setSfxVolume(v) {
  this.sfxGain.gain.value = Math.max(0, Math.min(1, v));
}

toggleMute() {
  this.muted = !this.muted;
  if (this.muted) {
    this._prevSfxVol = this.sfxGain.gain.value;
    this._prevMusicVol = this.musicGain.gain.value;
    this.sfxGain.gain.value = 0;
    this.musicGain.gain.value = 0;
  } else {
    this.sfxGain.gain.value = this._prevSfxVol ?? 0.3;
    this.musicGain.gain.value = this._prevMusicVol ?? 0.3;
  }
  return this.muted;
}
```

- [ ] **Step 6: Verify file loads without errors**

Run: `npx http-server . -p 8080 -c-1` (from project root) and open `http://localhost:8080/pacman/`. Check browser console — no audio errors expected (files will 404 until assets are added, but that's handled with `console.warn`).

---

### Task 2: Add State-Driven Music to Game

**Files:**
- Modify: `pacman/game.js`

- [ ] **Step 1: Add musicMenuSource/game over track reference to constructor**

Replace:
```js
this.audio = null;
```
with:
```js
this.audio = null;
this.musicPlaying = false;
```

- [ ] **Step 2: Play menu music on init**

In `init()`, after `this.showOverlay('PAC-MAN')`, add:
```js
if (this.audio) this.audio.playMusic('music_menu');
```

- [ ] **Step 3: Stop music during startLevel (READY state)**

In `startLevel()`, after `this.state = STATE.READY`, add:
```js
this.audio.stopMusic();
this.musicPlaying = false;
```

- [ ] **Step 4: Start gameplay music when PLAYING starts**

In `update()`, in the `STATE.READY` branch where state changes to `STATE.PLAYING`, after `this.state = STATE.PLAYING`, add:
```js
if (this.audio && !this.musicPlaying) {
  this.audio.playMusic('music_gameplay');
  this.musicPlaying = true;
}
```

- [ ] **Step 5: Stop music on death**

In `updatePlaying()`, in the `death` collision branch (around line 283-288), after `this.state = STATE.DYING`, add:
```js
this.audio.stopMusic();
this.musicPlaying = false;
```

- [ ] **Step 6: Play game over music when lives reach 0**

In `update()`, in the `STATE.DYING` branch where `this.lives <= 0`, after `this.showOverlay('GAME OVER')`, add:
```js
if (this.audio) this.audio.playMusic('music_game_over');
```

- [ ] **Step 7: Play level complete jingle**

In `updatePlaying()`, in the `isAllPelletsEaten()` branch (around line 292-295), after `this.stateTimer = 120`, add:
```js
this.audio.stopMusic();
if (this.audio) this.audio.playMusic('music_level_complete');
```

---

### Task 3: Volume UI Controls in HUD

**Files:**
- Modify: `pacman/index.html`
- Modify: `pacman/style.css`
- Modify: `pacman/game.js`

- [ ] **Step 1: Add volume control HTML to index.html**

After the `#highscore-wrap` div in the HUD, add:

```html
<div id="volume-controls">
  <div class="vol-row">
    <span class="vol-label">SFX</span>
    <button class="vol-btn" data-channel="sfx" data-dir="-1">-</button>
    <span class="vol-bars" id="sfx-bars">████</span>
    <button class="vol-btn" data-channel="sfx" data-dir="1">+</button>
  </div>
  <div class="vol-row">
    <span class="vol-label">MUS</span>
    <button class="vol-btn" data-channel="music" data-dir="-1">-</button>
    <span class="vol-bars" id="music-bars">████</span>
    <button class="vol-btn" data-channel="music" data-dir="1">+</button>
  </div>
</div>
```

- [ ] **Step 2: Add styles to style.css**

Add at the end of `style.css`:

```css
#volume-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.vol-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 12px;
  color: #fff;
}

.vol-label {
  width: 28px;
  color: #ff0;
}

.vol-btn {
  background: #333;
  color: #fff;
  border: 1px solid #666;
  cursor: pointer;
  font-family: monospace;
  font-size: 14px;
  width: 20px;
  height: 20px;
  line-height: 18px;
  text-align: center;
  padding: 0;
}

.vol-btn:hover {
  background: #555;
}

.vol-bars {
  color: #0ff;
  letter-spacing: 1px;
  font-size: 10px;
  min-width: 32px;
  text-align: center;
}
```

- [ ] **Step 3: Wire up volume controls in game.js**

In the `init()` method, after `this.setupInput()`, add:

```js
this.setupVolumeControls();
```

Add the new method in Game class:

```js
setupVolumeControls() {
  const sfxBars = document.getElementById('sfx-bars');
  const musicBars = document.getElementById('music-bars');
  let sfxLevel = 4;
  let musicLevel = 4;

  const renderBars = () => {
    sfxBars.textContent = '█'.repeat(sfxLevel) + '░'.repeat(4 - sfxLevel);
    musicBars.textContent = '█'.repeat(musicLevel) + '░'.repeat(4 - musicLevel);
  };

  document.querySelectorAll('.vol-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!this.audio) return;
      const channel = btn.dataset.channel;
      const dir = parseInt(btn.dataset.dir, 10);
      if (channel === 'sfx') {
        sfxLevel = Math.max(0, Math.min(4, sfxLevel + dir));
        this.audio.setSfxVolume(sfxLevel / 4);
      } else {
        musicLevel = Math.max(0, Math.min(4, musicLevel + dir));
        this.audio.setMusicVolume(musicLevel / 4);
      }
      renderBars();
    });
  });

  renderBars();
}
```

- [ ] **Step 4: Verify UI renders**

Refresh `http://localhost:8080/pacman/`. The HUD should show two volume rows (SFX and MUS) below the score, each with `-`/`+` buttons and 4 bars. Clicking `+`/`-` should update the bar display.

---

### Task 4: Keyboard Shortcuts for Mute Channels

**Files:**
- Modify: `pacman/game.js:62-79`

- [ ] **Step 1: Add Shift+M and Shift+S handling in setupInput**

Replace the `M` case in the keydown listener:

```js
case 'm': case 'M':
  if (e.shiftKey) {
    if (this.audio) {
      this.audio.musicMuted = !this.audio.musicMuted;
      this.audio.musicGain.gain.value = this.audio.musicMuted ? 0 : 0.3;
    }
  } else {
    if (this.audio) this.audio.toggleMute();
  }
  break;
case 's': case 'S':
  if (e.shiftKey && this.audio) {
    this.audio.sfxMuted = !this.audio.sfxMuted;
    this.audio.sfxGain.gain.value = this.audio.sfxMuted ? 0 : 0.3;
  }
  break;
```
