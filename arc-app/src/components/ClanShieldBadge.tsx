import React from 'react';
import { ClanBadgeConfig } from '../types';

interface ClanShieldBadgeProps {
  config?: ClanBadgeConfig;
  fallbackEmoji?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SHIELD_SHAPES = [
  { id: 1, name: 'Klassisches Wappen', path: 'M 15 10 L 85 10 L 85 50 C 85 75 50 95 50 95 C 50 95 15 75 15 50 Z' },
  { id: 2, name: 'Gotisches Schild', path: 'M 15 20 Q 50 5 85 20 L 85 52 C 85 75 50 95 50 95 C 50 95 15 75 15 52 Z' },
  { id: 3, name: 'Turnierschild', path: 'M 20 10 L 80 10 L 85 30 L 50 95 L 15 30 Z' },
  { id: 4, name: 'Römisches Scutum', path: 'M 15 12 Q 50 5 85 12 L 85 88 Q 50 95 15 88 Z' },
  { id: 5, name: 'Rundschild Emblem', path: 'M 50 5 A 45 45 0 1 1 49.9 5 Z' },
  { id: 6, name: 'Cyber Hexagon', path: 'M 50 5 L 90 25 L 90 75 L 50 95 L 10 75 L 10 25 Z' },
  { id: 7, name: 'Ritter-Diamant', path: 'M 50 5 L 92 50 L 50 95 L 8 50 Z' },
  { id: 8, name: 'Heraldic Crest', path: 'M 10 10 L 30 10 L 35 20 L 65 20 L 70 10 L 90 10 L 88 55 C 88 78 50 95 50 95 C 50 95 12 78 12 55 Z' },
  { id: 9, name: 'Cyber Achteck', path: 'M 30 5 L 70 5 L 95 30 L 95 70 L 70 95 L 30 95 L 5 70 L 5 30 Z' },
  { id: 10, name: 'Aegis Flügelschild', path: 'M 15 15 Q 50 5 85 15 L 92 35 C 92 65 50 95 50 95 C 50 95 8 65 8 35 Z' },
];

export const PRESET_COLORS = [
  '#00f0ff', // Cyber Cyan
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Gold / Amber
  '#10b981', // Emerald
  '#3b82f6', // Royal Blue
  '#6366f1', // Indigo
  '#1e293b', // Slate Dark
  '#f8fafc', // Platinum White
];

export const POPULAR_IOS_EMOJIS = [
  '🛡️', '⚔️', '👑', '⚡', '🦅', '🐺', '🦁', '🐉', '🔥', '💎',
  '🔮', '🚀', '☣️', '🎯', '👾', '🌌', '👁️', '🗡️', '🪐', '🏆',
  '🔱', '⚜️', '🐲', '🐯', '💥', '🌙', '☠️', '🚩', '🦾', '🧠'
];

export const ClanShieldBadge: React.FC<ClanShieldBadgeProps> = ({
  config,
  fallbackEmoji = '🛡️',
  size = 'md',
  className = '',
}) => {
  const shapeId = config?.shapeId || 1;
  const colors = config?.colors && config.colors.length > 0 ? config.colors : ['#00f0ff', '#a855f7'];
  const emoji = config?.emoji || fallbackEmoji;

  const shapeObj = SHIELD_SHAPES.find((s) => s.id === shapeId) || SHIELD_SHAPES[0];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
  };

  const gradientId = React.useId().replace(/:/g, '');

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] transition-all duration-300"
      >
        <defs>
          <linearGradient id={`shield-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {colors.length === 1 && (
              <>
                <stop offset="0%" stopColor={colors[0]} stopOpacity="0.9" />
                <stop offset="100%" stopColor={colors[0]} stopOpacity="0.4" />
              </>
            )}
            {colors.length === 2 && (
              <>
                <stop offset="0%" stopColor={colors[0]} stopOpacity="0.95" />
                <stop offset="100%" stopColor={colors[1]} stopOpacity="0.85" />
              </>
            )}
            {colors.length >= 3 && (
              <>
                <stop offset="0%" stopColor={colors[0]} stopOpacity="0.95" />
                <stop offset="50%" stopColor={colors[1]} stopOpacity="0.9" />
                <stop offset="100%" stopColor={colors[2]} stopOpacity="0.85" />
              </>
            )}
          </linearGradient>

          <filter id={`glow-${gradientId}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Shield Border Glow */}
        <path
          d={shapeObj.path}
          fill="none"
          stroke={colors[0] || '#00f0ff'}
          strokeWidth="6"
          strokeOpacity="0.4"
          filter={`url(#glow-${gradientId})`}
        />

        {/* Shield Fill Gradient */}
        <path
          d={shapeObj.path}
          fill={`url(#shield-grad-${gradientId})`}
          stroke={colors[colors.length - 1] || '#00f0ff'}
          strokeWidth="3"
        />

        {/* Inner Shield Accent Contour Line */}
        <path
          d={shapeObj.path}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeOpacity="0.3"
          transform="scale(0.88) translate(6, 6)"
        />
      </svg>

      {/* Centered Emoji */}
      <span className="absolute inset-0 flex items-center justify-center select-none pointer-events-none drop-shadow-md">
        {emoji}
      </span>
    </div>
  );
};
