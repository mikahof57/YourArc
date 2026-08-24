import React, { useEffect, useState } from 'react';
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
  assignmentKind?: 'normal' | 'restday';
  restdayOptions?: Array<{ key: string; title: string }>;
  onMarkDone: (statId: string, choiceKey?: string | null) => Promise<void> | void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  stat,
  task,
  isCompleted,
  lang = 'en',
  onClose,
  onMarkDone,
  assignmentKind = 'normal',
  restdayOptions = [],
}) => {
  const [selectedChoiceKey, setSelectedChoiceKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedChoiceKey(null);
    setSubmitError(null);
  }, [task.id]);

  const handleComplete = async () => {
    if (isCompleted) {
      onClose();
      return;
    }
    if (isSubmitting || (assignmentKind === 'restday' && selectedChoiceKey === null)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onMarkDone(stat.id, assignmentKind === 'restday' ? selectedChoiceKey : null);
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
      onClose();
    } catch (error) {
      console.error('Could not complete daily assignment:', error);
      setSubmitError(lang === 'de' ? 'Aufgabe konnte nicht abgeschlossen werden.' : 'Could not complete this task.');
    } finally {
      setIsSubmitting(false);
    }
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
              {t('statValue', lang)} // {translateStatName(stat.name, lang)}
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

        {assignmentKind === 'restday' && (
          <div className="space-y-2 mb-4" role="radiogroup" aria-label="Rest day option">
            {restdayOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selectedChoiceKey === option.key}
                disabled={isSubmitting || isCompleted}
                onClick={() => setSelectedChoiceKey(option.key)}
                className={`w-full p-3 rounded-lg border text-left text-xs transition-all ${
                  selectedChoiceKey === option.key
                    ? 'border-cyan-400 bg-cyan-950/70 text-cyan-100'
                    : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-cyan-500/50'
                }`}
              >
                {option.title}
              </button>
            ))}
          </div>
        )}

        {submitError && <p className="mb-3 text-xs text-rose-400" role="alert">{submitError}</p>}

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
            disabled={isCompleted || isSubmitting || (assignmentKind === 'restday' && selectedChoiceKey === null)}
            className={`flex items-center space-x-2 font-bold px-6 py-2.5 rounded text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] ${
              isCompleted
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 opacity-80 cursor-default'
                : isSubmitting || (assignmentKind === 'restday' && selectedChoiceKey === null)
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 opacity-70 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 active:scale-95'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? t('alreadyDone', lang) : isSubmitting ? '...' : t('markDone', lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
