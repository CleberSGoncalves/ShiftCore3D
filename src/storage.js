/**
 * @fileoverview LocalStorage persistence manager for ShiftCore3D
 */

const STORAGE_KEY = 'SHIFTCORE3D_SAVE_V1';

class StorageManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Storage] Failed to read localStorage:', e);
    }
    return {
      highScore: 0,
      unlockedSector: 1,
      soundMuted: false,
      musicVolume: 0.7,
      sfxVolume: 0.8
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[Storage] Failed to save to localStorage:', e);
    }
  }

  getHighScore() {
    return this.data.highScore || 0;
  }

  updateHighScore(score) {
    if (score > (this.data.highScore || 0)) {
      this.data.highScore = score;
      this.save();
      return true;
    }
    return false;
  }

  getUnlockedSector() {
    return this.data.unlockedSector || 1;
  }

  unlockSector(sector) {
    if (sector > (this.data.unlockedSector || 1)) {
      this.data.unlockedSector = sector;
      this.save();
    }
  }

  isSoundMuted() {
    return !!this.data.soundMuted;
  }

  setSoundMuted(muted) {
    this.data.soundMuted = !!muted;
    this.save();
  }
}

export const storage = new StorageManager();
export default storage;
