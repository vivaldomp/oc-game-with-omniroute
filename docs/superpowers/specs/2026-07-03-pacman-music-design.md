# Pacman Background Music — Design Spec

## Overview
Add background music and jingles to the Pacman arcade clone, sourced from opengameart.org. Music plays on an independent volume channel from existing sound effects (SFX).

## Track Inventory
Four new `.wav` files placed in `pacman/sounds/`:

| File | Purpose | State | Looping |
|---|---|---|---|
| `music_menu.wav` | Attract/title screen | MENU | Yes |
| `music_gameplay.wav` | Gameplay background | PLAYING | Yes |
| `music_level_complete.wav` | Level cleared jingle | LEVEL_COMPLETE | No |
| `music_game_over.wav` | Game over theme | GAME_OVER | Yes |

Existing SFX (chomp, death, fruit, ghost_eaten, ghost_frightened, level_start, power_pellet, siren) are unchanged.

## AudioManager (`audio.js`) — Modifications

### Dual gain nodes
- `this.sfxGain` — routes all existing `play()` calls (SFX). Connected to `destination`.
- `this.musicGain` — routes all music tracks. Connected to `destination`. New `GainNode` created in constructor.
- `this.muted` toggles *both* gain nodes to 0.

### Track state
- `this.currentMusic` — holds the current looping `AudioBufferSourceNode` for music, so we can stop it.

### New methods
- `playMusic(name)` — stops any current music, looks up `this.sounds[name]`, creates a `BufferSource` connected to `musicGain`, sets `source.loop = true`, starts it, stores in `this.currentMusic`.
- `stopMusic()` — stops `this.currentMusic` if active.
- `setMusicVolume(v)` — sets `this.musicGain.gain.value` (0–1).
- `setSfxVolume(v)` — sets `this.sfxGain.gain.value` (0–1).

### loadSounds() — extended
Also loads `music_menu`, `music_gameplay`, `music_level_complete`, `music_game_over` using the same `sounds/${name}.wav` fetch pattern.

## Game (`game.js`) — Modifications

### State-driven music transitions
| Trigger | Action |
|---|---|
| `init()` → MENU | `audio.playMusic('music_menu')` |
| `startLevel()` → READY | `audio.stopMusic()` (silent during "READY!") |
| READY timer → PLAYING | `audio.playMusic('music_gameplay')` |
| Pacman dies → DYING | `audio.stopMusic()` |
| Lives ≤ 0 → GAME_OVER | `audio.playMusic('music_game_over')` |
| All pellets eaten → LEVEL_COMPLETE | `audio.playMusic('music_level_complete')` |

### Volume UI
Add two compact volume controls in the HUD, one for SFX and one for Music. Each control has:
- A `-` button, a 4-bar level indicator, a `+` button
- Styled to match the existing monochrome pixel aesthetic
- Clicking `+`/`-` calls `audio.setSfxVolume()` / `audio.setMusicVolume()` in 0.25 increments

### Keyboard shortcuts
- `M` — toggle mute for both channels (existing behavior)
- `Shift+M` — toggle mute for music only
- `Shift+S` — toggle mute for SFX only

## File Layout (unchanged structure)
```
pacman/
├── audio.js          ← extended
├── game.js           ← extended
├── sounds/
│   ├── music_menu.wav
│   ├── music_gameplay.wav
│   ├── music_level_complete.wav
│   └── music_game_over.wav
│   (plus existing SFX .wav files)
```

## Assets
All music `.wav` files sourced from https://opengameart.org. The user is responsible for downloading and placing them in `pacman/sounds/`. The code gracefully handles missing files (existing `console.warn` fallback in `loadSounds()`).

## Out of Scope
- Playlists, crossfading, procedural music, dynamic tempo changes.
- Audio format conversion (WAV only).
- Mobile audio unlock / gesture-initiated context (not needed — existing code already handles init on DOMContentLoaded).
