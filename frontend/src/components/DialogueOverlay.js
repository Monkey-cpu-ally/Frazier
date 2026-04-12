import React, { useEffect, useCallback } from 'react';
import { SpeakerBox } from './gameui';

const DialogueOverlay = ({ dialogue, onAdvance }) => {
  const handleKey = useCallback((e) => {
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyX') {
      e.preventDefault();
      onAdvance();
    }
  }, [onAdvance]);

  useEffect(() => {
    if (dialogue?.active) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [dialogue?.active, handleKey]);

  if (!dialogue?.active || !dialogue?.current) return null;

  return (
    <div className="dialogue-overlay" data-testid="dialogue-overlay">
      <SpeakerBox
        speaker={dialogue.current}
        displayText={dialogue.getDisplayText()}
        waiting={dialogue.waitingForInput}
        onAdvance={onAdvance}
      />
    </div>
  );
};

export default DialogueOverlay;
