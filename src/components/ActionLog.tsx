/**
 * ActionLog Component
 * Displays a scrollable log of game actions
 */

import { GameAction } from '../types';
import './ActionLog.css';

interface ActionLogProps {
  actions: GameAction[];
}

export function ActionLog({ actions }: ActionLogProps) {
  return (
    <div className="action-log">
      <div className="log-header">
        <h3>Action Log</h3>
        <span className="log-count">{actions.length} events</span>
      </div>
      <div className="log-content">
        {actions.length === 0 ? (
          <div className="log-empty">No actions yet...</div>
        ) : (
          actions.map((action, idx) => (
            <div key={idx} className={`log-entry log-${action.actor}`}>
              <div className="log-actor">
                {action.actor === 'player' ? '👤' : '🤖'} {action.actor === 'player' ? 'You' : 'AI'}
              </div>
              <div className="log-action">{action.action}</div>
              <div className="log-details">{action.details}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
