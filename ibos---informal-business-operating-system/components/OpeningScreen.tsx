import React, { useState, useEffect } from 'react';

interface OpeningScreenProps {
  onComplete: () => void;
  durationSeconds?: number;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({ 
  onComplete,
  durationSeconds = 6 
}) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const totalMs = durationSeconds * 1000;

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / totalMs) * 100);
      setProgressPercent(progress);

      // Smooth fade-out 400ms before 6s completion
      if (elapsed >= totalMs - 400) {
        setIsFadingOut(true);
      }

      if (elapsed >= totalMs) {
        clearInterval(interval);
        onComplete();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationSeconds, totalMs, onComplete]);

  const handleAdvance = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div 
      onClick={handleAdvance}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden select-none cursor-pointer transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes coinZoomInWhite {
          0% {
            transform: scale(0.35);
            opacity: 0;
            filter: blur(6px);
          }
          15% {
            opacity: 1;
            filter: blur(0px);
          }
          50% {
            transform: scale(0.85);
          }
          85% {
            transform: scale(1.22);
          }
          100% {
            transform: scale(1.38);
          }
        }

        @keyframes subtleAuraPulse {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.6;
          }
        }

        .animate-coin-zoom-white {
          animation: coinZoomInWhite 6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity, filter;
        }

        .animate-aura-white {
          animation: subtleAuraPulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle radial ambient background glow for depth on white */}
      <div 
        className="absolute w-96 h-96 rounded-full bg-amber-100/40 filter blur-3xl pointer-events-none animate-aura-white"
      />

      {/* Center Coins Logo Container */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="animate-coin-zoom-white flex items-center justify-center">
          {/* Subtle soft-shadow coin frame */}
          <div className="relative p-7 sm:p-9 rounded-3xl bg-neutral-900 text-amber-400 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-neutral-800">
            {/* Coins SVG */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 512 512"
              className="w-24 h-24 sm:w-32 sm:h-32 fill-current drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]"
            >
              <title>coins-filled</title>
              <path 
                fill="currentColor" 
                fillRule="evenodd" 
                d="M85.333 245.333c0-64.466 43.992-118.658 103.594-134.192C218.22 94.695 252.015 85.318 288 85.318c8.103 0 16.094.475 23.948 1.4C285.9 72.244 255.913 64 224 64C123.852 64 42.667 145.186 42.667 245.333c0 57.577 26.834 108.885 68.678 142.103C94.773 358.059 85.318 324.133 85.318 288c0-7.924.454-15.741 1.34-23.428a140 140 0 0 1-1.325-19.239m202.667 224c100.148 0 181.333-81.185 181.333-181.333S388.148 106.667 288 106.667S106.667 187.852 106.667 288S187.852 469.333 288 469.333m-10.667-298.666H320v32h21.333v42.666h-64c-23.564 0-42.666 19.103-42.666 42.667s19.102 42.667 42.666 42.667h64v42.666H320v32h-42.667v-32C230.205 373.333 192 335.128 192 288s38.205-85.333 85.333-85.333z" 
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Ultra-minimalist Hairline Progress Indicator at very bottom (No Text) */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-neutral-100 overflow-hidden">
        <div 
          className="h-full bg-neutral-900 transition-all duration-75 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
