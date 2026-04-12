import React from 'react';
import './gameui.css';

/* ========== GamePanel ========== */
export const GamePanel = ({
  children, className = '', variant = '', accent = false, rivets = false, ...props
}) => (
  <div
    className={`gui-panel ${variant ? `gui-panel--${variant}` : ''} ${accent ? 'gui-panel--accent' : ''} ${rivets ? 'gui-panel--rivets' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const PanelHeader = ({ title, subtitle, children, right }) => (
  <div className="gui-panel-header">
    <div>
      <h2 className="gui-panel-title">{title}</h2>
      {subtitle && <div className="gui-panel-subtitle">{subtitle}</div>}
    </div>
    {right || children}
  </div>
);

export const PanelBody = ({ children, className = '' }) => (
  <div className={`gui-panel-body ${className}`}>{children}</div>
);

export const PanelFooter = ({ children }) => (
  <div className="gui-panel-footer">{children}</div>
);

/* ========== GameButton ========== */
export const GameButton = ({
  children, variant = 'ghost', size = '', full = false, className = '', ...props
}) => (
  <button
    className={`gui-btn gui-btn--${variant} ${size ? `gui-btn--${size}` : ''} ${full ? 'gui-btn--full' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

/* ========== GameModal ========== */
export const GameModal = ({ children, open, onClose, width = '', className = '' }) => {
  if (!open) return null;
  return (
    <div className="gui-modal-overlay" onClick={onClose} data-testid="gui-modal-overlay">
      <div
        className={`gui-panel gui-panel--bordered gui-modal ${width ? `gui-modal--${width}` : ''} ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

/* ========== GameSlider ========== */
export const GameSlider = ({ label, value, min = 0, max = 100, onChange, suffix = '%' }) => (
  <div className="gui-slider-wrap">
    <div className="gui-slider-label">
      <span>{label}</span>
      <span className="gui-slider-value">{value}{suffix}</span>
    </div>
    <input
      type="range"
      className="gui-slider"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      data-testid={`slider-${label?.toLowerCase().replace(/\s/g, '-')}`}
    />
  </div>
);

/* ========== GameToggle ========== */
export const GameToggle = ({ label, checked, onChange }) => (
  <div className="gui-toggle-wrap">
    <span className="gui-toggle-label">{label}</span>
    <div
      className={`gui-toggle ${checked ? 'gui-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
      data-testid={`toggle-${label?.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="gui-toggle-knob" />
    </div>
  </div>
);

/* ========== GameBadge ========== */
export const GameBadge = ({ children, color = 'teal' }) => (
  <span className={`gui-badge gui-badge--${color}`}>{children}</span>
);

/* ========== GameTabs ========== */
export const GameTabs = ({ tabs, active, onChange }) => (
  <div className="gui-tabs">
    {tabs.map(t => (
      <button
        key={t.id}
        className={`gui-tab ${active === t.id ? 'gui-tab--active' : ''}`}
        onClick={() => onChange(t.id)}
        data-testid={`tab-${t.id}`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

/* ========== GameList ========== */
export const GameList = ({ children }) => (
  <div className="gui-list">{children}</div>
);

export const GameListItem = ({
  num, title, subtitle, right, active, locked, onClick, testId,
}) => (
  <div
    className={`gui-list-item ${active ? 'gui-list-item--active' : ''} ${locked ? 'gui-list-item--locked' : ''}`}
    onClick={locked ? undefined : onClick}
    data-testid={testId}
  >
    {num !== undefined && <div className="gui-list-num">{num}</div>}
    <div className="gui-list-content">
      <div className="gui-list-title">{title}</div>
      {subtitle && <div className="gui-list-sub">{subtitle}</div>}
    </div>
    {right}
  </div>
);

/* ========== SpeakerBox ========== */
export const SpeakerBox = ({ speaker, displayText, waiting, onAdvance }) => {
  if (!speaker) return null;
  const isScrap = speaker.portrait === 'scrap';
  return (
    <div className="gui-speaker-box" onClick={onAdvance} data-testid="dialogue-box">
      <div
        className="gui-speaker-inner"
        style={{ background: speaker.bgColor, borderColor: speaker.borderColor }}
      >
        <div
          className="gui-speaker-portrait"
          style={{ background: `${speaker.color}22`, borderColor: speaker.borderColor }}
        >
          {isScrap ? (
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="10" r="5" fill={speaker.color} opacity="0.8"/>
              <rect x="12" y="15" width="4" height="10" rx="1" fill={speaker.color} opacity="0.6"/>
              <circle cx="11" cy="9" r="2" fill="#FF3B30"/>
              <circle cx="17" cy="9" r="2" fill={speaker.color}/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 28 28">
              <path d="M14 4 L8 12 L6 10 L4 12 L10 20 L14 16 L18 20 L24 12 L22 10 L20 12 L14 4Z" fill={speaker.color} opacity="0.8"/>
              <circle cx="11" cy="12" r="1.5" fill="#fff"/>
              <circle cx="17" cy="12" r="1.5" fill="#fff"/>
            </svg>
          )}
        </div>
        <div className="gui-speaker-content">
          <div className="gui-speaker-name" style={{ color: speaker.color }}>
            {speaker.name}
          </div>
          <div className="gui-speaker-text">
            {displayText}
            {!waiting && <span style={{ opacity: 0.5 }}>|</span>}
          </div>
          {waiting && (
            <div className="gui-speaker-advance">SPACE / CLICK to continue</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ========== MeterBar ========== */
export const MeterBar = ({ value, max, color = 'teal', label }) => (
  <div style={{ width: '100%' }}>
    {label && (
      <div className="gui-slider-label" style={{ marginBottom: 4 }}>
        <span>{label}</span>
        <span className="gui-slider-value">{value}/{max}</span>
      </div>
    )}
    <div className="gui-meter">
      <div
        className={`gui-meter-fill gui-meter-fill--${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

/* ========== Divider ========== */
export const Divider = ({ dashed }) => (
  <div className={`gui-divider ${dashed ? 'gui-divider--dashed' : ''}`} />
);

/* ========== KeyCap ========== */
export const KeyCap = ({ children }) => (
  <span className="gui-key">{children}</span>
);

/* ========== Terminal Text ========== */
export const TerminalText = ({ children }) => (
  <span className="gui-terminal">{children}</span>
);

/* ========== Power Card ========== */
export const PowerCard = ({ name, letter, color, desc, active, locked }) => (
  <div className={`gui-power-card ${active ? 'gui-power-card--active' : ''} ${locked ? 'gui-power-card--locked' : ''}`}>
    <div className="gui-power-icon" style={{ background: color }}>
      {letter}
    </div>
    <div className="gui-power-name">{name}</div>
    {desc && <div className="gui-power-desc">{desc}</div>}
  </div>
);

/* ========== Leaderboard Row ========== */
export const LeaderboardRow = ({ rank, score, coins, level }) => {
  const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';
  return (
    <div className="gui-lb-row" data-testid={`lb-row-${rank}`}>
      <div className={`gui-lb-rank gui-lb-rank--${rankClass}`}>#{rank}</div>
      <div className="gui-lb-score">{score.toLocaleString()}</div>
      <div className="gui-lb-detail">Lv.{level + 1}</div>
      <div className="gui-lb-detail">{coins} coins</div>
    </div>
  );
};
