/**
 * Card Component - Poker-style card display
 *
 * Displays Threat Agent (TA) or Defense Control (DC) cards.
 * TA cards are red (hearts/diamonds), DC cards are black (spades/clubs).
 */

import { PlayableCard, ThreatAgentCard, DefenseControlCard } from '../types';
import { getSuitSymbol, getSuitColor } from '../data/cards';
import './Card.css';

interface CardProps {
  card: PlayableCard;
  selected?: boolean;
  disabled?: boolean;
  small?: boolean;
  onClick?: () => void;
}

export function Card({ card, selected, disabled, small, onClick }: CardProps) {
  const suitSymbol = getSuitSymbol(card.suit);
  const suitColor = getSuitColor(card.suit);

  const isJoker = card.category === 'joker';
  const isTA = card.category === 'threat_agent';
  const isDC = card.category === 'defense_control';

  const getValue = (): string => {
    if (isJoker) return '★';
    if (isTA) return String((card as ThreatAgentCard).value);
    if (isDC) return String((card as DefenseControlCard).value);
    return '?';
  };

  const getName = (): string => {
    if (isJoker) return card.jokerType === 'black' ? 'Black Joker' : 'Red Joker';
    if (isTA) return (card as ThreatAgentCard).owaspRisk.name;
    if (isDC) return (card as DefenseControlCard).owaspControl.name;
    return '';
  };

  const getCategory = (): string => {
    if (isJoker) return 'WILDCARD';
    if (isTA) return 'THREAT';
    if (isDC) return 'CONTROL';
    return '';
  };

  return (
    <div
      className={`poker-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${small ? 'small' : ''} ${card.category}`}
      style={{ '--suit-color': suitColor } as React.CSSProperties}
      onClick={disabled ? undefined : onClick}
    >
      <div className="card-corner top-left">
        <span className="card-value">{getValue()}</span>
        <span className="card-suit">{suitSymbol}</span>
      </div>

      <div className="card-center">
        <div className="card-category">{getCategory()}</div>
        <div className="card-suit-large">{suitSymbol}</div>
        <div className="card-name">{getName()}</div>
      </div>

      <div className="card-corner bottom-right">
        <span className="card-value">{getValue()}</span>
        <span className="card-suit">{suitSymbol}</span>
      </div>
    </div>
  );
}
