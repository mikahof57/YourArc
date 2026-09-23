import React from 'react';
import { Shield, Volume2, VolumeX, UserCheck } from 'lucide-react';
import { Language, t } from '../utils/i18n';

interface CyberHeaderProps {
  dateStr: string;
  soundEnabled: boolean;
  lang?: Language;
  onSetLanguage?: (lang: Language) => void;
  onToggleSound: () => void;
  onOpenCharacterCreation: () => void;
}

export const CyberHeader: React.FC<CyberHeaderProps> = ({
  dateStr,
  soundEnabled,
  lang = 'en',
  onSetLanguage,
  onToggleSound,
  onOpenCharacterCreation,
}) => {
  return (
    <header
      className="arc-topbar arc-v10-topbar w-full px-3 sm:px-4 flex items-center justify-between select-none"
      style={{
        borderBottomColor: 'var(--theme-glow1)',
      }}
    >
      <div className="arc-brand flex items-center space-x-2 sm:space-x-3">
        <div
          className="relative flex items-center justify-center w-8 h-8 rounded border shadow transition-all duration-500"
          style={{
            borderColor: 'var(--theme-c1)',
            backgroundColor: 'var(--theme-glow1)',
          }}
        >
          <Shield className="w-4 h-4" style={{ color: 'var(--theme-c1)' }} />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-widest text-slate-100 flex items-center space-x-1.5">
            <span>{t('appTitle', lang)}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded border font-bold transition-all duration-500"
              style={{
                color: 'var(--theme-c1)',
                backgroundColor: 'var(--theme-glow1)',
                borderColor: 'var(--theme-c1)',
              }}
            >
              SYSTEM
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 tracking-wider hidden sm:block">PROTOCOL // SELF-IMPROVEMENT</p>
        </div>
      </div>

      <div className="arc-header-utilities flex items-center">
        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 border border-slate-800 bg-slate-900/60 px-2.5 py-1 rounded">
          <span>{t('activeStatus', lang)}</span>
          <span className="text-slate-600">|</span>
          <span className="font-medium" style={{ color: 'var(--theme-c1)' }}>{dateStr}</span>
        </div>

        {/* Always-visible localized language control. */}
        {onSetLanguage && (
          <div role="group" aria-label={lang === 'de' ? 'Sprache' : 'Language'} className="arc-language-switch flex items-center space-x-1 bg-slate-900/90 p-0.5 sm:p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => onSetLanguage('de')}
              className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold flex items-center space-x-1 transition-all ${
                lang === 'de'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Deutsch"
              aria-label="Deutsch"
              aria-pressed={lang === 'de'}
            >
              <span>DE</span>
            </button>
            <button
              type="button"
              onClick={() => onSetLanguage('en')}
              className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold flex items-center space-x-1 transition-all ${
                lang === 'en'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
              aria-label="English"
              aria-pressed={lang === 'en'}
            >
              <span>EN</span>
            </button>
          </div>
        )}

        {/* Re-enter Character Creation */}
        <button
          onClick={onOpenCharacterCreation}
          title={t('newCharacter', lang)}
          className="arc-header-character flex items-center space-x-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-200 border px-2 sm:px-2.5 py-1 rounded transition-all active:scale-95 shrink-0"
          style={{ borderColor: 'var(--theme-glow1)' }}
        >
          <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--theme-c1)' }} />
          <span className="hidden md:inline">{t('newCharacter', lang)}</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? t('soundOn', lang) : t('soundOff', lang)}
          className="arc-header-sound p-1.5 rounded border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shrink-0"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </div>
    </header>
  );
};
