import React, { useState } from 'react';
import { DeletedTaskItem } from '../../types';
import { X, RotateCcw, Trash2, Sparkles, Filter, Search, ShieldCheck } from 'lucide-react';
import { getTierInfo } from '../../data/taskDatabase';
import { Language, translateStatName } from '../../utils/i18n';

interface DeletedTasksModalProps {
  deletedTasks: DeletedTaskItem[];
  lang?: Language;
  onRestoreTask: (task: DeletedTaskItem) => void;
  onClearAllDeleted?: () => void;
  onClose: () => void;
}

export const DeletedTasksModal: React.FC<DeletedTasksModalProps> = ({
  deletedTasks,
  lang = 'en',
  onRestoreTask,
  onClearAllDeleted,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatId, setSelectedStatId] = useState<string>('all');

  // Filter tasks
  const filtered = deletedTasks.filter((t) => {
    const matchesStat = selectedStatId === 'all' || t.statId === selectedStatId;
    const translatedStat = translateStatName(t.statName, lang);
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translatedStat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.statName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStat && matchesSearch;
  });

  // Unique stats in deleted list
  const statFilters = Array.from(
    new Set(deletedTasks.map((t) => JSON.stringify({ id: t.statId, name: t.statName, emoji: t.statEmoji })))
  ).map((s: string) => JSON.parse(s));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-rose-500/50 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(244,63,94,0.25)] flex flex-col max-h-[85vh]">
        {/* Futuristic Corner accents */}
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-rose-400 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-rose-400 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-rose-400 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-rose-400 rounded-br-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-rose-400 uppercase tracking-widest block font-bold">
                {lang === 'en' ? 'Restore Center' : 'Wiederherstellungs-Zentrale'}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>{lang === 'en' ? 'Deleted Tasks' : 'Gelöschte Aufgaben'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/30 font-bold">
                  {deletedTasks.length}
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
            title={lang === 'en' ? 'Close' : 'Schließen'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader / Info */}
        <p className="text-xs text-slate-400 my-3 leading-relaxed">
          {lang === 'en' ? (
            <>
              Click <strong className="text-cyan-400">Restore</strong> on a task to add it back to your active daily tasks.
            </>
          ) : (
            <>
              Klicke auf <strong className="text-cyan-400">Wiederherstellen</strong> bei einer Aufgabe, um sie wieder zu den aktiven Tagesaufgaben deines Statuswerts hinzuzufügen.
            </>
          )}
        </p>

        {/* Filters */}
        {deletedTasks.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'en' ? 'Search task...' : 'Aufgabe suchen...'}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            {statFilters.length > 1 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <button
                  onClick={() => setSelectedStatId('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap border transition-all ${
                    selectedStatId === 'all'
                      ? 'bg-rose-950 text-rose-300 border-rose-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {lang === 'en' ? 'All' : 'Alle'} ({deletedTasks.length})
                </button>
                {statFilters.map((st) => {
                  const count = deletedTasks.filter((t) => t.statId === st.id).length;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStatId(st.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap border transition-all flex items-center space-x-1 ${
                        selectedStatId === st.id
                          ? 'bg-rose-950 text-rose-300 border-rose-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{st.emoji}</span>
                      <span>{translateStatName(st.name, lang)}</span>
                      <span className="text-[9px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1 custom-scrollbar">
          {deletedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 p-6">
              <ShieldCheck className="w-10 h-10 text-emerald-500/60 mb-2" />
              <span className="text-sm font-bold text-slate-300">
                {lang === 'en' ? 'No deleted tasks found' : 'Keine gelöschten Aufgaben vorhanden'}
              </span>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {lang === 'en'
                  ? 'All preset and custom tasks are active in your daily task list.'
                  : 'Alle vorgespeicherten und eigenen Aufgaben sind aktiv in deinen Tagesaufgaben enthalten.'}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {lang === 'en'
                ? `No tasks found for filter "${searchTerm}".`
                : `Keine Aufgaben gefunden für den Filter "${searchTerm}".`}
            </div>
          ) : (
            filtered.map((tk) => {
              const tierInfo = tk.tier !== undefined ? getTierInfo(tk.tier, lang) : null;

              return (
                <div
                  key={tk.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 group-hover:border-rose-500/40 transition-colors">
                      {tk.statEmoji}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                          {translateStatName(tk.statName, lang)}
                        </span>
                        {tierInfo ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {tierInfo.label}
                          </span>
                        ) : tk.isCustom ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            {lang === 'en' ? 'Custom Task' : 'Eigene Aufgabe'}
                          </span>
                        ) : null}
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 mt-0.5">{tk.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{tk.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRestoreTask(tk)}
                    className="self-end sm:self-center shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold tracking-wide transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'en' ? 'Restore' : 'Wiederherstellen'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>
              {lang === 'en'
                ? '365 task database protected per attribute'
                : '365 Aufgaben-Datenbank pro Statuswert geschützt'}
            </span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all"
          >
            {lang === 'en' ? 'Close' : 'Schließen'}
          </button>
        </div>
      </div>
    </div>
  );
};
