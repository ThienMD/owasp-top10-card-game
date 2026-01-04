/**
 * CyberAsset Component
 *
 * Displays a cyber asset (face card) with its current state.
 * States: facedown (protected) → revealed (observed) → rotated (assessed) → destroyed (PWN'd)
 */

import { CyberAsset as CyberAssetType, AnimationType } from '../types';
import { getSuitSymbol } from '../data/cards';
import { getFaceCardSymbol, getAssetStateDisplay } from '../utils/helpers';
import './CyberAsset.css';

interface CyberAssetProps {
  asset: CyberAssetType;
  isOpponent?: boolean;
  selected?: boolean;
  onClick?: () => void;
  animation?: AnimationType;
}

export function CyberAsset({ asset, isOpponent, selected, onClick, animation = 'none' }: CyberAssetProps) {
  const { card, state } = asset;
  const suitSymbol = getSuitSymbol(card.suit);
  const faceSymbol = getFaceCardSymbol(card.faceType);
  const stateDisplay = getAssetStateDisplay(state);

  const isDestroyed = state === 'destroyed';
  const isFacedown = state === 'facedown';
  const isRotated = state === 'rotated';
  const isClickable = onClick !== undefined && !isDestroyed;

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`cyber-asset ${state} ${selected ? 'selected' : ''} ${isOpponent ? 'opponent' : 'player'} ${isDestroyed ? 'destroyed' : ''} ${isClickable ? 'clickable' : ''} ${animation !== 'none' ? `${animation}-animation` : ''}`}
      onClick={handleClick}
    >
      {isFacedown ? (
        <div className="asset-facedown">
          <div className="asset-back-pattern">
            <span>?</span>
          </div>
          <div className="asset-label">Protected</div>
        </div>
      ) : (
        <div className={`asset-revealed ${isRotated ? 'rotated' : ''}`}>
          <div className="asset-header">
            <span className="asset-face">{faceSymbol}</span>
            <span className="asset-suit">{suitSymbol}</span>
          </div>
          <div className="asset-name">{card.assetName}</div>
          <div className={`asset-state ${state}`}>{stateDisplay}</div>
          {isDestroyed && <div className="pwn-overlay">PWN&apos;d!</div>}
        </div>
      )}

      <div className="damage-indicators">
        <span className={`damage-dot ${asset.damageCount >= 1 ? 'active' : ''}`}></span>
        <span className={`damage-dot ${asset.damageCount >= 2 ? 'active' : ''}`}></span>
        <span className={`damage-dot ${asset.damageCount >= 3 ? 'active destroyed' : ''}`}></span>
      </div>

      {isClickable && <div className="target-indicator">Click to Target</div>}
    </div>
  );
}
