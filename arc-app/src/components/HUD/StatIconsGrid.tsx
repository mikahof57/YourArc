import React from 'react';
import { StatAttribute } from '../../types';
import { CheckCircle2, Sparkles, Minus, Maximize2 } from 'lucide-react';
import { Language, t, translateStatName } from '../../utils/i18n';

interface StatIconsGridProps {
  stats: StatAttribute[];
  completedTasksToday: string[];
  lang?: Language;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onSelectStatIcon: (stat: StatAttribute) => void;
}

export const StatIconsGrid: React.FC<StatIconsGridProps> = ({
  stats,
  completedTasksToday,
  lang = 'en',
  isMinimized = false,
  onToggleMinimize,
  onSelectStatIcon,
}) => {
  const completedCount = stats.filter((s) => completedTasksToday.includes(s.id)).length;

  if (isMinimized) {
    return (
      <div
        className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 backdrop-blur-md transition-all duration-300 flex items-center justify-between"
        style={{
          borderColor: 'var(--theme-c1)',
          boxShadow: '0 0 10px var(--theme-glow1)',
        }}
      >
        <div className="flex-1 h-[2px] bg-cyan-500/30 rounded-full mr-4" />
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            title={lang === 'en' ? 'Expand window' : 'Fenster vergrößern'}
            className="p-1 px-2 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 transition-all shrink-0 flex items-center space-x-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase hidden sm:inline">
              {lang === 'en' ? 'Expand' : 'Öffnen'}
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full bg-slate-900/90 border rounded-xl p-3.5 sm:p-5 backdrop-blur-md font-mono transition-all duration-300"
      style={{
        borderColor: 'var(--theme-c1)',
        boxShadow: '0 0 25px var(--theme-glow1)',
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold tracking-widest flex items-center space-x-1.5 text-sm" style={{ color: 'var(--theme-c1)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--theme-c1)' }} />
            <span>{t('dailyProtocols', lang)}</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
            {completedCount}/{stats.length} {lang === 'en' ? 'done' : 'erledigt'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[10px] text-slate-400 hidden sm:inline">{t('clickToComplete', lang)}</span>

          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              title={lang === 'en' ? 'Minimize window' : 'Fenster minimieren'}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400/60 text-slate-300 hover:text-cyan-300 transition-all shrink-0 flex items-center space-x-1"
            >
              <Minus className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
                {lang === 'en' ? 'Minimize' : 'Minimieren'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
          {stats.map((st) => {
            const isDone = completedTasksToday.includes(st.id);

            return (
              <button
                key={st.id}
                onClick={() => onSelectStatIcon(st)}
                className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border transition-all duration-500 ${
                  isDone
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] saturate-100'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-cyan-500/40 grayscale hover:grayscale-0 animate-pulse-slow'
                }`}
              >
                {/* Status Emoji / Symbol */}
                <div
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-500 ${
                    isDone
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.5)] scale-105'
                      : 'bg-slate-900 border-slate-700 text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/50'
                  }`}
                >
                  <span className="text-2xl">{st.emoji}</span>

                  {isDone && (
                    <div className="absolute -top-1 -right-1 bg-emerald-400 text-slate-950 rounded-full p-0.5 shadow-md">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Stat Name */}
                <span className="mt-2 text-xs font-bold text-slate-200 tracking-wide text-center truncate w-full">
                  {translateStatName(st.name, lang)}
                </span>

                {/* Status Badge */}
                <span
                  className={`mt-1 text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border ${
                    isDone
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:text-cyan-400'
                  }`}
                >
                  {isDone ? t('statusDone', lang) : t('statusOpen', lang)}
                </span>
              </button>
            );
          })}
        </div>
    </div>
  );
};
