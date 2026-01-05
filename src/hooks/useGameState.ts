/**
 * OWASP Top Ten Card Game - Game State Hook
 * Based on official OWASP rules: https://owasp.org/www-project-top-ten-card-game/
 */

import { useState, useCallback, useRef } from 'react';
import {
  GameState,
  GamePhase,
  CyberAsset,
  HandCard,
  PlayableCard,
  AssetState,
  OwaspInfo,
  ThreatAgentCard,
  DefenseControlCard,
  JokerCard,
  AnimationType,
  GameAction,
} from '../types';
import { generateFullDeck, createShuffledDeck, canDefend } from '../data/cards';
import { createHandCard, createCyberAsset, shuffle, delay } from '../utils/helpers';
import {
  aiChooseAttackCard,
  aiChooseTarget,
  aiChooseDefense,
  aiDecideContinueOrEnd,
} from '../utils/ai';
import { useSound } from './useSound';

const HAND_SIZE = 5;
const ASSETS_PER_PLAYER = 3;
const ASSETS_TO_WIN = 2;
const DEFENSES_TO_WIN = 6;

/**
 * Initialize a new game state (starts with coin flip)
 */
function initializeGame(): GameState {
  const deck = generateFullDeck();

  const shuffledTA = createShuffledDeck([...deck.taCards, deck.jokers[0]]);
  const shuffledDC = createShuffledDeck([...deck.dcCards, deck.jokers[1]]);
  const shuffledTAAssets = shuffle(deck.taAssets);
  const shuffledDCAssets = shuffle(deck.dcAssets);

  const playerTAHand = shuffledTA.slice(0, HAND_SIZE).map(createHandCard);
  const playerDCHand = shuffledDC.slice(0, HAND_SIZE).map(createHandCard);
  const playerAssets = shuffledDCAssets.slice(0, ASSETS_PER_PLAYER).map(createCyberAsset);

  const aiTAHand = shuffledTA.slice(HAND_SIZE, HAND_SIZE * 2).map(createHandCard);
  const aiDCHand = shuffledDC.slice(HAND_SIZE, HAND_SIZE * 2).map(createHandCard);
  const aiAssets = shuffledTAAssets.slice(0, ASSETS_PER_PLAYER).map(createCyberAsset);

  const taDeck = shuffledTA.slice(HAND_SIZE * 2);
  const dcDeck = shuffledDC.slice(HAND_SIZE * 2);

  return {
    phase: 'difficulty_select',
    currentAttacker: 'player',
    difficulty: null,
    player: {
      assets: playerAssets,
      taHand: playerTAHand,
      dcHand: playerDCHand,
      taDiscard: [],
      dcDiscard: [],
      successfulDefenses: 0,
    },
    ai: {
      assets: aiAssets,
      taHand: aiTAHand,
      dcHand: aiDCHand,
      taDiscard: [],
      dcDiscard: [],
      successfulDefenses: 0,
    },
    taDeck,
    dcDeck,
    attackState: null,
    turnNumber: 1,
    cardsDrawnThisGame: HAND_SIZE * 4,
    lastAction: null,
    actionLog: [],
    selectedCard: null,
    selectedAsset: null,
    message: 'Flipping coin to determine who attacks first...',
    showOwaspInfo: null,
    animation: 'coin_flip',
    coinFlipResult: null,
  };
}

function getNextAssetState(current: AssetState): AssetState {
  switch (current) {
    case 'facedown': return 'revealed';
    case 'revealed': return 'rotated';
    case 'rotated': return 'destroyed';
    default: return current;
  }
}

function checkWinCondition(state: GameState): GamePhase {
  const playerDestroyedAssets = state.player.assets.filter(a => a.state === 'destroyed').length;
  const aiDestroyedAssets = state.ai.assets.filter(a => a.state === 'destroyed').length;

  if (playerDestroyedAssets >= ASSETS_TO_WIN) return 'ai_won';
  if (aiDestroyedAssets >= ASSETS_TO_WIN) return 'player_won';
  if (state.player.successfulDefenses >= DEFENSES_TO_WIN) return 'player_won';
  if (state.ai.successfulDefenses >= DEFENSES_TO_WIN) return 'ai_won';

  return state.phase;
}

