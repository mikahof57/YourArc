import React from 'react';
import { Coins, Zap } from 'lucide-react';

interface BackgroundAnimationsProps {
  activeAnimationId?: string;
  customColors?: string[];
}

export const BackgroundAnimations: React.FC<BackgroundAnimationsProps> = ({
  activeAnimationId,
  customColors = [],
}) => {
  if (!activeAnimationId) {
    // If no active animation, check if custom design colors are active to apply background glow
    if (customColors.length > 0) {
      return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse"
            style={{ backgroundColor: customColors[0] || '#f59e0b' }}
          />
          {customColors[1] && (
            <div
              className="absolute top-1/2 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
              style={{ backgroundColor: customColors[1], animationDelay: '1s' }}
            />
          )}
          {customColors[2] && (
            <div
              className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
              style={{ backgroundColor: customColors[2], animationDelay: '2s' }}
            />
          )}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 1. LANGSAMER GELDREGEN (750 Credits) */}
      {activeAnimationId === 'anim_gold_rain' && (
        <div className="absolute inset-0">
          {Array.from({ length: 24 }).map((_, i) => {
            const left = (i * 4.2 + (i % 3) * 2) % 100;
            const duration = 6 + (i % 5) * 1.5;
            const delay = (i % 7) * 0.8;
            const size = 16 + (i % 4) * 6;
            const opacity = 0.4 + (i % 3) * 0.2;

            return (
              <div
                key={i}
                className="absolute text-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-goldRain"
                style={{
                  left: `${left}%`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  opacity,
                }}
              >
                <Coins style={{ width: size, height: size }} />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. ELEKTRISCHER STROM (500 Credits) */}
      {activeAnimationId === 'anim_electric_lines' && (
        <div className="absolute inset-0 border-2 border-cyan-500/20">
          {/* Top Border Electric Pulse */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-electricPulseHorizontal" />
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-electricPulseHorizontalReverse" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-electricPulseVertical" />
          <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-electricPulseVerticalReverse" />

          {/* Electric Arcs in corners */}
          <div className="absolute top-4 left-4 text-cyan-400 animate-bounce opacity-60">
            <Zap className="w-5 h-5 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
          </div>
          <div className="absolute bottom-4 right-4 text-cyan-400 animate-bounce opacity-60">
            <Zap className="w-5 h-5 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
          </div>
        </div>
      )}

      {/* 3. CYBER CODE STREAM (400 Credits) */}
      {activeAnimationId === 'anim_matrix_stream' && (
        <div className="absolute inset-0 flex justify-between px-4 opacity-30 text-[10px] font-mono text-emerald-400 select-none">
          {Array.from({ length: 14 }).map((_, col) => {
            const duration = 4 + (col % 4) * 1.2;
            const delay = (col % 5) * 0.6;
            return (
              <div
                key={col}
                className="flex flex-col space-y-2 animate-matrixStream"
                style={{
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              >
                <span>01</span>
                <span>10</span>
                <span>CYBER</span>
                <span>ZEN</span>
                <span>88</span>
                <span>99</span>
                <span>0101</span>
                <span>TITAN</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. ZEN AURA DUST (350 Credits) */}
      {activeAnimationId === 'anim_zen_aura' && (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => {
            const left = (i * 5 + 3) % 100;
            const duration = 8 + (i % 4) * 2;
            const delay = (i % 6) * 0.9;
            const size = 8 + (i % 5) * 6;

            return (
              <div
                key={i}
                className="absolute rounded-full bg-amber-400/60 filter blur-[2px] animate-zenAura"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.8)',
                }}
              />
            );
          })}
        </div>
      )}

      {/* 5. SANFTER REGEN (250 Credits) */}
      {activeAnimationId === 'anim_gentle_rain' && (
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: 30 }).map((_, i) => {
            const left = (i * 3.3) % 100;
            const duration = 1.2 + (i % 4) * 0.4;
            const delay = (i % 5) * 0.3;

            return (
              <div
                key={i}
                className="absolute w-[1px] h-12 bg-gradient-to-b from-transparent via-cyan-300 to-transparent animate-gentleRain"
                style={{
                  left: `${left}%`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Styles for Keyframe Animations */}
      <style>{`
        @keyframes goldRain {
          0% {
            transform: translateY(-50px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes electricPulseHorizontal {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes electricPulseHorizontalReverse {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        @keyframes electricPulseVertical {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes electricPulseVerticalReverse {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }

        @keyframes matrixStream {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(105vh); opacity: 0; }
        }

        @keyframes zenAura {
          0% { transform: translateY(105vh) scale(0.8); opacity: 0; }
          20% { opacity: 0.7; }
          80% { opacity: 0.7; }
          100% { transform: translateY(-50px) scale(1.3); opacity: 0; }
        }

        @keyframes gentleRain {
          0% { transform: translateY(-60px) translateX(0); opacity: 0; }
          20% { opacity: 0.5; }
          100% { transform: translateY(105vh) translateX(-30px); opacity: 0; }
        }

        .animate-goldRain {
          animation: goldRain linear infinite;
        }

        .animate-electricPulseHorizontal {
          animation: electricPulseHorizontal 3s linear infinite;
        }

        .animate-electricPulseHorizontalReverse {
          animation: electricPulseHorizontalReverse 3s linear infinite;
        }

        .animate-electricPulseVertical {
          animation: electricPulseVertical 3s linear infinite;
        }

        .animate-electricPulseVerticalReverse {
          animation: electricPulseVerticalReverse 3s linear infinite;
        }

        .animate-matrixStream {
          animation: matrixStream linear infinite;
        }

        .animate-zenAura {
          animation: zenAura ease-in-out infinite;
        }

        .animate-gentleRain {
          animation: gentleRain linear infinite;
        }
      `}</style>
    </div>
  );
};
