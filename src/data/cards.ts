/**
 * OWASP Top Ten Card Game - Card Data
 * Based on official OWASP rules with poker deck mapping
 *
 * Card Values 1-10 map to OWASP Top 10 (2021)
 * Hearts/Diamonds = Threat Agent (TA) cards
 * Spades/Clubs = Defense Control (DC) cards
 * Face cards (J/Q/K) = Cyber Assets
 * Jokers = Wildcards
 */

import {
  ThreatAgentCard,
  DefenseControlCard,
  AssetCard,
  JokerCard,
  PlayableCard,
  OwaspRisk,
  OwaspControl,
  CardValue,
  TASuit,
  DCSuit,
  FaceCardType,
  Suit,
} from '../types';

// OWASP Top 10 2021 - Mapped to card values 1-10
export const owaspTop10Risks: Record<CardValue, OwaspRisk> = {
  1: {
    id: 'A01:2021',
    name: 'Broken Access Control',
    description: 'Restrictions on authenticated users are not properly enforced. Attackers can exploit these flaws to access unauthorized functionality or data.',
  },
  2: {
    id: 'A02:2021',
    name: 'Cryptographic Failures',
    description: 'Failures related to cryptography which often lead to sensitive data exposure. This includes weak encryption, improper key management, and clear text transmission.',
  },
  3: {
    id: 'A03:2021',
    name: 'Injection',
    description: 'Untrusted data is sent to an interpreter as part of a command or query. SQL, NoSQL, OS, and LDAP injection can result in data loss or system compromise.',
  },
  4: {
    id: 'A04:2021',
    name: 'Insecure Design',
    description: 'Missing or ineffective security controls design. This represents risks related to design and architectural flaws, calling for more use of threat modeling and secure design patterns.',
  },
  5: {
    id: 'A05:2021',
    name: 'Security Misconfiguration',
    description: 'Missing security hardening, improperly configured permissions, unnecessary features enabled, default accounts unchanged, or overly informative error messages.',
  },
  6: {
    id: 'A06:2021',
    name: 'Vulnerable Components',
    description: 'Using components with known vulnerabilities. This includes libraries, frameworks, and other software modules running with the same privileges as the application.',
  },
  7: {
    id: 'A07:2021',
    name: 'Auth Failures',
    description: 'Identification and authentication failures. Weaknesses in authentication mechanisms allow attackers to compromise passwords, keys, or session tokens.',
  },
  8: {
    id: 'A08:2021',
    name: 'Data Integrity Failures',
    description: 'Software and data integrity failures relate to code and infrastructure that does not protect against integrity violations, including insecure CI/CD pipelines.',
  },
  9: {
    id: 'A09:2021',
    name: 'Logging Failures',
    description: 'Security logging and monitoring failures. Without proper logging, breaches cannot be detected. Insufficient logging, detection, monitoring, and active response.',
  },
  10: {
    id: 'A10:2021',
    name: 'SSRF',
    description: 'Server-Side Request Forgery occurs when a web application fetches a remote resource without validating the user-supplied URL, allowing attackers to coerce the application.',
  },
};

// OWASP Proactive Controls - Mapped to card values 1-10
export const owaspProactiveControls: Record<CardValue, OwaspControl> = {
  1: {
    id: 'C1',
    name: 'Define Security Requirements',
    description: 'A security requirement is a statement of needed security functionality. Derived from industry standards, laws, and vulnerability history.',
  },
  2: {
    id: 'C2',
    name: 'Leverage Security Frameworks',
    description: 'Use vetted security frameworks and libraries. Secure coding libraries help guard against security-related design and implementation flaws.',
  },
  3: {
    id: 'C3',
    name: 'Secure Database Access',
    description: 'Prevent SQL injection and ensure secure database interactions through parameterized queries, stored procedures, and input validation.',
  },
  4: {
    id: 'C4',
    name: 'Encode and Escape Data',
    description: 'Encoding and escaping are defensive techniques to prevent injection attacks. Apply output encoding contextually for HTML, JavaScript, CSS, and URLs.',
  },
  5: {
    id: 'C5',
    name: 'Validate All Inputs',
    description: 'Input validation ensures only properly formed data enters the system. Validate on a trusted server with positive validation (allow lists).',
  },
  6: {
    id: 'C6',
    name: 'Implement Digital Identity',
    description: 'Digital identity includes authentication (proving identity) and session management. Implement strong password policies and multi-factor authentication.',
  },
  7: {
    id: 'C7',
    name: 'Enforce Access Controls',
    description: 'Access control ensures users cannot act outside their intended permissions. Apply principle of least privilege and deny by default.',
  },
  8: {
    id: 'C8',
    name: 'Protect Data Everywhere',
    description: 'Protect sensitive data in transit and at rest. Use strong encryption, proper key management, and data classification.',
  },
  9: {
    id: 'C9',
    name: 'Implement Logging & Monitoring',
    description: 'Logging security events enables detection and investigation. Log authentication, access control, and input validation failures.',
  },
  10: {
    id: 'C10',
    name: 'Handle All Errors',
    description: 'Proper error handling prevents information leakage. Display generic error messages to users while logging detailed errors securely.',
  },
};

