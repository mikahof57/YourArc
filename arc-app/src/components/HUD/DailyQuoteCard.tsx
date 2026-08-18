import React from 'react';
import { Quote } from '../../types';
import { Quote as QuoteIcon, Flame, Minus, Maximize2 } from 'lucide-react';
import { Language, t } from '../../utils/i18n';

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

  const categoryMap: Record<string, { en: string; de: string }> = {
    filme: { en: 'Movies', de: 'Filme' },
    anime: { en: 'Anime', de: 'Anime' },
    spiele: { en: 'Games', de: 'Spiele' },
    philosophie: { en: 'Philosophy', de: 'Philosophie' },
    religion: { en: 'Religion', de: 'Religion' },
  };

  const subCategoryMap: Record<string, { en: string; de: string }> = {
    christentum: { en: 'Christianity', de: 'Christentum' },
    islam: { en: 'Islam', de: 'Islam' },
    judentum: { en: 'Judaism', de: 'Judentum' },
    buddhismus: { en: 'Buddhism', de: 'Buddhismus' },
    hinduismus: { en: 'Hinduism', de: 'Hinduismus' },
  };

  const categoryName = categoryMap[quote.category]?.[isEn ? 'en' : 'de'] || quote.category.toUpperCase();
  const subCategoryName = quote.subCategory
    ? subCategoryMap[quote.subCategory]?.[isEn ? 'en' : 'de'] || quote.subCategory
    : null;

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
      className="w-full bg-slate-900/90 border rounded-xl p-3.5 sm:p-5 backdrop-blur-md font-mono relative overflow-hidden transition-all duration-300"
      style={{
        borderColor: 'var(--theme-c1)',
        boxShadow: '0 0 25px var(--theme-glow1)',
      }}
    >
      {/* Subtle top edge glow */}
      <div
        className="absolute top-0 inset-x-0 h-[1px] opacity-80"
        style={{
          background: 'var(--theme-grad)',
        }}
      />

      <div className="flex items-start space-x-3">
        <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
          <QuoteIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
            <span className="text-[10px] text-cyan-400 tracking-widest uppercase flex items-center space-x-1 font-bold">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{t('dailyQuote', lang)} // {categoryName.toUpperCase()}</span>
              {subCategoryName && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400 uppercase hidden sm:inline-block ml-1">
                  {subCategoryName}
                </span>
              )}
            </span>

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

          {/* Expanded View */}
          <div className="space-y-1.5 pt-1">
            <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
              "{displayQuote}"
            </p>
            <div className="text-right text-xs text-cyan-400/80 font-bold tracking-wider">
              — {displayAuthor}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
