import React from 'react';
import { StatAttribute, TaskItem } from '../../types';
import { X, CheckCircle, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, t, translateStatName } from '../../utils/i18n';

interface TaskModalProps {
  stat: StatAttribute;
  task: TaskItem;
  isCompleted: boolean;
  lang?: Language;
  onClose: () => void;
  onMarkDone: (statId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  stat,
  task,
  isCompleted,
  lang = 'en',
  onClose,
  onMarkDone,
}) => {
  const handleComplete = () => {
    if (!isCompleted) {
      // Trigger subtle celebration confetti
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#10b981', '#3b82f6'],
        });
      } catch (e) {
        // Fallback
      }

      onMarkDone(stat.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/40 rounded-xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        {/* Futuristic Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-all border border-transparent hover:border-cyan-500/30"
          title={t('close', lang)}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4 pr-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            {stat.emoji}
          </div>
          <div>
            <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
              {t('statValue', lang)} // {translateStatName(stat.name, lang)} (+2%)
            </span>
            <h3 className="text-base font-bold text-slate-100">{task.title}</h3>
          </div>
        </div>

        {/* Task Content */}
        <div className="bg-slate-950/90 p-4 rounded-lg border border-slate-800 my-4 text-xs text-slate-300 leading-relaxed space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
            <Target className="w-4 h-4" />
            <span>{t('dailyTaskTitle', lang)}</span>
          </div>
          <p className="text-slate-200">{task.description}</p>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-all"
          >
            {t('cancel', lang)}
          </button>
          <button
            onClick={handleComplete}
            disabled={isCompleted}
            className={`flex items-center space-x-2 font-bold px-6 py-2.5 rounded text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] ${
              isCompleted
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 opacity-80 cursor-default'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 active:scale-95'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? t('alreadyDone', lang) : t('markDone', lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
