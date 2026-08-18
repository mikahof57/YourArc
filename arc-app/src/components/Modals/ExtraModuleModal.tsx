import React, { useState, useEffect } from 'react';
import { BottomBarModuleConfig } from '../../types';
import {
  EXTRA_MODULES_CONTENT,
  ModuleContentItem,
  getFreshModuleItems,
} from '../../data/extraModules';
import { getLocalizedModuleItem } from '../../data/extraModulesTranslations';
import { X, RefreshCw, Sparkles, CheckCircle2, Coins, AlertCircle } from 'lucide-react';

interface ExtraModuleModalProps {
  moduleConfig: BottomBarModuleConfig;
  lang?: string;
  onClose: () => void;
  reloadsCountToday: number;
  seenModuleItemIds: Record<string, string[]>;
  currentCredits?: number;
  onPerformReload: (moduleId: string, newSeenIds: string[]) => boolean;
  onOpenShop?: () => void;
}

export const ExtraModuleModal: React.FC<ExtraModuleModalProps> = ({
  moduleConfig,
  lang = 'en',
  onClose,
  reloadsCountToday = 0,
  seenModuleItemIds = {},
  currentCredits = 100,
  onPerformReload,
  onOpenShop,
}) => {
  const [currentItems, setCurrentItems] = useState<ModuleContentItem[]>([]);
  const [currentSeenIds, setCurrentSeenIds] = useState<string[]>(
    seenModuleItemIds[moduleConfig.id] || []
  );
  const [isReloading, setIsReloading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);

  // Localized Module Title & Description
  const moduleTitleMap: Record<string, { en: string; de: string }> = {
    motivation: { en: 'Motivational Quotes', de: 'Motivationssprüche' },
    business_ideas: { en: 'Business Ideas', de: 'Business-Ideen' },
    books: { en: 'Book Recommendations', de: 'Bücher Empfehlungen' },
    biohacking: { en: 'Biohacking Protocols', de: 'Biohacking Protocols' },
    stoic_rules: { en: 'Stoic Rules', de: 'Stoische Regeln' },
  };

  const moduleDescMap: Record<string, { en: string; de: string }> = {
    motivation: {
      en: 'Daily dose of unwavering discipline & mindset protocols.',
      de: 'Tägliche Dosis unerschütterliche Disziplin & Mindset-Protokolle.',
    },
    business_ideas: {
      en: 'Scalable business models, SaaS concepts & high-income skills.',
      de: 'Skalierbare Geschäftsmodelle, SaaS-Konzepte & High-Income-Skills.',
    },
    books: {
      en: 'The 150 most important works for entrepreneurship, mindset, finance & strength.',
      de: 'Die 150 wichtigsten Werke für Unternehmertum, Mindset, Finanzen & Stärke.',
    },
    biohacking: {
      en: 'Sleep optimization, light exposure, dopamine fasting & recovery.',
      de: 'Schlafoptimierung, Lichtexposition, Dopamin-Fasten & Erholung.',
    },
    stoic_rules: {
      en: 'Iron maxims for emotional control & resilience.',
      de: 'Eiserne Maximen zur emotionalen Kontrolle & Resilienz.',
    },
  };

  const displayTitle = moduleTitleMap[moduleConfig.id]?.[lang === 'en' ? 'en' : 'de'] || moduleConfig.title;
  const displayDesc = moduleDescMap[moduleConfig.id]?.[lang === 'en' ? 'en' : 'de'] || moduleConfig.description;

  // Initialize fresh items on mount if empty or load existing
  useEffect(() => {
    const existingSeen = seenModuleItemIds[moduleConfig.id] || [];
    const { items, updatedSeenIds } = getFreshModuleItems(moduleConfig.id, existingSeen, 3);
    setCurrentItems(items);
    setCurrentSeenIds(updatedSeenIds);
  }, [moduleConfig.id]);

  const handleReload = () => {
    setCreditError(null);

    if (currentCredits < 1) {
      setCreditError(
        lang === 'en'
          ? 'Not enough credits! 1 Credit is required to reload.'
          : 'Nicht genügend Credits! 1 Credit wird für "Neu laden" benötigt.'
      );
      return;
    }

    if (isReloading) return;

    setIsReloading(true);

    // Pick 3 new non-duplicate items
    const { items, updatedSeenIds } = getFreshModuleItems(moduleConfig.id, currentSeenIds, 3);

    setTimeout(() => {
      // Execute reload (deducts 1 credit and updates seen IDs)
      const success = onPerformReload(moduleConfig.id, updatedSeenIds);

      if (success) {
        setCurrentItems(items);
        setCurrentSeenIds(updatedSeenIds);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 2500);
      } else {
        setCreditError(
          lang === 'en'
            ? 'Could not perform reload. Please check your credits.'
            : 'Konnte Neuladung nicht durchführen. Bitte überprüfe deine Credits.'
        );
      }

      setIsReloading(false);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn font-mono">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[85vh] flex flex-col">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {/* Top Right Action Controls: Reload & Close */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <button
            onClick={handleReload}
            disabled={isReloading}
            title={lang === 'en' ? 'Load new suggestions (Costs 1 Credit)' : 'Neue Vorschläge laden (Kostet 1 Credit)'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm active:scale-95 border-amber-500/60 bg-amber-950/80 text-amber-300 hover:bg-amber-900 hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isReloading ? 'animate-spin text-amber-400' : 'text-amber-400'
              }`}
            />
            <span>{lang === 'en' ? 'Reload (1 Cr)' : 'Neu laden (1 Cr)'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
            title={lang === 'en' ? 'Close' : 'Schließen'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4 mb-4 pr-52">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-xl shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            {moduleConfig.icon}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
                SYSTEM MODULE // CONTENT CATALOG
              </span>
              <span
                onClick={onOpenShop}
                className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded cursor-pointer hover:border-amber-400 flex items-center space-x-1 font-bold"
                title={lang === 'en' ? 'View balance / Open shop' : 'Guthaben anzeigen / Shop öffnen'}
              >
                <Coins className="w-3 h-3 text-amber-400" />
                <span>{currentCredits} Credits</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 uppercase">{displayTitle}</h2>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-3">{displayDesc}</p>

        {/* Credit Error Toast */}
        {creditError && (
          <div className="mb-3 px-3 py-2 rounded bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{creditError}</span>
            </div>
            {onOpenShop && (
              <button
                onClick={onOpenShop}
                className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase ml-2"
              >
                {lang === 'en' ? 'To Shop' : 'Zum Shop'}
              </button>
            )}
          </div>
        )}

        {/* Success Toast Notification */}
        {showSuccessToast && (
          <div className="mb-3 px-3 py-1.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lang === 'en' ? 'New unique suggestions loaded! (-1 Credit)' : 'Neue einzigartige Vorschläge geladen! (-1 Credit)'}</span>
          </div>
        )}

        {/* Content Items List */}
        <div
          className={`space-y-3 overflow-y-auto pr-1 flex-1 transition-opacity duration-300 ${
            isReloading ? 'opacity-30' : 'opacity-100'
          }`}
        >
          {currentItems.map((rawItem) => {
            const item = getLocalizedModuleItem(rawItem, lang);
            return (
              <div
                key={item.id}
                className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                    <span className="text-[11px] text-cyan-400 block mt-0.5">{item.subtitle}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-900">
                  {item.content}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tg) => (
                    <span
                      key={tg}
                      className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase font-mono"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
