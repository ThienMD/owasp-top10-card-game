/**
 * OWASP Card Game - Helper Utilities
 */

import { HandCard, PlayableCard, CyberAsset, AssetCard } from '../types';

/**
 * Generate a unique ID for instances
 */
export function generateInstanceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a hand card from a playable card
 */
export function createHandCard(card: PlayableCard): HandCard {
  return {
    instanceId: generateInstanceId(),
    card,
  };
}

/**
 * Create a cyber asset from an asset card
 */
export function createCyberAsset(card: AssetCard): CyberAsset {
  return {
    instanceId: generateInstanceId(),
    card,
    state: 'facedown',
    damageCount: 0,
  };
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get a random element from an array
 */
export function getRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Delay execution for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get asset state display name
 */
export function getAssetStateDisplay(state: string): string {
  switch (state) {
    case 'facedown': return 'Protected';
    case 'revealed': return 'Observed';
    case 'rotated': return 'Assessed';
    case 'destroyed': return 'PWN\'d';
    default: return state;
  }
}

/**
 * Get face card display symbol
 */
export function getFaceCardSymbol(faceType: string): string {
  switch (faceType) {
    case 'jack': return 'J';
    case 'queen': return 'Q';
    case 'king': return 'K';
    default: return '?';
  }
}

/**
 * Count active (non-destroyed) assets
 */
export function countActiveAssets(assets: CyberAsset[]): number {
  return assets.filter(a => a.state !== 'destroyed').length;
}

/**
 * Count destroyed assets
 */
export function countDestroyedAssets(assets: CyberAsset[]): number {
  return assets.filter(a => a.state === 'destroyed').length;
}
