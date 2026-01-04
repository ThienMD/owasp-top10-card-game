/**
 * OWASP Card Game - AI Decision System
 *
 * Rule-based AI for the official OWASP card game rules.
 * Handles both attacking and defending decisions.
 */

import {
  HandCard,
  CyberAsset,
  AIDecision,
  PlayableCard,
  ThreatAgentCard,
  DefenseControlCard,
} from '../types';
import { canDefend } from '../data/cards';
import { getRandomElement } from './helpers';

/**
 * AI decides which card to play for an attack
 * Prefers cards that opponent cannot defend against.
 * Note: With current canDefend() rules, a Joker ATTACK is defendable by any defense card,
 * so Joker attacks are generally a bad choice.
 */
export function aiChooseAttackCard(
  taHand: HandCard[],
  _targetAsset: CyberAsset,
  defenderDcHand: HandCard[] = [],
  difficulty: 'easy' | 'hard' | 'brutal' = 'hard'
): AIDecision {
  if (taHand.length === 0) {
    return {
      action: 'draw_end',
      reasoning: 'No attack cards available, ending turn',
    };
  }

  const taCards = taHand.filter(hc => hc.card.category === 'threat_agent');
  const jokerCards = taHand.filter(hc => hc.card.category === 'joker');

  // If we have any proper TA cards, never pick Joker attacks (they're too easy to defend).
  const usableAttackCards = taCards.length > 0 ? taCards : jokerCards;

  // Easy mode: still somewhat random, but avoid obvious Joker blunders when TA cards exist.
  if (difficulty === 'easy') {
    const chosen = getRandomElement(usableAttackCards) || usableAttackCards[0];
    return {
      action: 'attack',
      card: chosen,
      reasoning: `Attacking with ${(chosen.card as ThreatAgentCard).owaspRisk?.name || 'card'}`,
    };
  }

  // Hard mode: perfect information.
  // Choose an attack card that the defender cannot defend (no matching DC and no Joker).
  const defenderCards = defenderDcHand.map(hc => hc.card);
  const defenderHasJoker = defenderCards.some(c => c.category === 'joker');

  const notDefendable = usableAttackCards.filter(att =>
    !defenderCards.some(def => canDefend(att.card, def))
  );

  if (notDefendable.length > 0) {
    // Prefer higher value (more likely to avoid matching DC if hands change; also just stronger play)
    const best = [...notDefendable].sort((a, b) => {
      const av = a.card.category === 'threat_agent' ? (a.card as ThreatAgentCard).value : 0;
      const bv = b.card.category === 'threat_agent' ? (b.card as ThreatAgentCard).value : 0;
      return bv - av;
    })[0];

    return {
      action: 'attack',
      card: best,
      reasoning: defenderHasJoker
        ? 'Attacking with a value that avoids all non-joker defenses'
        : 'Attacking with an undefendable value',
    };
  }

  // If everything is defendable, choose a value that forces a Joker (i.e., avoids any matching DC).
  // If the defender has a Joker, this still minimizes easy blocks.
  const matchingDcValues = new Set(
    defenderCards
      .filter(c => c.category === 'defense_control')
      .map(c => (c as DefenseControlCard).value)
  );

  const forcesJoker = usableAttackCards.filter(att =>
    att.card.category === 'threat_agent' && !matchingDcValues.has((att.card as ThreatAgentCard).value)
  );

  if (forcesJoker.length > 0) {
    const best = [...forcesJoker].sort((a, b) => (b.card as ThreatAgentCard).value - (a.card as ThreatAgentCard).value)[0];
    return {
      action: 'attack',
      card: best,
      reasoning: 'Forcing Joker defense (no matching Defense Control value)',
    };
  }

  // Fallback: pick the highest value TA card.
  const fallback = [...usableAttackCards].sort((a, b) => {
    const av = a.card.category === 'threat_agent' ? (a.card as ThreatAgentCard).value : 0;
    const bv = b.card.category === 'threat_agent' ? (b.card as ThreatAgentCard).value : 0;
    return bv - av;
  })[0];

  return {
    action: 'attack',
    card: fallback,
    reasoning: `Attacking with ${(fallback.card as ThreatAgentCard).owaspRisk?.name || 'card'}`,
  };
}

/**
 * AI decides which asset to target
 * Prioritizes assets closest to being destroyed
 */
export function aiChooseTarget(assets: CyberAsset[]): CyberAsset | null {
  const validTargets = assets.filter(a => a.state !== 'destroyed');
  if (validTargets.length === 0) return null;

  const stateRank: Record<CyberAsset['state'], number> = {
    facedown: 1,
    revealed: 2,
    rotated: 3,
    destroyed: 0,
  };

  // Always prioritize the most "flipped" target (rotated > revealed > facedown),
  // then the most damaged within that group.
  const sorted = [...validTargets].sort((a, b) => {
    const rankDiff = stateRank[b.state] - stateRank[a.state];
    if (rankDiff !== 0) return rankDiff;
    const damageA = (a.damageCount ?? 0);
    const damageB = (b.damageCount ?? 0);
    return damageB - damageA;
  });

  return sorted[0];
}

