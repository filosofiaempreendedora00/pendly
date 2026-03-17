import { useEffect, useState } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSecondLine(true), 2800);
    const t2 = setTimeout(() => setFadeOut(true), 4800);
    const t3 = setTimeout(() => onComplete(), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className={`intro-overlay ${fadeOut ? 'intro-fade-out' : 'intro-fade-in'}`}>
      {/* Layered gradient background */}
      <div className="intro-bg" />

      {/* Pendulum */}
      <div className="intro-pendulum-wrap">
        <svg
          width="220"
          height="320"
          viewBox="0 0 220 320"
          style={{ overflow: 'visible', display: 'block' }}
        >
          <defs>
            <radialGradient id="intro-bob-grad" cx="42%" cy="38%" r="60%">
              <stop offset="0%"   stopColor="rgba(195,218,255,0.82)" />
              <stop offset="55%"  stopColor="rgba(78,128,210,0.88)" />
              <stop offset="100%" stopColor="rgba(22,58,148,0.94)" />
            </radialGradient>

            <radialGradient id="intro-pivot-grad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="100%" stopColor="rgba(160,210,255,0.6)" />
            </radialGradient>

            <linearGradient id="intro-rod-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="100%" stopColor="rgba(180,215,255,0.5)" />
            </linearGradient>

            <filter id="intro-bob-glow" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="intro-rod-glow" x="-200%" y="-5%" width="500%" height="110%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Pendulum arm — rotates around its own top-center */}
          <g
            className="intro-pendulum-arm"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'top center',
            }}
          >
            {/* Rod */}
            <line
              x1="110"
              y1="0"
              x2="110"
              y2="268"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Bob */}
            <circle
              cx="110"
              cy="285"
              r="26"
              fill="url(#intro-bob-grad)"
              filter="url(#intro-bob-glow)"
            />
          </g>

          {/* Pivot dot */}
          <circle cx="110" cy="0" r="4.5" fill="url(#intro-pivot-grad)" />
        </svg>
      </div>

      {/* Text */}
      <div className="intro-text-wrap">
        <p className="intro-line1">Respire fundo.</p>
        <p className={`intro-line2 ${showSecondLine ? 'intro-line2--visible' : ''}`}>
          E encontre seu equilíbrio.
        </p>
      </div>
    </div>
  );
}
