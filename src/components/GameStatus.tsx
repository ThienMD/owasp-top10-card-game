/**
 * GameStatus Component
 *
 * Displays the current game status including turn info, phase, and last action.
 */

import { GameState } from '../types';
import './GameStatus.css';

interface GameStatusProps {
  gameState: GameState;
  onRestart: () => void;
  onEndTurn: () => void;
  onAttack: () => void;
  onSkipAI: () => void;
  canAttack: boolean;
  isProcessing: boolean;
}

export function GameStatus({
  gameState,
  onRestart,
  onEndTurn,
  onAttack,
  onSkipAI,
  canAttack,
  isProcessing,
}: GameStatusProps) {
  const { phase, currentAttacker, turnNumber, message, lastAction, player, ai } = gameState;

  const playerBreached = player.assets.filter(a => a.state === 'destroyed').length; // AI breached you
  const aiBreached = ai.assets.filter(a => a.state === 'destroyed').length; // You breached AI

  const isGameOver = phase === 'player_won' || phase === 'ai_won';
  const isPlayerTurn = currentAttacker === 'player' && !isGameOver;

  return (
    <div className="game-status">
      <div className="status-header">
        <h1 className="game-title">OWASP Top 10 Card Game</h1>
        <div className="turn-badge">Turn {turnNumber}</div>
      </div>

      <div className="status-content">
        <div className="defense-tracker">
          <div className="tracker-label">Win Progress</div>
          <div className="tracker-row">
            <span className="tracker-you">You defended: {player.successfulDefenses}/6</span>
            <span className="tracker-ai">AI defended: {ai.successfulDefenses}/6</span>
          </div>
          <div className="tracker-row">
            <span className="tracker-you">You breached AI: {aiBreached}/2</span>
            <span className="tracker-ai">AI breached you: {playerBreached}/2</span>
          </div>
        </div>

        <div className="message-area">
          <div className={`game-message ${isGameOver ? 'game-over' : ''}`}>
            {message}
          </div>

          {lastAction && (
            <div className="last-action">
              <span className="action-actor">{lastAction.actor === 'player' ? 'You' : 'AI'}:</span>
              <span className="action-text">{lastAction.action}</span>
              <span className="action-details">- {lastAction.details}</span>
            </div>
          )}
        </div>

        <div className="action-buttons">
          {isGameOver ? (
            <button className="btn-primary" onClick={onRestart}>
              Play Again
            </button>
          ) : isPlayerTurn ? (
            <>
              <button
                className="btn-attack"
                onClick={onAttack}
                disabled={!canAttack || isProcessing}
              >
                Attack!
              </button>
              <button
                className="btn-secondary"
                onClick={onEndTurn}
                disabled={isProcessing}
              >
                End Turn (+2 cards)
              </button>
            </>
          ) : (
            <div className="waiting-container">
              <div className="waiting">AI is thinking...</div>
              <button className="btn-skip" onClick={onSkipAI}>
                Skip ⏩
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
