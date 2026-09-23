import React, { useState } from 'react';
import { UserProfile, StatAttribute } from '../../types';
import { ONBOARDING_CHARACTERS, type OnboardingGender } from '../../data/onboardingCharacters';
import { DEFAULT_STATS } from '../../data/defaultStats';
import { getTierIndex, getTierInfo, get365PresetTasksForStat } from '../../data/taskDatabase';
import { Shield, ChevronRight, Check, Sparkles, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Language, translateStatName } from '../../utils/i18n';

interface CharacterCreationProps {
  initialProfile: UserProfile;
  initialStats: StatAttribute[];
  onComplete: (profile: UserProfile, selectedStats: StatAttribute[]) => Promise<void> | void;
  lang: Language;
}

const COPY = {
  de: {
    steps: ['01 CHARAKTER', '02 IDENTITÄT', '03 ATTRIBUTE'], heading: 'Charakter-Erstellung', sections: ['Charakter', 'Basis-Daten', 'Statuswerte'],
    identityTitle: '2. Identität & Physis', identityHelp: 'Gib deine physischen Parameter an (optional – kann übersprungen werden).',
    name: 'Codename / Name', namePlaceholder: 'z. B. Alex / Monarch', gender: 'Geschlecht',
    age: 'Alter (Jahre)', agePlaceholder: 'z. B. 25', weight: 'Gewicht (kg)', weightPlaceholder: 'z. B. 80', height: 'Größe (cm)', heightPlaceholder: 'z. B. 182',
    skip: 'Überspringen & weiter →', nextIdentity: 'Weiter zur Identität', avatarTitle: '1. Charakter wählen', avatarHelp: 'Wähle deinen ARC-Charakter.',
    back: '← Zurück', nextStats: 'Weiter zu den Statuswerten', statsTitle: '3. Statuswerte wählen', statsHelp: 'Wähle die Statuswerte, die du täglich auf 100 % steigern möchtest.',
    dailyTask: 'Tägliche Aufgabe', start: 'Start-Prozentwert:', until: 'bis', progressionHelp: 'Jeder Wert startet mit deinen gewählten Start-Prozentpunkten. Deine täglichen Aufgaben steigern diese Werte lokal auf diesem Gerät.',
    initializing: 'INITIALISIERUNG…', finish: 'SYSTEM INITIALISIEREN', error: 'Die Charakter-Initialisierung ist fehlgeschlagen.', statToggle: 'Statuswert auswählen',
  },
  en: {
    steps: ['01 CHARACTER', '02 IDENTITY', '03 ATTRIBUTES'], heading: 'Character Creation', sections: ['Character', 'Basic Data', 'Attributes'],
    identityTitle: '2. Identity & Physique', identityHelp: 'Enter your physical parameters (optional – you can skip this step).',
    name: 'Codename / Name', namePlaceholder: 'e.g. Alex / Monarch', gender: 'Gender',
    age: 'Age (years)', agePlaceholder: 'e.g. 25', weight: 'Weight (kg)', weightPlaceholder: 'e.g. 80', height: 'Height (cm)', heightPlaceholder: 'e.g. 182',
    skip: 'Skip & continue →', nextIdentity: 'Continue to identity', avatarTitle: '1. Choose Character', avatarHelp: 'Choose your ARC character.',
    back: '← Back', nextStats: 'Continue to attributes', statsTitle: '3. Choose Attributes', statsHelp: 'Choose the attributes you want to increase toward 100% through daily tasks.',
    dailyTask: 'Daily task', start: 'Starting percentage:', until: 'up to', progressionHelp: 'Each attribute starts at your selected percentage. Your daily tasks increase these values locally on this device.',
    initializing: 'INITIALIZING…', finish: 'INITIALIZE SYSTEM', error: 'Character initialization failed.', statToggle: 'Select attribute',
  },
} as const;

