import React, { useState } from 'react';
import { DayHistoryRecord, StatAttribute } from '../../types';
import { X, TrendingUp, Calendar } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Language, translateStatName } from '../../utils/i18n';

interface StatsGraphModalProps {
  history: DayHistoryRecord[];
  stats: StatAttribute[];
  lang?: Language;
  onClose: () => void;
}

const COLOR_PALETTE = ['#00f0ff', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export const StatsGraphModal: React.FC<StatsGraphModalProps> = ({ history, stats, lang = 'en', onClose }) => {
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90' | 'all'>('30');

  // Filter history based on timeframe
  const getFilteredHistory = () => {
    if (!history || history.length === 0) return [];
    const copy = [...history];
    if (timeframe === '7') return copy.slice(-7);
    if (timeframe === '30') return copy.slice(-30);
    if (timeframe === '90') return copy.slice(-90);
    return copy;
  };

  const chartData = getFilteredHistory().map((item) => {
    const formattedDate = item.date.slice(5); // MM-DD
    const entry: Record<string, any> = { date: formattedDate };
    stats.forEach((st) => {
      const translatedName = translateStatName(st.name, lang);
      entry[translatedName] = item.stats[st.id] ?? 1;
    });
    return entry;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn font-mono">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[90vh] flex flex-col">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4 pr-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
                <span>{lang === 'en' ? 'ATTRIBUTE PROGRESSION' : 'STATUS ENTWICKLUNG'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {lang === 'en' ? 'ANALYSIS' : 'ANALYSIS'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? 'Progress trend of your attributes over time' : 'Fortschrittsverlauf deiner Attribute im Zeitverlauf'}
              </p>
            </div>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 px-2 flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:inline">{lang === 'en' ? 'PERIOD:' : 'ZEITRAUM:'}</span>
            </span>
            {(['7', '30', '90', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  timeframe === tf
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.2)] font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === 'all' ? (lang === 'en' ? 'All' : 'Alle') : `${tf}${lang === 'en' ? 'D' : 'T'}`}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Chart Container */}
        <div className="w-full h-80 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 my-2 relative">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              {lang === 'en' ? 'No data available in the selected timeframe.' : 'Noch keine Daten im ausgewählten Zeitraum.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#06b6d4',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 0 15px rgba(0,240,255,0.2)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {stats.map((st, idx) => {
                  const name = translateStatName(st.name, lang);
                  return (
                    <Line
                      key={st.id}
                      type="monotone"
                      dataKey={name}
                      stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Current Stat Averages Summary */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {stats.map((st, idx) => (
            <div key={st.id} className="bg-slate-950/90 p-2 rounded border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
                <span>{st.emoji}</span>
                <span className="truncate">{translateStatName(st.name, lang)}</span>
              </div>
              <div
                className="text-sm font-bold mt-0.5"
                style={{ color: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
              >
                {st.value}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