// Cyber Asset names for face cards
export const cyberAssetNames: Record<FaceCardType, string> = {
  jack: 'Web Server',
  queen: 'Database Server',
  king: 'Authentication System',
};

// Generate unique ID for cards
let cardIdCounter = 0;
const generateCardId = (): string => `card-${++cardIdCounter}`;

/**
 * Create a Threat Agent card
 */
function createTACard(suit: TASuit, value: CardValue): ThreatAgentCard {
  return {
    id: generateCardId(),
    suit,
    category: 'threat_agent',
    value,
    owaspRisk: owaspTop10Risks[value],
  };
}

/**
 * Create a Defense Control card
 */
function createDCCard(suit: DCSuit, value: CardValue): DefenseControlCard {
  return {
    id: generateCardId(),
    suit,
    category: 'defense_control',
    value,
    owaspControl: owaspProactiveControls[value],
  };
}

/**
 * Create an Asset card (face card)
 */
function createAssetCard(suit: Suit, faceType: FaceCardType): AssetCard {
  return {
    id: generateCardId(),
    suit,
    category: 'asset',
    faceType,
    assetName: cyberAssetNames[faceType],
  };
}

/**
 * Create a Joker card
 */
function createJokerCard(jokerType: 'black' | 'red'): JokerCard {
  return {
    id: generateCardId(),
    suit: 'joker',
    category: 'joker',
    jokerType,
  };
}

/**
 * Generate the full deck of cards
 */
export function generateFullDeck(): {
  taCards: ThreatAgentCard[];
  dcCards: DefenseControlCard[];
  taAssets: AssetCard[];
  dcAssets: AssetCard[];
  jokers: JokerCard[];
} {
  const taCards: ThreatAgentCard[] = [];
  const dcCards: DefenseControlCard[] = [];
  const taAssets: AssetCard[] = [];
  const dcAssets: AssetCard[] = [];

  const taSuits: TASuit[] = ['hearts', 'diamonds'];
  const dcSuits: DCSuit[] = ['spades', 'clubs'];
  const faceTypes: FaceCardType[] = ['jack', 'queen', 'king'];
  const values: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Generate TA cards (Hearts & Diamonds, values 1-10)
  for (const suit of taSuits) {
    for (const value of values) {
      taCards.push(createTACard(suit, value));
    }
    // Generate TA assets (face cards)
    for (const faceType of faceTypes) {
      taAssets.push(createAssetCard(suit, faceType));
    }
  }

  // Generate DC cards (Spades & Clubs, values 1-10)
  for (const suit of dcSuits) {
    for (const value of values) {
      dcCards.push(createDCCard(suit, value));
    }
    // Generate DC assets (face cards)
    for (const faceType of faceTypes) {
      dcAssets.push(createAssetCard(suit, faceType));
    }
  }

  // Generate jokers
  const jokers: JokerCard[] = [
    createJokerCard('black'),
    createJokerCard('red'),
  ];

  return { taCards, dcCards, taAssets, dcAssets, jokers };
}

/**
 * Create a shuffled deck of playable cards (TA or DC)
 */
export function createShuffledDeck(cards: PlayableCard[]): PlayableCard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get display name for a card
 */
export function getCardDisplayName(card: PlayableCard): string {
  if (card.category === 'joker') {
    return card.jokerType === 'black' ? 'Black Joker' : 'Red Joker';
  }
  if (card.category === 'threat_agent') {
    return `${card.value} of ${card.suit.charAt(0).toUpperCase() + card.suit.slice(1)}`;
  }
  if (card.category === 'defense_control') {
    return `${card.value} of ${card.suit.charAt(0).toUpperCase() + card.suit.slice(1)}`;
  }
  return 'Unknown Card';
}

/**
 * Get suit symbol for display
 */
export function getSuitSymbol(suit: Suit | 'joker'): string {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'spades': return '♠';
    case 'clubs': return '♣';
    case 'joker': return '🃏';
    default: return '?';
  }
}

/**
 * Get suit color
 */
export function getSuitColor(suit: Suit | 'joker'): string {
  switch (suit) {
    case 'hearts':
    case 'diamonds':
      return '#e74c3c'; // Red for TA suits
    case 'spades':
    case 'clubs':
      return '#2c3e50'; // Dark for DC suits
    case 'joker':
      return '#9b59b6'; // Purple for jokers
    default:
      return '#7f8c8d';
  }
}

/**
 * Check if a card can defend against an attack (DC# = TA#)
 */
export function canDefend(attackCard: PlayableCard, defenseCard: PlayableCard): boolean {
  // Jokers are wildcards - always can defend/attack
  if (defenseCard.category === 'joker') return true;
  if (attackCard.category === 'joker') return true;

  // Defense must be DC, Attack must be TA
  if (defenseCard.category !== 'defense_control') return false;
  if (attackCard.category !== 'threat_agent') return false;

  // Values must match
  return defenseCard.value === attackCard.value;
}
