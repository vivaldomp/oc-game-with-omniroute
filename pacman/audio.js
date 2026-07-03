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

  async loadSounds() {
    const soundMap = {
      'eat_dot_0': 'eat_dot_0.wav',
      'eat_dot_1': 'eat_dot_1.wav',
      'fright': 'fright.wav',
      'fright_loop': 'fright_firstloop.wav',
      'eat_ghost': 'eat_ghost.wav',
      'death': 'death_0.wav',
      'siren': 'siren0.wav',
      'start': 'start.wav',
      'eat_fruit': 'eat_fruit.wav',
      'eyes': 'eyes.wav',
      'extend': 'extend.wav',
      'intermission': 'intermission.wav'
    };

    for (const [name, file] of Object.entries(soundMap)) {
      try {
        const resp = await fetch(`sounds/${file}`);
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

    if (name === 'siren') {
      source.playbackRate.value = 0.8 + (1 - this.pelletRatio) * 0.4;
    }

    source.connect(this.sfxGain);
    try { source.start(0); } catch (e) { /* context not ready yet */ }

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

  playMusic(name) {
    this.stopMusic();
    if (this.muted || !this.sounds[name]) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.sounds[name];
    source.loop = true;
    source.connect(this.musicGain);
    try { source.start(0); } catch (e) { /* context not ready yet */ }
    this.currentMusic = source;
  }

  stopMusic() {
    if (this.currentMusic) {
      try { this.currentMusic.stop(0); } catch (e) { /* already stopped */ }
      this.currentMusic = null;
    }
  }

  setPelletRatio(ratio) {
    this.pelletRatio = ratio;
  }

  setMusicVolume(v) {
    const clamped = Math.max(0, Math.min(1, v));
    this.musicGain.gain.value = clamped;
    if (this.muted) this._prevMusicVol = clamped;
  }

  setSfxVolume(v) {
    const clamped = Math.max(0, Math.min(1, v));
    this.sfxGain.gain.value = clamped;
    if (this.muted) this._prevSfxVol = clamped;
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
}