export const CharacterCreation: React.FC<CharacterCreationProps> = ({
  initialProfile,
  initialStats,
  onComplete,
  lang,
}) => {
  const copy = COPY[lang];
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // One gender selection drives the onboarding portrait and saved identity.
  const [name, setName] = useState<string>(initialProfile.name || '');
  const [gender, setGender] = useState<OnboardingGender>(initialProfile.gender === 'f' ? 'f' : 'm');
  const [age, setAge] = useState<string>(initialProfile.age ? String(initialProfile.age) : '');
  const [weight, setWeight] = useState<string>(initialProfile.weight ? String(initialProfile.weight) : '');
  const [height, setHeight] = useState<string>(initialProfile.height ? String(initialProfile.height) : '');

  // Step 3 State - Stats selection
  const [selectedStatIds, setSelectedStatIds] = useState<string[]>(
    initialStats.length > 0 ? initialStats.map((s) => s.id) : DEFAULT_STATS.map((s) => s.id)
  );
  const [statStartValues, setStatStartValues] = useState<Record<string, number>>(() => {
    const initMap: Record<string, number> = {};
    DEFAULT_STATS.forEach((s) => {
      const existing = initialStats.find((i) => i.id === s.id);
      initMap[s.id] = existing?.startValue ?? existing?.value ?? 0;
    });
    return initMap;
  });

  const handleToggleStat = (id: string) => {
    if (selectedStatIds.includes(id)) {
      if (selectedStatIds.length <= 1) return; // Keep at least 1 stat
      setSelectedStatIds(selectedStatIds.filter((sId) => sId !== id));
    } else {
      setSelectedStatIds([...selectedStatIds, id]);
    }
  };

  const handleFinish = async () => {
    const finalProfile: UserProfile = {
      name: name.trim() || 'Operator',
      gender,
      age: age ? parseInt(age, 10) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      avatarUrl: ONBOARDING_CHARACTERS.find((character) => character.gender === gender)!.url,
      isCreated: true,
      createdAt: initialProfile.createdAt || new Date().toISOString().split('T')[0],
      characterCode: initialProfile.characterCode,
    };

    const finalStats = DEFAULT_STATS.filter((s) => selectedStatIds.includes(s.id)).map((s) => {
      const chosenStartVal = statStartValues[s.id] ?? 0;
      return {
        ...s,
        startValue: chosenStartVal,
        value: chosenStartVal,
      };
    });

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onComplete(finalProfile, finalStats);
    } catch (error) {
      console.error('ARC character initialization failed:', error);
      setSubmitError(copy.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="arc-onboarding arc-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-xl overflow-y-auto font-mono text-slate-200">
      <div className="arc-modal relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-xl p-5 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] my-auto" role="dialog" aria-modal="true" aria-labelledby="arc-character-creation-title">
        {/* Futuristic Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {/* Progress Header */}
        <div className="mb-6">
          <div className="arc-activation-steps" aria-hidden="true">
            {copy.steps.map((label, index) => <span key={label} className={step === index + 1 ? 'is-active' : step > index + 1 ? 'is-complete' : ''}>{label}</span>)}
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-between text-xs text-cyan-400 uppercase tracking-widest mb-2">
            <span className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span id="arc-character-creation-title">{copy.heading} // {lang === 'en' ? 'Step' : 'Schritt'} {step} {lang === 'en' ? 'of' : 'von'} 3</span>
            </span>
            <span>{copy.sections[step - 1]}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {submitError && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-start space-x-2" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* STEP 2: Personal Data */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center sm:text-left border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">{copy.identityTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {copy.identityHelp}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{copy.name}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.namePlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{copy.age}</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={copy.agePlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{copy.weight}</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={copy.weightPlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">{copy.height}</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={copy.heightPlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-slate-200">{copy.back}</button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                {copy.skip}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                <span>{copy.nextStats}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Onboarding identity; deliberately separate from Shop cosmetics. */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">{copy.avatarTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">{copy.avatarHelp}</p>
            </div>
            <fieldset className="min-w-0">
              <legend className="sr-only">{copy.gender}</legend>
              <div className="grid grid-cols-2 gap-3">
                {ONBOARDING_CHARACTERS.map((character) => {
                  const isSelected = gender === character.gender;
                  const label = character.labels[lang];
                  return (
                    <label key={character.gender} className="relative min-w-0 cursor-pointer">
                      <input type="radio" name="onboarding-gender" value={character.gender}
                        checked={isSelected} onChange={() => setGender(character.gender)}
                        className="peer sr-only" />
                      <span className={`block overflow-hidden rounded-lg border transition-all peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-cyan-300 ${isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                        : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}>
                        <img src={character.url} alt="" width="240" height="280" className="w-full aspect-[6/7] object-contain" />
                        <span className="block p-3 text-center text-sm font-bold text-slate-100">{label}</span>
                        {isSelected && <span aria-hidden="true" className="absolute top-2 right-2 rounded-full bg-cyan-400 p-1 text-slate-950"><Check className="h-4 w-4" /></span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <button type="button" onClick={() => setStep(2)}
              className="flex w-full items-center justify-center gap-2 rounded bg-cyan-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-cyan-400">
              {copy.nextIdentity}<ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        )}

        {/* STEP 3: Status Attributes Selection */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">{copy.statsTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {copy.statsHelp}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {DEFAULT_STATS.map((st) => {
                const isSelected = selectedStatIds.includes(st.id);
                const startVal = statStartValues[st.id] ?? 0;
                return (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-lg border transition-all space-y-2 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleStat(st.id)}
                      className="cursor-pointer flex items-center justify-between w-full text-left"
                      aria-label={`${copy.statToggle}: ${translateStatName(st.name, lang)}`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{st.emoji}</span>
                        <div>
                          <div className="text-sm font-bold text-slate-100">{translateStatName(st.name, lang)}</div>
                          <div className="text-[11px] text-slate-400">
                            {get365PresetTasksForStat(st.id, st.name, lang)[0]?.title || copy.dailyTask}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>

                    {/* Starting Percentage Setting */}
                    {isSelected && (() => {
                      const tierIdx = getTierIndex(startVal);
                      const tierInfo = getTierInfo(tierIdx, lang);
                      return (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 text-[11px]">
                              {copy.start}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                              {tierInfo.label} ({copy.until} {tierInfo.maxPercent}%)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min={0}
                              max={99}
                              step={1}
                              value={startVal}
                              onChange={(e) =>
                                setStatStartValues((prev) => ({
                                  ...prev,
                                  [st.id]: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              className="w-24 accent-cyan-400 cursor-pointer"
                            />
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={startVal}
                              onChange={(e) =>
                                setStatStartValues((prev) => ({
                                  ...prev,
                                  [st.id]: Math.min(99, Math.max(0, parseInt(e.target.value, 10) || 0)),
                                }))
                              }
                              className="w-14 bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold text-center rounded py-0.5 outline-none"
                            />
                            <span className="text-cyan-400 font-bold">%</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-950/80 p-3 rounded border border-cyan-500/20 text-xs text-slate-300 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                {copy.progressionHelp}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                {copy.back}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold px-6 py-3 rounded text-xs uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? copy.initializing : copy.finish}</span>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
