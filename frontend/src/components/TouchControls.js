import React from 'react';
import './TouchControls.css';

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
    >
      {children || label}
    </div>
  );

  return (
    <div className="touch-controls" data-testid="touch-controls">
      {/* D-Pad (Left side) */}
      <div className="touch-dpad">
        <Btn code="KeyA" label="L" className="touch-dpad-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="3" fill="none"/>
          </svg>
        </Btn>
        <Btn code="ArrowUp" label="UP" className="touch-dpad-up">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="3" fill="none"/>
          </svg>
        </Btn>
        <Btn code="KeyD" label="R" className="touch-dpad-right">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="3" fill="none"/>
          </svg>
        </Btn>
        <Btn code="KeyS" label="DN" className="touch-dpad-down">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="3" fill="none"/>
          </svg>
        </Btn>
      </div>

      {/* Action Buttons (Right side) */}
      <div className="touch-actions">
        <Btn code="Space"     label="A"   className="touch-jump" />
        <Btn code="KeyJ"      label="X"   className="touch-attack" />
        <Btn code="ShiftLeft" label="⟫"   className="touch-dash" />
        <Btn code="KeyK"      label="■"   className="touch-special" />
        <Btn code="KeyQ"      label="Q"   className="touch-assist" />
      </div>

      {/* Top buttons */}
      <div className="touch-top">
        <Btn code="Escape" label="II" className="touch-pause" />
        <Btn code="KeyE" label="USE" className="touch-interact" />
      </div>
    </div>
  );
};

export default TouchControls;
