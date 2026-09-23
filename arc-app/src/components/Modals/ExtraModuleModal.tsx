import React, { useState, useEffect, useRef } from 'react';
import { BottomBarModuleConfig } from '../../types';
import {
  EXTRA_MODULES_CONTENT,
  ModuleContentItem,
  getFreshModuleItems,
} from '../../data/extraModules';
import { getLocalizedModuleConfig, getLocalizedModuleItem } from '../../data/extraModulesTranslations';
import { X, RefreshCw, Sparkles, CheckCircle2, Coins, AlertCircle } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface ExtraModuleModalProps {
  moduleConfig: BottomBarModuleConfig;
  lang?: string;
  onClose: () => void;
  reloadsCountToday: number;
  seenModuleItemIds: Record<string, string[]>;
  currentCredits?: number;
  onPerformReload: (moduleId: string, newSeenIds: string[]) => boolean | Promise<boolean>;
  onOpenShop?: () => void;
}

export const ExtraModuleModal: React.FC<ExtraModuleModalProps> = ({
  moduleConfig,
  lang = 'en',
  onClose,
  reloadsCountToday = 0,
  seenModuleItemIds = {},
  currentCredits = 0,
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
  const reloadPendingRef = useRef(false);
  const dialogRef = useModalAccessibility<HTMLDivElement>(onClose);

  const localizedModule = getLocalizedModuleConfig(moduleConfig, lang);
  const displayTitle = localizedModule.title;
  const displayDesc = localizedModule.description;

  // Initialize fresh items on mount if empty or load existing
  useEffect(() => {
    const existingSeen = seenModuleItemIds[moduleConfig.id] || [];
    const catalog = EXTRA_MODULES_CONTENT[moduleConfig.id] || [];
    const persistedItems = existingSeen
      .slice(-3)
      .map((itemId) => catalog.find((item) => item.id === itemId))
      .filter((item): item is ModuleContentItem => item !== undefined);
    if (persistedItems.length === Math.min(3, catalog.length)) {
      setCurrentItems(persistedItems);
      setCurrentSeenIds(existingSeen);
      return;
    }
    const { items, updatedSeenIds } = getFreshModuleItems(moduleConfig.id, existingSeen, 3);
    setCurrentItems(items);
    setCurrentSeenIds(updatedSeenIds);
  }, [moduleConfig.id]);

  const handleReload = async () => {
    setCreditError(null);

    if (currentCredits < 1) {
      setCreditError(
        lang === 'en'
          ? 'Not enough credits! 1 Credit is required to reload.'
          : 'Nicht genügend Credits! 1 Credit wird für "Neu laden" benötigt.'
      );
      return;
    }

    if (reloadPendingRef.current) return;

    reloadPendingRef.current = true;
    setIsReloading(true);

    // Pick 3 new non-duplicate items
    const { items, updatedSeenIds } = getFreshModuleItems(moduleConfig.id, currentSeenIds, 3);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      // Execute reload (deducts 1 credit and updates seen IDs).
      const success = await onPerformReload(moduleConfig.id, updatedSeenIds);

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
    } catch {
      setCreditError(
        lang === 'en'
          ? 'Could not perform reload. Please check your credits.'
          : 'Konnte Neuladung nicht durchführen. Bitte überprüfe deine Credits.'
      );
    } finally {
      reloadPendingRef.current = false;
      setIsReloading(false);
    }
  };

  return (
    <div className="arc-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn font-mono">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={displayTitle} className="arc-modal arc-extra-module relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        <header className="arc-module-header">
          <div className="arc-module-identity">
            <div className="arc-module-icon" aria-hidden="true">{moduleConfig.icon}</div>
            <span className="arc-module-eyebrow">{lang === 'en' ? 'SYSTEM MODULE // CONTENT CATALOG' : 'SYSTEMMODUL // INHALTSKATALOG'}</span>
          </div>
          <button onClick={onClose} className="arc-module-close"
            aria-label={lang === 'en' ? 'Close extra module' : 'Zusatzmodul schließen'}>
            <X className="w-5 h-5" />
          </button>
          <h2 className="arc-module-title">{displayTitle}</h2>
          <div className="arc-module-actions">
            <button type="button" onClick={onOpenShop} disabled={!onOpenShop} className="arc-module-credits"
              title={lang === 'en' ? 'View balance / Open shop' : 'Guthaben anzeigen / Shop öffnen'}>
              <Coins className="w-4 h-4 shrink-0" /><span>{currentCredits} Credits</span>
            </button>
            <button type="button" onClick={handleReload} disabled={isReloading} className="arc-module-reload"
              title={lang === 'en' ? 'Load new suggestions (Costs 1 Credit)' : 'Neue Vorschläge laden (Kostet 1 Credit)'}>
              <RefreshCw className={`w-4 h-4 shrink-0 ${isReloading ? 'animate-spin' : ''}`} />
              <span>{lang === 'en' ? 'Reload (1 Cr)' : 'Neu laden (1 Cr)'}</span>
            </button>
          </div>
        </header>

        <div className="arc-module-body">
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
                className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] uppercase ml-2"
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
          className={`space-y-3 min-w-0 transition-opacity duration-300 ${
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
    </div>
  );
};
