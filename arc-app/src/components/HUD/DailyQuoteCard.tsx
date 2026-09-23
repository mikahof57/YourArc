import React from 'react';
import { Quote } from '../../types';
import { CalendarDays, Maximize2 } from 'lucide-react';
import { Language } from '../../utils/i18n';

interface DailyQuoteCardProps {
  quote: Quote;
  lang?: Language;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({
  quote,
  lang = 'en',
  isMinimized = false,
  onToggleMinimize,
}) => {
  const isEn = lang === 'en';
  const displayQuote = isEn && quote.textEn ? quote.textEn : quote.text;
  const displayAuthor = isEn && quote.authorEn ? quote.authorEn : quote.author;

  const date = new Intl.DateTimeFormat(isEn ? 'en-GB' : 'de-DE', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());

  if (isMinimized) {
    return (
      <div
        className="arc-panel w-full bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 backdrop-blur-md transition-all duration-300 flex items-center justify-between"
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
    <section className="arc-today-hero">
      <div className="arc-today-copy"><span>{isEn ? 'TODAY' : 'HEUTE'}</span><h2>{date}</h2><blockquote>“{displayQuote}”</blockquote><cite>— {displayAuthor}</cite></div>
      <div className="arc-today-art" aria-hidden="true"><i /><CalendarDays /></div>
      {onToggleMinimize && <button className="arc-today-collapse" onClick={onToggleMinimize} aria-label={isEn ? 'Minimize' : 'Minimieren'}>−</button>}
    </section>
  );
};
