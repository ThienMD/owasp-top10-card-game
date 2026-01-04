/**
 * Hand Component
 *
 * Displays the cards in a player's hand.
 * Shows both TA (attack) and DC (defense) cards separately.
 */

import { HandCard } from '../types';
import { Card } from './Card';
import './Hand.css';

interface HandProps {
  taCards: HandCard[];
  dcCards: HandCard[];
  selectedCard: HandCard | null;
  onSelectCard: (card: HandCard) => void;
  isPlayer: boolean;
  showDefense?: boolean;
  disabled?: boolean;
}

export function Hand({
  taCards,
  dcCards,
  selectedCard,
  onSelectCard,
  isPlayer,
  showDefense = false,
  disabled,
}: HandProps) {
  const displayCards = showDefense ? dcCards : taCards;
  const label = showDefense ? 'Defense Controls' : 'Threat Agents';

  return (
    <div className={`hand ${isPlayer ? 'player-hand' : 'ai-hand'}`}>
      <div className="hand-header">
        <span className="hand-label">
          {isPlayer ? 'Your' : "AI's"} {label}
        </span>
        <span className="hand-count">({displayCards.length} cards)</span>
      </div>

      <div className="hand-cards">
        {displayCards.length > 0 ? (
          displayCards.map(handCard => (
            <Card
              key={handCard.instanceId}
              card={handCard.card}
              selected={selectedCard?.instanceId === handCard.instanceId}
              disabled={disabled || !isPlayer}
              onClick={() => isPlayer && onSelectCard(handCard)}
            />
          ))
        ) : (
          <div className="empty-hand">No cards</div>
        )}
      </div>
    </div>
  );
}
