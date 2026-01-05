/**
 * OWASP Top Ten Card Game - Main App Component
 * Based on official OWASP rules: https://owasp.org/www-project-top-ten-card-game/
 */

import React from 'react';
import { Hand, Board, Tooltip, GameStatus, ActionLog } from './components';
import { useGameState } from './hooks/useGameState';
import { soundManager } from './utils/sound';
import './App.css';

function App() {
  const {
    gameState,
    isProcessing,
    resetGame,
    selectCard,
    selectAsset,
    playerAttack,
    endTurn,
    performCoinFlip,
    requestSkipAI,
    setDifficulty,
  } = useGameState();

  const isPlayerTurn = gameState.currentAttacker === 'player';
  const isGameOver = gameState.phase === 'player_won' || gameState.phase === 'ai_won';
  const canAttack = gameState.selectedCard !== null && gameState.selectedAsset !== null;

  // Auto-trigger coin flip on game start
  React.useEffect(() => {
    if (gameState.phase === 'coin_flip' && !isProcessing) {
      performCoinFlip();
    }
  }, [gameState.phase, isProcessing, performCoinFlip]);

  // Unlock audio on first user interaction (required by most browsers)
  React.useEffect(() => {
    const unlock = () => {
      soundManager.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <div className="app">
      {/* Logo at the top */}
      <div className="logo-container" style={{ textAlign: 'center', margin: '24px 0 8px 0' }}>
        <img src="./images/logo.png" alt="OWASP Card Game Logo" style={{ height: '64px', maxWidth: '90vw' }} />
      </div>

      {/* OWASP Info Tooltip */}
      <Tooltip info={gameState.showOwaspInfo} />

      {/* Difficulty Selection Modal */}
      {gameState.phase === 'difficulty_select' && (
        <div className="coin-flip-modal">
          <div className="difficulty-modal">
            <h2 className="difficulty-title">Select Difficulty</h2>
            <p className="difficulty-desc">Choose your challenge level</p>
            <div className="difficulty-buttons">
              <button 
                className="difficulty-btn easy-btn"
                onClick={() => setDifficulty('easy')}
              >
                <span className="btn-icon">😊</span>
                <span className="btn-label">Easy</span>
                <span className="btn-winrate">~85% Win Rate</span>
              </button>
              <button 
                className="difficulty-btn hard-btn"
                onClick={() => setDifficulty('hard')}
              >
                <span className="btn-icon">😤</span>
                <span className="btn-label">Hard</span>
                <span className="btn-winrate">~50% Win Rate</span>
              </button>
              <button 
                className="difficulty-btn brutal-btn"
                onClick={() => setDifficulty('brutal')}
              >
                <span className="btn-icon">☠️</span>
                <span className="btn-label">Brutal</span>
                <span className="btn-winrate">~5% Win Rate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coin Flip Modal */}
      {gameState.phase === 'coin_flip' && (
        <div className="coin-flip-modal">
          <div className="coin-flip-content">
            <div className="coin-flip-coin"></div>
            <p className="coin-flip-text">{gameState.message}</p>
          </div>
        </div>
      )}

      <div className="app-layout">
        {/* Left: Rules */}
        <aside className="left-panel">
          <div className="rules-panel">
            <div className="instruction-section">
              <h3>How to Play</h3>
              <ol>
                <li>Select a <strong>Threat Agent</strong> card (red suit) from your hand</li>
                <li>Click an AI <strong>cyber asset</strong> to target</li>
                <li>Click <strong>Attack!</strong> to execute</li>
                <li>Defense requires matching card value (e.g., 5♥ blocks with 5♠)</li>
              </ol>
            </div>
            <div className="instruction-section">
              <h3>Win Conditions</h3>
              <ul>
                <li><strong>Breach 2 of 3</strong> opponent assets (3 hits each)</li>
                <li>Or opponent <strong>defends 6 times</strong> successfully</li>
              </ul>
            </div>
            <div className="instruction-section">
              <h3>Attack Phases</h3>
              <ul>
                <li><strong>Observation</strong>: Reveals face-down asset</li>
                <li><strong>Assessment</strong>: Rotates revealed asset</li>
                <li><strong>PWN</strong>: Destroys rotated asset</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Center: Game */}
        <main className="center-panel">
          <div className="game-container">
            {/* AI's Hand (small, top) */}
            <Hand
              taCards={gameState.ai.taHand}
              dcCards={gameState.ai.dcHand}
              selectedCard={null}
              onSelectCard={() => {}}
              isPlayer={false}
              disabled={true}
            />

            {/* Game Board with Cyber Assets */}
            <Board
              playerAssets={gameState.player.assets}
              aiAssets={gameState.ai.assets}
              selectedAsset={gameState.selectedAsset}
              onSelectAsset={selectAsset}
              isPlayerAttacking={isPlayerTurn && !isGameOver}
              animation={gameState.animation}
              attackState={gameState.attackState}
            />

            <div >
              {/* Player's Attack Hand */}
              <Hand
                taCards={gameState.player.taHand}
                dcCards={gameState.player.dcHand}
                selectedCard={gameState.selectedCard}
                onSelectCard={selectCard}
                isPlayer={true}
                showDefense={false}
                disabled={!isPlayerTurn || isProcessing || isGameOver}
              />

              {/* Status / Actions beside player's hand */}
              <GameStatus
                gameState={gameState}
                onRestart={resetGame}
                onEndTurn={endTurn}
                onAttack={playerAttack}
                canAttack={canAttack}
                isProcessing={isProcessing}
                onSkipAI={requestSkipAI}
              />
            </div>
          </div>
        </main>

        {/* Right: Action Log */}
        <aside className="right-panel">
          <ActionLog actions={gameState.actionLog || []} />
        </aside>
      </div>
    </div>
  );
}

export default App;
