/**
 * Sound Effects Manager
 * Handles playback of game sound effects
 */

export type SoundType = 'coin-flip' | 'card-flip' | 'attack' | 'defend' | 'win' | 'lose';

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private muted: boolean = false;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio() {
    // Try to create audio context for better sound control
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      void new AudioContextClass();
    } catch (e) {
      console.log('Web Audio API not available, using HTML5 audio');
    }
  }

  /**
   * Load a sound file
   */
  public loadSound(type: SoundType, path: string) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    this.sounds.set(type, audio);
  }

  /**
   * Play a sound effect
   */
  public play(type: SoundType, volume: number = 0.5) {
    if (this.muted) return;

    const audio = this.sounds.get(type);
    if (!audio) {
      console.warn(`Sound not loaded: ${type}`);
      return;
    }

    // Reset and play
    try {
      audio.currentTime = 0;
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.play().catch(err => {
        console.log('Audio play failed (may be due to browser autoplay policy):', err);
      });
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }

  /**
   * Stop a sound
   */
  public stop(type: SoundType) {
    const audio = this.sounds.get(type);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Toggle mute
   */
  public toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Set mute state
   */
  public setMute(muted: boolean) {
    this.muted = muted;
  }

  /**
   * Check if muted
   */
  public isMuted() {
    return this.muted;
  }

  /**
   * Stop all sounds
   */
  public stopAll() {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Initialize sounds on first load
export function initializeSounds() {
  soundManager.loadSound('coin-flip', '/sounds/coin-flip.mp3');
  soundManager.loadSound('card-flip', '/sounds/card-flip.mp3');
  soundManager.loadSound('attack', '/sounds/attack.mp3');
  soundManager.loadSound('defend', '/sounds/defend.mp3');
  soundManager.loadSound('win', '/sounds/win.mp3');
  soundManager.loadSound('lose', '/sounds/lose.mp3');
}
