import React, { useState } from 'react';
import { UserProfile, StatAttribute, Gender } from '../../types';
import { AVATAR_PRESETS, AvatarOption } from '../../data/avatars';
import { DEFAULT_STATS } from '../../data/defaultStats';
import { generateCharacterCode } from '../../data/communityData';
import { getTierIndex, getTierInfo } from '../../data/taskDatabase';
import { Shield, ChevronRight, Check, User, Sparkles, ArrowRight, X } from 'lucide-react';

interface CharacterCreationProps {
  initialProfile: UserProfile;
  initialStats: StatAttribute[];
  onComplete: (profile: UserProfile, selectedStats: StatAttribute[]) => void;
  onClose?: () => void;
  isModalMode?: boolean;
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({
  initialProfile,
  initialStats,
  onComplete,
  onClose,
  isModalMode = false,
}) => {
  const [step, setStep] = useState<number>(1);

  // Step 1 State - Personal Info
  const [name, setName] = useState<string>(initialProfile.name || '');
  const [gender, setGender] = useState<Gender>(initialProfile.gender || 'm');
  const [age, setAge] = useState<string>(initialProfile.age ? String(initialProfile.age) : '');
  const [weight, setWeight] = useState<string>(initialProfile.weight ? String(initialProfile.weight) : '');
  const [height, setHeight] = useState<string>(initialProfile.height ? String(initialProfile.height) : '');

  // Step 2 State - Avatar Selection
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'m' | 'f'>(initialProfile.gender === 'f' ? 'f' : 'm');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'anime' | 'superheroes' | 'comic'>('all');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(initialProfile.avatarUrl || AVATAR_PRESETS[0].url);

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

  const filteredAvatars = AVATAR_PRESETS.filter((a) => {
    const matchesGender = a.gender === selectedGenderFilter;
    const matchesCategory = selectedCategoryFilter === 'all' || a.category === selectedCategoryFilter;
    return matchesGender && matchesCategory;
  });

  const handleToggleStat = (id: string) => {
    if (selectedStatIds.includes(id)) {
      if (selectedStatIds.length <= 1) return; // Keep at least 1 stat
      setSelectedStatIds(selectedStatIds.filter((sId) => sId !== id));
    } else {
      setSelectedStatIds([...selectedStatIds, id]);
    }
  };

  const handleFinish = () => {
    const finalProfile: UserProfile = {
      name: name.trim() || 'Operator',
      gender,
      age: age ? parseInt(age, 10) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      avatarUrl: selectedAvatarUrl,
      isCreated: true,
      createdAt: isModalMode ? new Date().toISOString().split('T')[0] : (initialProfile.createdAt || new Date().toISOString().split('T')[0]),
      characterCode: isModalMode ? generateCharacterCode() : (initialProfile.characterCode || generateCharacterCode()),
    };

    const finalStats = DEFAULT_STATS.filter((s) => selectedStatIds.includes(s.id)).map((s) => {
      const chosenStartVal = statStartValues[s.id] ?? 0;
      if (isModalMode) {
        return {
          ...s,
          startValue: chosenStartVal,
          value: chosenStartVal,
        };
      }
      const existing = initialStats.find((i) => i.id === s.id);
      if (existing) {
        return {
          ...existing,
          startValue: chosenStartVal,
          value: Math.max(existing.value, chosenStartVal),
        };
      }
      return {
        ...s,
        startValue: chosenStartVal,
        value: chosenStartVal,
      };
    });

    onComplete(finalProfile, finalStats);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-xl overflow-y-auto font-mono text-slate-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-xl p-5 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] my-auto">
        {/* Futuristic Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {isModalMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-cyan-400 uppercase tracking-widest mb-2">
            <span className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Charakter-Erstellung // Schritt {step} von 3</span>
            </span>
            <span>{step === 1 ? 'Basis-Daten' : step === 2 ? 'Profilbild' : 'Statuswerte'}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Personal Data */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center sm:text-left border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">1. Identität & Physis</h2>
              <p className="text-xs text-slate-400 mt-1">
                Gib deine physischen Parameter an (Optional – kann auch übersprungen werden).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Codename / Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Alex / Monarch"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Geschlecht</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('m');
                      setSelectedGenderFilter('m');
                    }}
                    className={`flex-1 py-2 px-3 rounded text-xs font-medium border transition-all ${
                      gender === 'm'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    ♂ Männlich
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGender('f');
                      setSelectedGenderFilter('f');
                    }}
                    className={`flex-1 py-2 px-3 rounded text-xs font-medium border transition-all ${
                      gender === 'f'
                        ? 'bg-pink-950/80 border-pink-400 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    ♀ Weiblich
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('d')}
                    className={`py-2 px-3 rounded text-xs font-medium border transition-all ${
                      gender === 'd'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    ⚥ Divers
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Alter (Jahre)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="z.B. 25"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="z.B. 80"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Größe (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="z.B. 182"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Überspringen & Weiter →
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                <span>Weiter zum Profilbild</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Avatar Selection */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">2. Profilbild Wählen</h2>
              <p className="text-xs text-slate-400 mt-1">
                Wähle einen Badass-Avatar aus verschiedenen Kategorien.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-2.5 rounded border border-slate-800">
              {/* Gender filter */}
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedGenderFilter('m')}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    selectedGenderFilter === 'm'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ♂ Männlich
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGenderFilter('f')}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    selectedGenderFilter === 'f'
                      ? 'bg-pink-950 text-pink-300 border border-pink-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ♀ Weiblich
                </button>
              </div>

              {/* Category filter */}
              <div className="flex items-center space-x-1">
                {(['all', 'anime', 'superheroes', 'comic'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] capitalize transition-all ${
                      selectedCategoryFilter === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Alle' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
              {filteredAvatars.map((av) => {
                const isSelected = selectedAvatarUrl === av.url;
                return (
                  <div
                    key={av.id}
                    onClick={() => {
                      setSelectedAvatarUrl(av.url);
                    }}
                    className={`group relative cursor-pointer rounded-lg overflow-hidden border transition-all ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-1 text-[10px] text-center text-slate-300 truncate">
                      {av.name}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-cyan-500 text-slate-950 p-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ← Zurück
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                <span>Weiter zu den Statuswerten</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Status Attributes Selection */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">3. Statuswerte Wählen</h2>
              <p className="text-xs text-slate-400 mt-1">
                Wähle die Status-Attribute, die du täglich auf 100% steigern möchtest.
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
                    <div
                      onClick={() => handleToggleStat(st.id)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{st.emoji}</span>
                        <div>
                          <div className="text-sm font-bold text-slate-100">{st.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {st.tasks[0]?.title || 'Tägliche Aufgabe'}
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
                    </div>

                    {/* Starting Percentage Setting */}
                    {isSelected && (() => {
                      const tierIdx = getTierIndex(startVal);
                      const tierInfo = getTierInfo(tierIdx, 'de');
                      return (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 text-[11px]">
                              Start-Prozentwert bei Beginn:
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                              {tierInfo.label} (bis {tierInfo.maxPercent}%)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min={0}
                              max={90}
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
                Jeder Wert startet mit deinen gewählten <strong className="text-cyan-300">Start-Prozentpunkten</strong>.
                Im Community-Bereich werden nur deine <strong className="text-emerald-400">erarbeiteten Zusatz-Prozentpunkte</strong> verglichen!
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ← Zurück
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold px-6 py-3 rounded text-xs uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-95"
              >
                <span>SYSTEM INITIALISIEREN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
