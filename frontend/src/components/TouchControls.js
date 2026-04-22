import React from 'react';
import './TouchControls.css';

const Arrow = ({ dir }) => {
  // dir: 'l' | 'r' | 'u' | 'd' — thick rounded chevron with inner highlight
  const d = {
    l: 'M16 6 L8 12 L16 18 M10 12 H22',
    r: 'M8 6 L16 12 L8 18 M2 12 H14',
    u: 'M6 16 L12 8 L18 16 M12 10 V22',
    d: 'M6 8 L12 16 L18 8 M12 14 V2',
  }[dir];
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"
         strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
};

// Jump (arrow up + landing dot)
const JumpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
       strokeLinejoin="round" aria-hidden>
    <path d="M12 4 V16" />
    <path d="M7 9 L12 4 L17 9" />
    <path d="M6 20 H18" />
  </svg>
);

// Attack — crossed wrench + star
const AttackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 3 L13.8 9 L20 9 L15 13 L17 20 L12 16 L7 20 L9 13 L4 9 L10.2 9 Z"
          stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

// Dash — double chevrons speed lines
const DashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"
       strokeLinejoin="round" aria-hidden>
    <path d="M5 7 L11 12 L5 17" />
    <path d="M13 7 L19 12 L13 17" />
  </svg>
);

// Special / Power — lightning bolt
const SpecialIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13 2 L4 13 H11 L9 22 L20 10 H13 Z"
          stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
  </svg>
);

// Assist — two overlapping circles (buddy/helper glyph)
const AssistIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
    <circle cx="9"  cy="12" r="5" />
    <circle cx="15" cy="12" r="5" />
  </svg>
);

// Pause — two bars
const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="6"  y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

// Interact — hand tap
const InteractIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
       strokeLinejoin="round" aria-hidden>
    <path d="M12 3 V11 M8 5 V11 M16 5 V11 M5 11 V16 a7 7 0 0 0 14 0 V8" />
  </svg>
);

const TouchControls = ({ visible }) => {
  if (!visible) return null;

  const handleTouch = (action, isDown) => {
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
      code: action, bubbles: true, cancelable: true,
    });
    window.dispatchEvent(event);
  };

  const Btn = ({ code, label, className, children }) => (
    <div
      className={`touch-btn ${className || ''}`}
      data-testid={`touch-${label.toLowerCase()}`}
      onTouchStart={(e) => { e.preventDefault(); handleTouch(code, true); }}
      onTouchEnd={(e) => { e.preventDefault(); handleTouch(code, false); }}
      onMouseDown={() => handleTouch(code, true)}
      onMouseUp={() => handleTouch(code, false)}
      onMouseLeave={() => handleTouch(code, false)}
    >
      {children || label}
    </div>
  );

  return (
    <div className="touch-controls" data-testid="touch-controls">
      {/* D-Pad */}
      <div className="touch-dpad">
        <Btn code="KeyA"    label="left"  className="touch-dpad-left"><Arrow dir="l" /></Btn>
        <Btn code="ArrowUp" label="up"    className="touch-dpad-up"><Arrow dir="u" /></Btn>
        <Btn code="KeyD"    label="right" className="touch-dpad-right"><Arrow dir="r" /></Btn>
        <Btn code="KeyS"    label="down"  className="touch-dpad-down"><Arrow dir="d" /></Btn>
      </div>

      {/* Action cluster */}
      <div className="touch-actions">
        <Btn code="Space"     label="jump"    className="touch-jump"><JumpIcon /></Btn>
        <Btn code="KeyJ"      label="attack"  className="touch-attack"><AttackIcon /></Btn>
        <Btn code="ShiftLeft" label="dash"    className="touch-dash"><DashIcon /></Btn>
        <Btn code="KeyK"      label="special" className="touch-special"><SpecialIcon /></Btn>
        <Btn code="KeyQ"      label="assist"  className="touch-assist"><AssistIcon /></Btn>
      </div>

      {/* Utility */}
      <div className="touch-top">
        <Btn code="Escape" label="pause"    className="touch-pause"><PauseIcon /></Btn>
        <Btn code="KeyE"   label="interact" className="touch-interact"><InteractIcon /></Btn>
      </div>
    </div>
  );
};

export default TouchControls;
