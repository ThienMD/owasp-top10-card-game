/**
 * Board Component
 *
 * Displays the cyber assets for both players.
 * Assets progress through states: facedown → revealed → rotated → destroyed
 */

import { CyberAsset as CyberAssetType, AnimationType, AttackState } from '../types';
import { CyberAsset } from './CyberAsset';
import { countActiveAssets, countDestroyedAssets } from '../utils/helpers';
import './Board.css';

interface BoardProps {
  playerAssets: CyberAssetType[];
  aiAssets: CyberAssetType[];
  selectedAsset: CyberAssetType | null;
  onSelectAsset: (asset: CyberAssetType) => void;
  isPlayerAttacking: boolean;
  animation?: AnimationType;
  attackState?: AttackState | null;
}

export function Board({
  playerAssets,
  aiAssets,
  selectedAsset,
  onSelectAsset,
  isPlayerAttacking,
  animation = 'none',
  attackState = null,
}: BoardProps) {
  const playerActive = countActiveAssets(playerAssets);
  const playerDestroyed = countDestroyedAssets(playerAssets);
  const aiActive = countActiveAssets(aiAssets);
  const aiDestroyed = countDestroyedAssets(aiAssets);

  // Show arrow when attack animation is active and we have a target
  const showAttackArrow = animation === 'attack' && attackState?.targetAsset;
  const targetAssetId = attackState?.targetAsset?.instanceId;

  return (
    <div className="game-board">

      {/* AI's Assets (opponent) */}
      <div className="assets-section ai-assets">
        <div className="assets-header">
          <span className="assets-label">AI Systems</span>
          <span className="assets-count">
            {aiActive} active / {aiDestroyed} breached
          </span>
        </div>
        <div className="assets-row">
          {aiAssets.map(asset => (
            <div key={asset.instanceId} className="asset-wrapper">
              <CyberAsset
                asset={asset}
                isOpponent={true}
                selected={selectedAsset?.instanceId === asset.instanceId}
                onClick={
                  isPlayerAttacking && asset.state !== 'destroyed'
                    ? () => onSelectAsset(asset)
                    : undefined
                }
                animation={animation}
              />
              {showAttackArrow && targetAssetId === asset.instanceId && isPlayerAttacking && (
                <div className="attack-arrow player-attacking">
                  <img src="/images/attack.png" alt="Attack" className="attack-image" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Battlefield Divider */}
      <div className="battlefield-divider">
        <div className="divider-line"></div>
        <div className="divider-content">
          <span className="phase-label">
            {isPlayerAttacking ? 'YOUR ATTACK' : 'DEFENDING'}
          </span>
        </div>
        <div className="divider-line"></div>
      </div>

      {/* Player's Assets */}
      <div className="assets-section player-assets">
        <div className="assets-header">
          <span className="assets-label">Your Systems</span>
          <span className="assets-count">
            {playerActive} active / {playerDestroyed} breached
          </span>
        </div>
        <div className="assets-row">
          {playerAssets.map(asset => (
            <div key={asset.instanceId} className="asset-wrapper">
              <CyberAsset
                asset={asset}
                isOpponent={false}
                selected={false}
                onClick={undefined}
                animation={animation}
              />
              {showAttackArrow && targetAssetId === asset.instanceId && !isPlayerAttacking && (
                <div className="attack-arrow ai-attacking">
                  <img src="/images/attack.png" alt="Attack" className="attack-image" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
