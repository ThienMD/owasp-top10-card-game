/**
 * OWASP Top Ten Card Game - Type Definitions
 * Based on official OWASP rules: https://owasp.org/www-project-top-ten-card-game/
 */

// Card suits - Hearts/Diamonds for Threat Agents, Spades/Clubs for Defense Controls
export type TASuit = 'hearts' | 'diamonds';
export type DCSuit = 'spades' | 'clubs';
export type Suit = TASuit | DCSuit;

// Card values 1-10 map to OWASP Top 10
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Face card types for cyber assets
export type FaceCardType = 'jack' | 'queen' | 'king';

// Joker types - wildcards
export type JokerType = 'black' | 'red';

// Card categories
export type CardCategory = 'threat_agent' | 'defense_control' | 'asset' | 'joker';

// Asset states in the 3-phase attack progression
export type AssetState = 'facedown' | 'revealed' | 'rotated' | 'destroyed';

// Player roles - players alternate between attacker and defender
export type PlayerRole = 'attacker' | 'defender';

// Game phases
export type GamePhase =
  | 'difficulty_select'
  | 'coin_flip'
  | 'setup'
  | 'draw_phase'
  | 'attack_phase'
  | 'defense_phase'
  | 'resolution_phase'
  | 'player_won'
  | 'ai_won';

// Animation types
export type AnimationType = 'none' | 'attack' | 'defend' | 'damage' | 'coin_flip';

// Attack phase within the 3-stage progression
export type AttackStage = 'observation' | 'assessment' | 'pwn';

// OWASP Top 10 2021 mapping (card value 1-10)
export interface OwaspRisk {
  id: string;
  name: string;
  description: string;
}

// OWASP Proactive Controls mapping (card value 1-10)
export interface OwaspControl {
  id: string;
  name: string;
  description: string;
}

// Base card interface
export interface BaseCard {
  id: string;
  suit: Suit | 'joker';
  category: CardCategory;
}

// Threat Agent card (Hearts/Diamonds, values 1-10)
export interface ThreatAgentCard extends BaseCard {
  suit: TASuit;
  category: 'threat_agent';
  value: CardValue;
  owaspRisk: OwaspRisk;
}

// Defense Control card (Spades/Clubs, values 1-10)
export interface DefenseControlCard extends BaseCard {
  suit: DCSuit;
  category: 'defense_control';
  value: CardValue;
  owaspControl: OwaspControl;
}

// Cyber Asset card (Face cards - Jack, Queen, King)
export interface AssetCard extends BaseCard {
  suit: Suit;
  category: 'asset';
  faceType: FaceCardType;
  assetName: string;
}

// Joker card (wildcards)
export interface JokerCard extends BaseCard {
  suit: 'joker';
  category: 'joker';
  jokerType: JokerType;
}

// Union type for all cards
export type Card = ThreatAgentCard | DefenseControlCard | AssetCard | JokerCard;

// Playable cards (TA or DC, not assets)
export type PlayableCard = ThreatAgentCard | DefenseControlCard | JokerCard;

// Card in hand with unique instance ID
export interface HandCard {
  instanceId: string;
  card: PlayableCard;
}

// Cyber asset on the board
export interface CyberAsset {
  instanceId: string;
  card: AssetCard;
  state: AssetState;
  damageCount: number; // 0, 1, 2, or 3 (destroyed)
}

// Player state
export interface PlayerState {
  assets: CyberAsset[];
  taHand: HandCard[]; // Threat Agent cards in hand
  dcHand: HandCard[]; // Defense Control cards in hand
  taDiscard: PlayableCard[];
  dcDiscard: PlayableCard[];
  successfulDefenses: number; // Track for win condition
}

// Current attack state
export interface AttackState {
  targetAsset: CyberAsset | null;
  attackCard: HandCard | null;
  stage: AttackStage;
  attacksThisRound: number;
}

// Difficulty levels
export type Difficulty = 'easy' | 'hard' | 'brutal' | null;

// Game state
export interface GameState {
  phase: GamePhase;
  currentAttacker: 'player' | 'ai';
  difficulty: Difficulty;
  player: PlayerState;
  ai: PlayerState;
  taDeck: PlayableCard[];
  dcDeck: PlayableCard[];
  attackState: AttackState | null;
  turnNumber: number;
  cardsDrawnThisGame: number;
  lastAction: GameAction | null;
  actionLog: GameAction[];
  selectedCard: HandCard | null;
  selectedAsset: CyberAsset | null;
  message: string;
  showOwaspInfo: OwaspInfo | null;
  animation: AnimationType;
  coinFlipResult: 'player' | 'ai' | null;
}

// Action log entry
export interface GameAction {
  actor: 'player' | 'ai';
  action: string;
  details: string;
}

// OWASP info display
export interface OwaspInfo {
  title: string;
  category: 'risk' | 'control';
  description: string;
}

// AI decision
export interface AIDecision {
  action: 'attack' | 'defend' | 'draw_end' | 'reboot';
  card?: HandCard;
  targetAsset?: CyberAsset;
  reasoning: string;
}
