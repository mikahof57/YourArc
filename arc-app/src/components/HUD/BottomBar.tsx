import React from 'react';
import { BottomBarModuleConfig } from '../../types';
import { Settings, BarChart3, MessageSquare, Flame, Lightbulb, BookOpen, Zap, Landmark, ShoppingCart } from 'lucide-react';
import { Language, t } from '../../utils/i18n';

interface BottomBarProps {
  activeModules: BottomBarModuleConfig[];
  lang?: Language;
  onOpenShop?: () => void;
  onOpenSettings: () => void;
  onOpenGraph: () => void;
  onToggleChat: () => void;
  isChatOpen?: boolean;
  onOpenModuleContent: (module: BottomBarModuleConfig) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  activeModules,
  lang = 'en',
  onOpenShop,
  onOpenSettings,
  onOpenGraph,
  onToggleChat,
  isChatOpen = false,
  onOpenModuleContent,
}) => {
  const getModuleIcon = (iconStr: string) => {
    switch (iconStr) {
      case '🔥':
        return <Flame className="w-5 h-5 text-amber-400 shrink-0" />;
      case '💡':
        return <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0" />;
      case '📖':
        return <BookOpen className="w-5 h-5 text-cyan-400 shrink-0" />;
      case '⚡':
        return <Zap className="w-5 h-5 text-emerald-400 shrink-0" />;
      case '🏛️':
        return <Landmark className="w-5 h-5 text-purple-400 shrink-0" />;
      default:
        return <span className="text-base shrink-0">{iconStr}</span>;
    }
  };

  return (
    <div
      className="w-full bg-slate-950/95 border-t backdrop-blur-md px-3 sm:px-6 py-2.5 font-mono flex items-center justify-between sticky bottom-0 z-30 shadow-[0_-4px_25px_rgba(0,0,0,0.8)] transition-all duration-500"
      style={{
        borderTopColor: 'var(--theme-glow1)',
      }}
    >
      {/* Bottom Left - Shop Icon Button & Settings Icon Button */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {onOpenShop && (
          <button
            onClick={onOpenShop}
            title={t('shop', lang)}
            className="flex items-center justify-center bg-gradient-to-r from-amber-950 to-yellow-950 hover:from-amber-900 hover:to-yellow-900 text-amber-300 border border-amber-500/50 hover:border-amber-400 p-2 sm:px-3 sm:py-2 rounded-lg transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-95 shrink-0"
          >
            <ShoppingCart className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold hidden md:inline ml-2 uppercase tracking-wider">{t('shop', lang)}</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          title={t('settings', lang)}
          className="flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-cyan-500/40 p-2 sm:px-3 sm:py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(0,240,255,0.1)] active:scale-95 shrink-0"
        >
          <Settings className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <span className="text-xs font-bold hidden md:inline ml-2">{t('settings', lang)}</span>
        </button>
      </div>

      {/* Middle - Fixed Non-Scrolling Module Icon Buttons */}
      <div className="flex items-center justify-center space-x-1.5 sm:space-x-3">
        {activeModules.map((mod) => {
          const moduleTitles: Record<string, { en: string; de: string }> = {
            motivation: { en: 'Motivational Quotes', de: 'Motivationssprüche' },
            business_ideas: { en: 'Business Ideas', de: 'Business-Ideen' },
            books: { en: 'Book Recommendations', de: 'Bücher Empfehlungen' },
            biohacking: { en: 'Biohacking Protocols', de: 'Biohacking Protocols' },
            stoic_rules: { en: 'Stoic Rules', de: 'Stoische Regeln' },
          };
          const displayTitle = moduleTitles[mod.id]?.[lang === 'en' ? 'en' : 'de'] || mod.title;

          return (
            <button
              key={mod.id}
              onClick={() => onOpenModuleContent(mod)}
              title={displayTitle}
              className="flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-cyan-500/40 p-2.5 sm:p-3 rounded-lg transition-all hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95 shrink-0"
            >
              {getModuleIcon(mod.icon)}
            </button>
          );
        })}
      </div>

      {/* Bottom Right - Progress Graph & Chat Icon Buttons */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        <button
          onClick={onOpenGraph}
          title={t('stats', lang)}
          className="flex items-center justify-center bg-gradient-to-r from-cyan-950 to-slate-900 hover:from-cyan-900 hover:to-slate-800 text-cyan-300 border border-cyan-500/40 p-2 sm:px-3 sm:py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] active:scale-95 shrink-0"
        >
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-bold hidden md:inline ml-2">{t('stats', lang)}</span>
        </button>

        <button
          onClick={onToggleChat}
          title={t('chat', lang)}
          className={`flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-lg transition-all active:scale-95 shrink-0 border ${
            isChatOpen
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.6)]'
              : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {!isChatOpen && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 absolute -top-1 -right-1" />
            )}
          </div>
          <span className="text-xs font-bold hidden md:inline ml-2">{t('chat', lang)}</span>
        </button>
      </div>
    </div>
  );
};