function getWinReason(state: GameState): { phase: 'player_won' | 'ai_won'; reason: string } | null {
  const playerDestroyedAssets = state.player.assets.filter(a => a.state === 'destroyed').length;
  const aiDestroyedAssets = state.ai.assets.filter(a => a.state === 'destroyed').length;

  if (playerDestroyedAssets >= ASSETS_TO_WIN) {
    return { phase: 'ai_won', reason: `AI breached ${playerDestroyedAssets} of your 3 assets` };
  }
  if (aiDestroyedAssets >= ASSETS_TO_WIN) {
    return { phase: 'player_won', reason: `You breached ${aiDestroyedAssets} of 3 AI assets` };
  }
  if (state.player.successfulDefenses >= DEFENSES_TO_WIN) {
    return { phase: 'player_won', reason: 'You successfully defended 6 attacks' };
  }
  if (state.ai.successfulDefenses >= DEFENSES_TO_WIN) {
    return { phase: 'ai_won', reason: 'AI successfully defended 6 of your attacks' };
  }

  return null;
}

function drawToHandSize(
  hand: HandCard[],
  deck: PlayableCard[],
  targetSize: number
): { newHand: HandCard[]; newDeck: PlayableCard[] } {
  const newHand = [...hand];
  const newDeck = [...deck];

  while (newHand.length < targetSize && newDeck.length > 0) {
    const card = newDeck.shift()!;
    newHand.push(createHandCard(card));
  }

  return { newHand, newDeck };
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [isProcessing, setIsProcessing] = useState(false);
  const { playSound } = useSound();
  const skipAIRef = useRef(false);

  const addLogToState = useCallback((state: GameState, entry: GameAction): GameState => {
    const nextLog = [...(state.actionLog || []), entry].slice(-200);
    return {
      ...state,
      lastAction: entry,
      actionLog: nextLog,
    };
  }, []);

  const summarizeOwasp = useCallback((text: string, maxLen = 140) => {
    const trimmed = text.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return `${trimmed.slice(0, maxLen).trim()}…`;
  }, []);

  const explainStage = useCallback((state: AssetState) => {
    if (state === 'facedown') return 'Stage: Observation (reveals a face-down asset)';
    if (state === 'revealed') return 'Stage: Assessment (rotates a revealed asset)';
    return 'Stage: PWN (destroys a rotated asset)';
  }, []);

  const formatAttackDetails = useCallback((attackCard: HandCard, targetName: string, targetState: AssetState) => {
    const stageLine = explainStage(targetState);

    if (attackCard.card.category === 'threat_agent') {
      const ta = attackCard.card as ThreatAgentCard;
      return [
        `Target: ${targetName}`,
        `${stageLine}`,
        `OWASP Risk: ${ta.owaspRisk.id} — ${ta.owaspRisk.name}`,
        `Why this threat matters: ${summarizeOwasp(ta.owaspRisk.description)}`,
      ].join('\n');
    }

    const joker = attackCard.card as JokerCard;
    return [
      `Target: ${targetName}`,
      `${stageLine}`,
      `Wildcard Attack: Joker (${joker.jokerType})`,
      'Why it works: Wildcard attack (rule-based).',
    ].join('\n');
  }, [explainStage, summarizeOwasp]);

  const formatDefenseDetails = useCallback((defenseCard: PlayableCard, attackCard: PlayableCard, targetName: string) => {
    const whyLine = defenseCard.category === 'joker'
      ? 'Why it blocked: Joker is a wildcard defense.'
      : (defenseCard.category === 'defense_control' && attackCard.category === 'threat_agent')
        ? `Why it blocked: Matching value (${defenseCard.value} blocks ${attackCard.value}).`
        : 'Why it blocked: Rule match.';

    if (defenseCard.category === 'defense_control') {
      const dc = defenseCard as DefenseControlCard;
      return [
        `Protected: ${targetName}`,
        `OWASP Control: ${dc.owaspControl.id} — ${dc.owaspControl.name}`,
        `How this control helps: ${summarizeOwasp(dc.owaspControl.description)}`,
        whyLine,
      ].join('\n');
    }

    return [
      `Protected: ${targetName}`,
      'OWASP Control: Joker (Wildcard Defense)',
      whyLine,
    ].join('\n');
  }, [summarizeOwasp]);

  const requestSkipAI = useCallback(() => {
    skipAIRef.current = true;
  }, []);

  const delayWithSkip = useCallback(async (ms: number) => {
    const start = Date.now();
    while (!skipAIRef.current && Date.now() - start < ms) {
      await delay(50); // Check every 50ms for skip
    }
  }, []);

  const setAnimation = useCallback((animation: AnimationType) => {
    setGameState(prev => ({ ...prev, animation }));
    // Play sound effects based on animation type
    if (animation === 'attack') {
      playSound('attack');
    } else if (animation === 'defend') {
      playSound('defend');
    } else if (animation === 'coin_flip') {
      playSound('coin_flip');
    }
  }, [playSound]);

  const resetGame = useCallback(() => {
    setGameState(initializeGame());
    setIsProcessing(false);
    skipAIRef.current = false;
  }, []);

  const showOwaspInfo = useCallback((info: OwaspInfo | null) => {
    setGameState(prev => ({ ...prev, showOwaspInfo: info }));
  }, []);

  const selectCard = useCallback((card: HandCard | null) => {
    setGameState(prev => ({ ...prev, selectedCard: card }));
  }, []);

  const selectAsset = useCallback((asset: CyberAsset | null) => {
    setGameState(prev => ({ ...prev, selectedAsset: asset }));
  }, []);

  const setDifficulty = useCallback((difficulty: 'easy' | 'hard' | 'brutal') => {
    setGameState(prev => ({
      ...prev,
      difficulty,
      phase: 'coin_flip',
      message: 'Flipping coin to determine who attacks first...',
    }));
  }, []);

  /**
   * Perform coin flip to determine first attacker
   */
  const performCoinFlip = useCallback(async () => {
    // Only run once at game start (after difficulty selected)
    if (gameState.phase !== 'coin_flip' || isProcessing || !gameState.difficulty) return;

    setIsProcessing(true);
    setAnimation('coin_flip');

    await delay(2000);

    const result = Math.random() < 0.5 ? 'player' : 'ai';

    const afterFlipMessage = result === 'player'
      ? 'You won the coin flip! You attack first.'
      : 'AI won the coin flip! AI attacks first.';

    setGameState(prev => ({
      ...prev,
      coinFlipResult: result,
      currentAttacker: result,
      message: afterFlipMessage,
    }));

    await delay(1500);

    const nextState: GameState = {
      ...gameState,
      coinFlipResult: result,
      currentAttacker: result,
      phase: 'attack_phase',
      animation: 'none',
      message: result === 'player'
        ? 'Your turn! Select a Threat Agent card to attack.'
        : 'AI is preparing to attack...',
    };

    setGameState(nextState);

    if (result === 'ai') {
      await delay(500);
      await executeAITurn(nextState);
      return; // executeAITurn will clear isProcessing
    }

    setIsProcessing(false);
  }, [gameState, isProcessing, setAnimation]);

  /**
   * Player attacks with selected card on selected asset
   */
  const playerAttack = useCallback(async () => {
    if (isProcessing) return;
    if (!gameState.selectedCard || !gameState.selectedAsset) return;
    if (gameState.phase !== 'attack_phase') return;
    if (gameState.currentAttacker !== 'player') return;

    setIsProcessing(true);

    const attackCard = gameState.selectedCard;
    const targetAsset = gameState.selectedAsset;

    // Show attack animation
    setAnimation('attack');

    if (attackCard.card.category === 'threat_agent') {
      const taCard = attackCard.card as ThreatAgentCard;
      showOwaspInfo({
        title: taCard.owaspRisk.name,
        category: 'risk',
        description: taCard.owaspRisk.description,
      });
    }

    let newState = { ...gameState };
    newState.attackState = {
      targetAsset,
      attackCard,
      stage: targetAsset.state === 'facedown' ? 'observation' :
             targetAsset.state === 'revealed' ? 'assessment' : 'pwn',
      attacksThisRound: (newState.attackState?.attacksThisRound || 0) + 1,
    };
    newState.phase = 'defense_phase';
    newState.message = `Attacking ${targetAsset.card.assetName}!`;
    newState.selectedCard = null;
    newState.selectedAsset = null;
    newState.animation = 'attack';

    newState = addLogToState(newState, {
      actor: 'player',
      action: 'Attack',
      details: formatAttackDetails(attackCard, targetAsset.card.assetName, targetAsset.state),
    });

    setGameState(newState);
    await delayWithSkip(1000);

    // AI defense
    const aiDecision = aiChooseDefense(newState.ai.dcHand, attackCard.card, gameState.difficulty || 'hard');

    if (aiDecision.card) {
      // Defense animation
      setAnimation('defend');
      const defenseCard = aiDecision.card;

      if (defenseCard.card.category === 'defense_control') {
        const dcCard = defenseCard.card as DefenseControlCard;
        showOwaspInfo({
          title: dcCard.owaspControl.name,
          category: 'control',
          description: dcCard.owaspControl.description,
        });
      }

      newState.player.taHand = newState.player.taHand.filter(
        c => c.instanceId !== attackCard.instanceId
      );
      newState.player.taDiscard.push(attackCard.card);
      newState.ai.dcHand = newState.ai.dcHand.filter(
        c => c.instanceId !== defenseCard.instanceId
      );
      newState.ai.dcDiscard.push(defenseCard.card);
      newState.ai.successfulDefenses++;

      const { newHand: aiNewDC, newDeck: dcDeck1 } = drawToHandSize(
        newState.ai.dcHand,
        newState.dcDeck,
        newState.ai.dcHand.length + 2
      );
      newState.ai.dcHand = aiNewDC;
      newState.dcDeck = dcDeck1;

      newState.message = `AI defended! Attack blocked.`;
      newState = addLogToState(newState, {
        actor: 'ai',
        action: 'Defended',
        details: formatDefenseDetails(defenseCard.card, attackCard.card, targetAsset.card.assetName),
      });
      newState = addLogToState(newState, {
        actor: 'player',
        action: 'Attack Blocked',
        details: `Outcome: Blocked\n${formatDefenseDetails(defenseCard.card, attackCard.card, targetAsset.card.assetName)}`,
      });
      newState.phase = 'attack_phase';
      newState.attackState = null;
      newState.animation = 'defend';

    } else {
      // Damage animation
      setAnimation('damage');
      const assetIndex = newState.ai.assets.findIndex(a => a.instanceId === targetAsset.instanceId);

      if (assetIndex !== -1) {
        const newAssetState = getNextAssetState(targetAsset.state);
        newState.ai.assets[assetIndex] = {
          ...newState.ai.assets[assetIndex],
          state: newAssetState,
          damageCount: newState.ai.assets[assetIndex].damageCount + 1,
        };

        const stateMsg = newAssetState === 'revealed' ? 'OBSERVED' :
                        newAssetState === 'rotated' ? 'ASSESSED' : 'PWN\'d!';

        newState.message = `Attack hit! ${targetAsset.card.assetName} is now ${stateMsg}`;
        newState = addLogToState(newState, {
          actor: 'player',
          action: 'Attack Hit',
          details: `Outcome: ${stateMsg}\n${formatAttackDetails(attackCard, targetAsset.card.assetName, targetAsset.state)}`,
        });
      }

      newState.player.taHand = newState.player.taHand.filter(c => c.instanceId !== attackCard.instanceId);
      newState.player.taDiscard.push(attackCard.card);
      newState.phase = 'attack_phase';
      newState.attackState = null;
      newState.animation = 'damage';
    }

    const win = getWinReason(newState);
    if (win) {
      newState.phase = win.phase;
      newState.message = win.phase === 'player_won'
        ? `You Win! ${win.reason}`
        : `Game Over! ${win.reason}`;
      newState = addLogToState(newState, { actor: win.phase === 'player_won' ? 'player' : 'ai', action: 'Game End', details: win.reason });
      playSound(win.phase === 'player_won' ? 'win' : 'lose');
    }

    setGameState(newState);
    await delayWithSkip(1200);
    setAnimation('none');
    showOwaspInfo(null);
    setIsProcessing(false);
  }, [addLogToState, delayWithSkip, formatAttackDetails, formatDefenseDetails, gameState, getWinReason, isProcessing, playSound, showOwaspInfo, setAnimation]);

  const endTurn = useCallback(async () => {
    if (isProcessing) return;
    if (gameState.phase !== 'attack_phase') return;
    if (gameState.currentAttacker !== 'player') return;

    setIsProcessing(true);

    let newState = { ...gameState };
    const { newHand: playerNewTA, newDeck: taDeck1 } = drawToHandSize(
      newState.player.taHand,
      newState.taDeck,
      newState.player.taHand.length + 2
    );
    newState.player.taHand = playerNewTA;
    newState.taDeck = taDeck1;
    newState.currentAttacker = 'ai';
    newState.turnNumber++;
    newState.message = 'AI\'s turn to attack...';
    newState.selectedCard = null;
    newState.selectedAsset = null;

    setGameState(newState);
    await delayWithSkip(1000);
    await executeAITurn(newState);
  }, [gameState, isProcessing]);

  const executeAITurn = async (state: GameState) => {
    let newState = { ...state };
    let continueAttacking = true;
    skipAIRef.current = false;

    while (continueAttacking && newState.phase === 'attack_phase') {
      // Step 1: Choose target
      newState.message = 'AI is choosing a target...';
      setGameState({ ...newState });
      await delayWithSkip(700);

      const target = aiChooseTarget(newState.player.assets);
      if (!target) {
        newState = addLogToState(newState, { actor: 'ai', action: 'No Attack', details: 'No valid target available.' });
        setGameState({ ...newState });
        continueAttacking = false;
        break;
      }

      // Step 2: Choose attack card
      newState.message = `AI targets your ${target.card.assetName}...`;
      setGameState({ ...newState });
      await delayWithSkip(700);

      const attackDecision = aiChooseAttackCard(
        newState.ai.taHand,
        target,
        newState.player.dcHand,
        state.difficulty || 'hard'
      );
      if (!attackDecision.card) {
        newState = addLogToState(newState, { actor: 'ai', action: 'No Attack', details: 'AI has no valid attack card.' });
        setGameState({ ...newState });
        continueAttacking = false;
        break;
      }

      const attackCard = attackDecision.card;

      // Set attack state for arrow animation
      newState.attackState = {
        targetAsset: target,
        attackCard,
        stage: target.state === 'facedown' ? 'observation' : target.state === 'revealed' ? 'assessment' : 'pwn',
        attacksThisRound: (newState.attackState?.attacksThisRound || 0) + 1,
      };

      // Attack animation
      newState.animation = 'attack';
      if (attackCard.card.category === 'threat_agent') {
        const taCard = attackCard.card as ThreatAgentCard;
        showOwaspInfo({ title: taCard.owaspRisk.name, category: 'risk', description: taCard.owaspRisk.description });
      }

      newState.message = `AI attacks your ${target.card.assetName}!`;
      newState = addLogToState(newState, {
        actor: 'ai',
        action: 'Attack',
        details: `${attackDecision.reasoning}\n${formatAttackDetails(attackCard, target.card.assetName, target.state)}`,
      });
      setGameState({ ...newState });
      await delayWithSkip(1200);

      const playerDefense = newState.player.dcHand.find(hc => canDefend(attackCard.card, hc.card));

      if (playerDefense) {
        // Defense animation
        newState.animation = 'defend';
        if (playerDefense.card.category === 'defense_control') {
          const dcCard = playerDefense.card as DefenseControlCard;
          showOwaspInfo({ title: dcCard.owaspControl.name, category: 'control', description: dcCard.owaspControl.description });
        }

        newState.ai.taHand = newState.ai.taHand.filter(c => c.instanceId !== attackCard.instanceId);
        newState.ai.taDiscard.push(attackCard.card);
        newState.player.dcHand = newState.player.dcHand.filter(c => c.instanceId !== playerDefense.instanceId);
        newState.player.dcDiscard.push(playerDefense.card);
        newState.player.successfulDefenses++;

        const { newHand, newDeck } = drawToHandSize(newState.player.dcHand, newState.dcDeck, newState.player.dcHand.length + 2);
        newState.player.dcHand = newHand;
        newState.dcDeck = newDeck;

        newState.message = `You defended with ${playerDefense.card.category === 'defense_control'
          ? (playerDefense.card as DefenseControlCard).owaspControl.name : 'Joker'}!`;

        newState = addLogToState(newState, {
          actor: 'player',
          action: 'Defended',
          details: formatDefenseDetails(playerDefense.card, attackCard.card, target.card.assetName),
        });

        continueAttacking = false;
      } else {
        // Damage animation
        newState.animation = 'damage';
        const assetIndex = newState.player.assets.findIndex(a => a.instanceId === target.instanceId);

        if (assetIndex !== -1) {
          const newAssetState = getNextAssetState(target.state);
          newState.player.assets[assetIndex] = {
            ...newState.player.assets[assetIndex],
            state: newAssetState,
            damageCount: newState.player.assets[assetIndex].damageCount + 1,
          };

          const stateMsg = newAssetState === 'revealed' ? 'OBSERVED' :
                          newAssetState === 'rotated' ? 'ASSESSED' : 'PWN\'d!';
          newState.message = `No defense! Your ${target.card.assetName} is now ${stateMsg}`;

          newState = addLogToState(newState, {
            actor: 'ai',
            action: 'Attack Hit',
            details: `Outcome: ${stateMsg}\n${formatAttackDetails(attackCard, target.card.assetName, target.state)}`,
          });
        }

        newState.ai.taHand = newState.ai.taHand.filter(c => c.instanceId !== attackCard.instanceId);
        newState.ai.taDiscard.push(attackCard.card);

        const continueDecision = aiDecideContinueOrEnd(newState.ai.taHand, 0, newState.player.assets, state.difficulty || 'hard');
        continueAttacking = continueDecision.action === 'attack';
      }

      const winCheck = checkWinCondition(newState);
      if (winCheck !== 'attack_phase' && winCheck !== 'defense_phase') {
        newState.phase = winCheck;
        newState.message = winCheck === 'player_won'
          ? 'You Win! You breached the AI\'s systems!'
          : 'Game Over! The AI breached your systems!';
        // Play win/lose sound
        if (winCheck === 'player_won') {
          playSound('win');
        } else {
          playSound('lose');
        }
        continueAttacking = false;
      }

      setGameState({ ...newState });
      await delayWithSkip(1200);
      showOwaspInfo(null);
    }

    if (newState.phase === 'attack_phase') {
      const { newHand: aiNewTA, newDeck: taDeck1 } = drawToHandSize(
        newState.ai.taHand, newState.taDeck, newState.ai.taHand.length + 2
      );
      newState.ai.taHand = aiNewTA;
      newState.taDeck = taDeck1;
      newState.currentAttacker = 'player';
      newState.turnNumber++;
      newState.message = 'Your turn! Select a Threat Agent card to attack.';
    }

    newState.animation = 'none';
    setGameState(newState);
    setIsProcessing(false);
  };

  return {
    gameState,
    isProcessing,
    resetGame,
    selectCard,
    selectAsset,
    playerAttack,
    endTurn,
    showOwaspInfo,
    performCoinFlip,
    requestSkipAI,
    setDifficulty,
  };
}
