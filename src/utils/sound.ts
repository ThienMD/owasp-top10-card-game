/**
 * Sound Effects Manager
 * Handles playing game sound effects
 */

export type SoundType = 'coin-flip' | 'attack' | 'defend' | 'win' | 'lose';

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    // Map game sound types to actual file names
    const soundMap: Record<SoundType, string> = {
      'coin-flip': 'coin_flip.mp3',
      'attack': 'attack.mp3',
      'defend': 'defend.mp3',
      'win': 'win.mp3',
      'lose': 'failure.mp3', // Note: actual file is named failure.mp3
    };
    
    Object.entries(soundMap).forEach(([type, filename]) => {
      const audio = new Audio(`./sounds/${filename}`);
      audio.preload = 'auto';
      audio.onerror = () => {
        console.warn(`Sound file not found: sounds/${filename}`);
      };
      audio.oncanplay = () => {
        console.log(`✓ Sound loaded: ${type} (${filename})`);
      };
      this.sounds.set(type as SoundType, audio);
    });
  }

  /**
   * Browsers often block audio until the user interacts with the page.
   * Call this from a user gesture (pointerdown/keydown) to unlock.
   */
  unlock() {
    if (this.isUnlocked) return;

    const first = this.sounds.values().next().value as HTMLAudioElement | undefined;
    if (!first) {
      this.isUnlocked = true;
      return;
    }

    try {
      const prevVolume = first.volume;
      first.volume = 0;
      const p = first.play();

      if (p && typeof (p as Promise<void>).then === 'function') {
        (p as Promise<void>)
          .then(() => {
            first.pause();
            first.currentTime = 0;
            first.volume = prevVolume;
            this.isUnlocked = true;
          })
          .catch(() => {
            first.volume = prevVolume;
          });
      } else {
        first.pause();
        first.currentTime = 0;
        first.volume = prevVolume;
        this.isUnlocked = true;
      }
    } catch {
      // ignore
    }
  }

  play(soundType: SoundType, volume: number = 0.7) {
    if (this.isMuted) return;

    const audio = this.sounds.get(soundType);
    if (!audio) {
      console.warn(`Sound not loaded: ${soundType}`);
      return;
    }

    try {
      // Reset and play
      audio.currentTime = 0;
      audio.volume = Math.min(Math.max(volume, 0), 1); // Clamp between 0-1
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🔊 Playing sound: ${soundType}`);
          })
          .catch(err => {
            console.warn(`Failed to play sound ${soundType}:`, err.message);
          });
      }
    } catch (error) {
      console.warn(`Error playing sound ${soundType}:`, error);
    }
  }

  mute() {
    this.isMuted = true;
    console.log('🔇 Sounds muted');
  }

  unmute() {
    this.isMuted = false;
    console.log('🔊 Sounds unmuted');
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    console.log(this.isMuted ? '🔇 Sounds muted' : '🔊 Sounds unmuted');
    return this.isMuted;
  }

  setVolume(volume: number) {
    const clampedVolume = Math.min(Math.max(volume, 0), 1);
    this.sounds.forEach(audio => {
      audio.volume = clampedVolume;
    });
    console.log(`🔊 Volume set to: ${Math.round(clampedVolume * 100)}%`);
  }
}

// Create singleton instance
export const soundManager = new SoundManager();
