import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ClipboardCheck, Coins, Home, Boxes, Menu, ShoppingBag, Quote, TrendingUp, Target } from 'lucide-react';
import { DEFAULT_STATS } from '../../data/defaultStats';
import { AVAILABLE_SKINS } from '../../data/skinData';
import { Language, t, translateStatName } from '../../utils/i18n';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

export const INTRODUCTION_STEPS = ['Stats', 'Tasks', 'Quote', 'Missions', 'Shop', 'Ready'] as const;
const TITLE_KEYS = ['introStatsTitle', 'introTasksTitle', 'introQuoteTitle', 'introMissionsTitle', 'introShopTitle', 'introReadyTitle'] as const;
const BODY_KEYS = ['introStatsBody', 'introTasksBody', 'introQuoteBody', 'introMissionsBody', 'introShopBody', 'introReadyBody'] as const;

/** Illustrative UI only: no task, purchase, reward or navigation handlers. */
export function IntroductionVisual({ step, lang }: { step: number; lang: Language }) {
  if (step === 0) return <div className="arc-intro-stats">{DEFAULT_STATS.map(stat => <div key={stat.id} className="arc-intro-stat"><span aria-hidden="true">{stat.emoji}</span><strong>{translateStatName(stat.name, lang)}</strong><i aria-hidden="true" /></div>)}</div>;
  if (step === 1) return <div className="arc-intro-loop">{[
    [ClipboardCheck, 'introTask'], [Check, 'introDone'], [TrendingUp, 'introGrowth'], [Target, 'introProgress'],
  ].map(([Icon, key], index) => { const Symbol = Icon as typeof Check; return <div key={index}><Symbol aria-hidden="true" /><strong>{t(key as 'introTask', lang)}</strong>{index < 3 && <ArrowRight className="arc-intro-arrow" aria-hidden="true" />}</div>; })}</div>;
  if (step === 2) return <div className="arc-intro-quote"><Quote aria-hidden="true" /><blockquote>{t('introQuote', lang)}</blockquote><small>{t('introSources', lang)}</small></div>;
  if (step === 3) return <div className="arc-intro-mission"><ClipboardCheck aria-hidden="true" /><strong>{t('introMission', lang)}</strong><div className="arc-intro-track" aria-hidden="true"><i /></div><span>{t('introMissionProgress', lang)}</span></div>;
  if (step === 4) return <div className="arc-intro-shop"><img src={AVAILABLE_SKINS[0].avatarUrl} alt="" /><div><Coins aria-hidden="true" /><strong>100 <small>{t('credits', lang)}</small></strong><span>{t('introStartingCredits', lang)}</span><small>{t('introSkin', lang)}</small></div></div>;
  return <div className="arc-intro-navigation">{[
    [Home, 'introHome'], [ClipboardCheck, 'introMissions'], [Boxes, 'introHub'], [ShoppingBag, 'introShop'], [Menu, 'introMenu'],
  ].map(([Icon, key], index) => { const Symbol = Icon as typeof Home; return <div key={index}><Symbol aria-hidden="true" /><strong>{t(key as 'introHome', lang)}</strong>{index === 2 && <small>{t('introSoon', lang)}</small>}</div>; })}</div>;
}

export function AppIntroduction({ lang, onDismiss }: { lang: Language; onDismiss: () => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const pending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const dismiss = useCallback(async () => {
    if (pending.current) return;
    pending.current = true; setSaving(true); setError(false);
    try { await onDismiss(); } catch { setError(true); }
    finally { pending.current = false; setSaving(false); }
  }, [onDismiss]);
  const close = useCallback(() => { void dismiss(); }, [dismiss]);
  const dialogRef = useModalAccessibility<HTMLDivElement>(close);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  return <div className="arc-modal-overlay arc-intro-overlay fixed inset-0 flex items-center justify-center">
    <div ref={dialogRef} tabIndex={-1} className="arc-modal arc-introduction" role="dialog" aria-modal="true" aria-labelledby="arc-intro-title" aria-describedby="arc-intro-body">
      <header className="arc-intro-header"><span>{t('introLabel', lang)}</span><span aria-live="polite">{step + 1} / {INTRODUCTION_STEPS.length}</span></header>
      <div className="arc-intro-content" key={step}>
        <div className="arc-intro-visual"><IntroductionVisual step={step} lang={lang} /></div>
        <h2 id="arc-intro-title" ref={heading} tabIndex={-1}>{t(TITLE_KEYS[step], lang)}</h2>
        <p id="arc-intro-body">{t(BODY_KEYS[step], lang)}</p>
      </div>
      <div className="arc-intro-dots" aria-hidden="true">{INTRODUCTION_STEPS.map((id, index) => <i key={id} className={index === step ? 'is-active' : ''} />)}</div>
      {error && <p className="arc-intro-error" role="alert">{t('introError', lang)}</p>}
      <footer className="arc-intro-actions">
        <button disabled={saving} onClick={() => void dismiss()}>{t('introSkip', lang)}</button>
        {step > 0 && <button disabled={saving} onClick={() => setStep(step - 1)}>{t('introBack', lang)}</button>}
        <button className="arc-intro-primary" disabled={saving} onClick={() => step === 5 ? void dismiss() : setStep(step + 1)}>
          {saving ? t('introSaving', lang) : t(step === 5 ? 'introFinish' : 'introNext', lang)}<ArrowRight aria-hidden="true" />
        </button>
      </footer>
    </div>
  </div>;
}
