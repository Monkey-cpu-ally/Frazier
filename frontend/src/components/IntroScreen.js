import React, { useRef, useEffect } from 'react';
import { IntroAnimation } from '../game/intro';

const IntroScreen = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const introRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1280;
    canvas.height = 720;

    const intro = new IntroAnimation(canvas, onComplete);
    introRef.current = intro;
    intro.start();

    const handleKey = () => intro.skip();
    const handleClick = () => intro.skip();
    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', handleClick);

    return () => {
      intro.running = false;
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('click', handleClick);
    };
  }, [onComplete]);

  return (
    <div
      data-testid="intro-screen"
      style={{
        position: 'absolute',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="intro-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
};

export default IntroScreen;
