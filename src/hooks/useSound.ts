/**
 * Sound Effects Hook
 * Manages audio playback for game events
 */

import { useCallback } from 'react';
import { soundManager, SoundType } from '../utils/sound';

export type SoundEffect = 'coin_flip' | 'attack' | 'defend' | 'win' | 'lose';

export function useSound() {
  const playSound = useCallback((soundType: SoundEffect) => {
    try {
      // Map sound types to audio file paths
      const soundMap: Record<SoundEffect, SoundType> = {
        coin_flip: 'coin-flip',
        attack: 'attack',
        defend: 'defend',
        win: 'win',
        lose: 'lose',
      };

      const mappedSoundType = soundMap[soundType];
      if (!mappedSoundType) return;

      soundManager.play(mappedSoundType, 0.6);
    } catch (error) {
      console.warn('Sound playback error:', error);
    }
  }, []);

  return { playSound };
}
