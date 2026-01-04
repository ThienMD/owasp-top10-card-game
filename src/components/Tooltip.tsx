/**
 * Tooltip Component
 *
 * Displays educational OWASP information when cards are played.
 * Shows either OWASP Top 10 risks or Proactive Controls.
 */

import { OwaspInfo } from '../types';
import './Tooltip.css';

interface TooltipProps {
  info: OwaspInfo | null;
}

export function Tooltip({ info }: TooltipProps) {
  if (!info) return null;

  const isRisk = info.category === 'risk';

  return (
    <div className="tooltip-overlay">
      <div className={`tooltip-card ${info.category}`}>
        <div className="tooltip-header">
          <span className="tooltip-icon">
            {isRisk ? '⚠️' : '🛡️'}
          </span>
          <div className="tooltip-title-section">
            <span className="tooltip-category">
              {isRisk ? 'OWASP TOP 10 RISK' : 'OWASP PROACTIVE CONTROL'}
            </span>
            <h3 className="tooltip-title">{info.title}</h3>
          </div>
        </div>
        <div className="tooltip-body">
          <p className="tooltip-description">{info.description}</p>
        </div>
        <div className="tooltip-footer">
          {isRisk
            ? 'This attack exploits a common web security vulnerability'
            : 'This defense implements a security best practice'}
        </div>
      </div>
    </div>
  );
}