/**
 * AI decides whether to defend and with which card
 * Returns null if AI chooses not to defend or can't defend
 * @param difficulty - 'easy' makes AI defend less often (~15% of the time), 'hard' defends more often (~50%)
 */
export function aiChooseDefense(
  dcHand: HandCard[],
  attackCard: PlayableCard,
  difficulty: 'easy' | 'hard' | 'brutal' = 'hard'
): AIDecision {
  if (dcHand.length === 0) {
    return {
      action: 'defend',
      reasoning: 'No defense cards available',
    };
  }

  // Find cards that can defend (matching value or joker)
  const validDefenses = dcHand.filter(hc => canDefend(attackCard, hc.card));

  if (validDefenses.length === 0) {
    return {
      action: 'defend',
      reasoning: 'No matching defense card available',
    };
  }

  // Difficulty-based defense probability
  // Easy: AI only defends 15% of the time (high human win rate)
  // Hard: AI defends 50% of the time (roughly even)
  // Brutal: AI defends 95% of the time (very high AI win rate)
  const defendChance = difficulty === 'easy' ? 0.15 : difficulty === 'hard' ? 0.5 : 0.95;
  const shouldDefend = Math.random() < defendChance;

  if (!shouldDefend) {
    return {
      action: 'defend',
      reasoning: 'Choosing not to defend',
    };
  }

  // Prefer non-joker cards to save jokers for when really needed
  const nonJokerDefenses = validDefenses.filter(hc => hc.card.category !== 'joker');

  if (nonJokerDefenses.length > 0) {
    const defenseCard = nonJokerDefenses[0];
    return {
      action: 'defend',
      card: defenseCard,
      reasoning: `Defending with ${(defenseCard.card as DefenseControlCard).owaspControl?.name || 'card'}`,
    };
  }

  // Use joker only if asset is about to be destroyed (rotated state)
  // Otherwise, let the attack through
  const jokerDefense = validDefenses.find(hc => hc.card.category === 'joker');
  if (jokerDefense) {
    return {
      action: 'defend',
      card: jokerDefense,
      reasoning: 'Using Joker to defend',
    };
  }

  return {
    action: 'defend',
    reasoning: 'Choosing not to defend to save resources',
  };
}

/**
 * AI decides whether to continue attacking or end turn
 * @param difficulty - 'easy' makes AI less aggressive, 'hard' makes AI more aggressive
 */
export function aiDecideContinueOrEnd(
  taHand: HandCard[],
  _successfulAttacksThisRound: number,
  targetAssets: CyberAsset[],
  difficulty: 'easy' | 'hard' | 'brutal' = 'hard'
): AIDecision {
  const validTargets = targetAssets.filter(a => a.state !== 'destroyed');

  // If no valid targets, must end turn
  if (validTargets.length === 0) {
    return {
      action: 'draw_end',
      reasoning: 'No valid targets remaining',
    };
  }

  // If no attack cards left, must end turn
  if (taHand.length === 0) {
    return {
      action: 'draw_end',
      reasoning: 'No attack cards remaining',
    };
  }

  // AI strategy: Continue attacking if:
  // 1. Has a target close to being destroyed (rotated)
  // 2. Has plenty of cards
  // 3. Random chance based on aggression

  const rotatedTargets = validTargets.filter(a => a.state === 'rotated');

  // Always try to finish off a rotated target
  if (rotatedTargets.length > 0 && taHand.length >= 1) {
    return {
      action: 'attack',
      reasoning: 'Continuing attack to destroy rotated asset',
    };
  }

  // If hand is getting low (< 3 cards), consider ending
  if (taHand.length < 3) {
    return {
      action: 'draw_end',
      reasoning: 'Ending turn to replenish hand',
    };
  }

  // Difficulty-based aggression
  // Easy: 30% chance to continue (less aggressive)
  // Hard: 70% chance to continue (more aggressive)
  // Brutal: 95% chance to continue (highly aggressive)
  const continueChance = difficulty === 'easy' ? 0.3 : difficulty === 'hard' ? 0.7 : 0.95;
  if (Math.random() < continueChance) {
    return {
      action: 'attack',
      reasoning: 'Continuing attack to pressure opponent',
    };
  }

  return {
    action: 'draw_end',
    reasoning: 'Ending turn strategically',
  };
}

/**
 * AI decides whether to use reboot (combine discard with hand, costs 1 asset damage)
 */
export function aiDecideReboot(
  dcHand: HandCard[],
  dcDiscard: PlayableCard[],
  assets: CyberAsset[]
): boolean {
  const activeAssets = assets.filter(a => a.state !== 'destroyed');

  // Don't reboot if we'd lose our last asset
  if (activeAssets.length <= 1) {
    return false;
  }

  // Reboot if hand is very low and discard has useful cards
  if (dcHand.length <= 1 && dcDiscard.length >= 3) {
    return true;
  }

  return false;
}
