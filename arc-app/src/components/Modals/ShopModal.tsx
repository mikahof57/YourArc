import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Coins,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  RotateCw,
  Gift,
  Palette,
  Check,
  AlertTriangle,
  Tag,
  Eye,
  Filter,
  Film,
  Zap,
} from 'lucide-react';
import { AVAILABLE_SKINS, CyberSkin, translateSkinName, translateSkinDesc } from '../../data/skinData';
import {
  INTERFACE_COLOR_PALETTE,
  InterfaceColorOption,
  UI_ANIMATION_OPTIONS,
  UIAnimationOption,
} from '../../data/shopData';
import { getTodayDateString } from '../../utils/storage';

interface ShopModalProps {
  lang?: string;
  currentCredits: number;
  ownedSkinIds: string[];
  equippedSkinId?: string;
  lastWheelSpinDate?: string;
  hasUnlockedDesignCustomizer?: boolean;
  unlockedDesignColors?: string[];
  selectedDesignColors?: string[];
  purchasedAnimationIds?: string[];
  equippedAnimationId?: string;
  onAddCredits: (amount: number) => void | Promise<void>;
  onBuySkin: (skin: CyberSkin) => boolean | Promise<boolean>;
  onEquipSkin?: (skin: CyberSkin) => void;
  onUnlockDesignCustomizer?: () => boolean | Promise<boolean>;
  onBuyColor?: (color: InterfaceColorOption) => boolean | Promise<boolean>;
  onToggleDesignColor?: (colorHex: string) => void;
  onBuyAnimation?: (anim: UIAnimationOption) => boolean | Promise<boolean>;
  onEquipAnimation?: (animId: string) => void;
  onClaimDailyWheel: () => Promise<{ reward: number; balance: number }>;
  onClose: () => void;
  initialTab?: 'wheel' | 'exchange' | 'marketplace' | 'design' | 'animations';
}

interface CreditPackage {
  id: string;
  credits: number;
  price: string;
  priceValue: number;
  title: string;
  popular?: boolean;
  bestValue?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'pack_100',
    credits: 100,
    price: '1,99 €',
    priceValue: 1.99,
    title: 'Starter Pack',
  },
  {
    id: 'pack_500',
    credits: 500,
    price: '6,99 €',
    priceValue: 6.99,
    title: 'Cyber Pro Pack',
    popular: true,
  },
  {
    id: 'pack_1500',
    credits: 1500,
    price: '14,99 €',
    priceValue: 14.99,
    title: 'Overlord Vault',
    bestValue: true,
  },
];

export const ShopModal: React.FC<ShopModalProps> = ({
  lang = 'en',
  currentCredits,
  ownedSkinIds = [],
  equippedSkinId = '',
  lastWheelSpinDate = '',
  hasUnlockedDesignCustomizer = false,
  unlockedDesignColors = ['#f59e0b'],
  selectedDesignColors = ['#f59e0b'],
  purchasedAnimationIds = [],
  equippedAnimationId = '',
  onAddCredits,
  onBuySkin,
  onEquipSkin,
  onUnlockDesignCustomizer,
  onBuyColor,
  onToggleDesignColor,
  onBuyAnimation,
  onEquipAnimation,
  onClaimDailyWheel,
  onClose,
  initialTab = 'marketplace',
}) => {
  const [activeTab, setActiveTab] = useState<
    'wheel' | 'exchange' | 'marketplace' | 'design' | 'animations'
  >(initialTab);

  // Marketplace Filter Categories: 'all' | 'skins' | 'designs' | 'animations'
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'skins' | 'designs' | 'animations'
  >('all');

  // Wheel State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wheelWinMessage, setWheelWinMessage] = useState<string | null>(null);

  // Exchange State
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  // Marketplace Toast / Messages
  const [marketMessage, setMarketMessage] = useState<string | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);

  // Preview Modals
  const [previewSkin, setPreviewSkin] = useState<CyberSkin | null>(null);
  const [previewColor, setPreviewColor] = useState<InterfaceColorOption | null>(null);
  const [previewAnimation, setPreviewAnimation] = useState<UIAnimationOption | null>(null);

  const todayStr = getTodayDateString();
  const hasSpunToday = lastWheelSpinDate === todayStr;

  // Marketplace Category Chips
  const MARKET_CATEGORIES = [
    { id: 'all', label: lang === 'en' ? 'All Products' : 'Alle Produkte' },
    { id: 'skins', label: 'Skins' },
    { id: 'designs', label: lang === 'en' ? 'Design Colors' : 'Design-Farben' },
    { id: 'animations', label: lang === 'en' ? 'Animations' : 'Animationen' },
  ];

  // --- WHEEL OF FORTUNE SPIN LOGIC ---
  const handleSpinWheel = async () => {
    if (hasSpunToday || isSpinning) return;

    setIsSpinning(true);
    setWheelWinMessage(null);

    let reward: number;
    try {
      ({ reward } = await onClaimDailyWheel());
    } catch (error) {
      console.error('Daily wheel claim failed:', error);
      setIsSpinning(false);
      setWheelWinMessage(
        lang === 'en'
          ? 'The reward could not be claimed. Please try again.'
          : 'Die Belohnung konnte nicht eingelöst werden. Bitte versuche es erneut.'
      );
      return;
    }

    const targetSliceDegree = reward === 100 ? 30 : reward === 25 ? 150 : reward === 5 ? 270 : 90;

    const extraRounds = 360 * 5;
    const finalDegree = wheelRotation + extraRounds + (360 - (targetSliceDegree % 360));
    setWheelRotation(finalDegree);

    setTimeout(() => {
      setIsSpinning(false);

      if (reward > 0) {
        setWheelWinMessage(
          lang === 'en'
            ? `🎉 CONGRATULATIONS! You won +${reward} Credits!`
            : `🎉 GLÜCKWUNSCH! Du hast +${reward} Credits gewonnen!`
        );
      } else {
        setWheelWinMessage(
          lang === 'en'
            ? 'No win! Unfortunately no prize this time. Come back tomorrow!'
            : 'Niete! Leider kein Gewinn diesmal. Komme morgen wieder!'
        );
      }
    }, 3500);
  };

  // --- EXCHANGE CHECKOUT LOGIC ---
  const handlePayNow = () => {
    if (!selectedPackage) return;

    setTimeout(async () => {
      try {
        await onAddCredits(selectedPackage.credits);
      } catch (error) {
        console.error('Credit checkout failed:', error);
        setPurchaseSuccessMessage(lang === 'en' ? 'Payment could not be started.' : 'Zahlung konnte nicht gestartet werden.');
        return;
      }
      const amount = selectedPackage.credits;
      setSelectedPackage(null);

      setPurchaseSuccessMessage(
        lang === 'en'
          ? `Purchase successful! +${amount} Credits added to your balance.`
          : `Kauf erfolgreich! +${amount} Credits wurden gutgeschrieben.`
      );
    }, 400);
  };

  // --- BUY SKIN LOGIC ---
  const handleBuySkinClick = async (skin: CyberSkin) => {
    setMarketError(null);
    setMarketMessage(null);

    const sName = translateSkinName(skin, lang);

    if (ownedSkinIds.includes(skin.id)) return;

    if (currentCredits < skin.price) {
      setMarketError(
        lang === 'en'
          ? `Not enough credits for "${sName}". You have ${currentCredits} Credits, but need ${skin.price} Credits.`
          : `Nicht genügend Credits für "${sName}". Du hast ${currentCredits} Credits, benötigst jedoch ${skin.price} Credits.`
      );
      return;
    }

    const success = await onBuySkin(skin);
    if (success) {
      setMarketMessage(
        lang === 'en'
          ? `Skin "${sName}" successfully unlocked!`
          : `Skin "${sName}" erfolgreich freigeschaltet!`
      );
      setTimeout(() => setMarketMessage(null), 3000);
    }
  };

  // --- BUY COLOR LOGIC ---
  const handleBuyColorClick = async (color: InterfaceColorOption) => {
    setMarketError(null);
    setMarketMessage(null);

    const cName = lang === 'en' && color.nameEn ? color.nameEn : color.name;
    const isUnlocked = unlockedDesignColors.includes(color.hex);

    if (isUnlocked) {
      // If already unlocked, toggle selection
      if (onToggleDesignColor) onToggleDesignColor(color.hex);
      return;
    }

    if (currentCredits < color.price) {
      setMarketError(
        lang === 'en'
          ? `Not enough credits for "${cName}". You need ${color.price} Credits.`
          : `Nicht genügend Credits für "${cName}". Du benötigst ${color.price} Credits.`
      );
      return;
    }

    if (onBuyColor) {
      const ok = await onBuyColor(color);
      if (ok) {
        setMarketMessage(
          lang === 'en'
            ? `🎉 Color "${cName}" successfully unlocked!`
            : `🎉 Farbe "${cName}" erfolgreich freigeschaltet!`
        );
        setTimeout(() => setMarketMessage(null), 3000);
      }
    }
  };

  // --- BUY ANIMATION LOGIC ---
  const handleBuyAnimationClick = async (anim: UIAnimationOption) => {
    setMarketError(null);
    setMarketMessage(null);

    const aName = lang === 'en' && anim.nameEn ? anim.nameEn : anim.name;

    if (purchasedAnimationIds.includes(anim.id)) {
      if (onEquipAnimation) onEquipAnimation(anim.id);
      return;
    }

    if (currentCredits < anim.price) {
      setMarketError(
        lang === 'en'
          ? `Not enough credits for "${aName}". You need ${anim.price} Credits.`
          : `Nicht genügend Credits für "${aName}". Du benötigst ${anim.price} Credits.`
      );
      return;
    }

    if (onBuyAnimation) {
      const ok = await onBuyAnimation(anim);
      if (ok) {
        setMarketMessage(
          lang === 'en'
            ? `🎉 Animation "${aName}" unlocked and activated!`
            : `🎉 Animation "${aName}" freigeschaltet und aktiviert!`
        );
        setTimeout(() => setMarketMessage(null), 3000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn font-mono">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/50 rounded-2xl p-4 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.25)] my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Decorative Corner Lines */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-all z-20 active:scale-95"
          title={lang === 'en' ? 'Close' : 'Schließen'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-3 pr-10 sm:pr-12">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-950 to-yellow-950 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 uppercase tracking-widest block font-bold">
                CYBER STORE & ECONOMY
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide">
                CYBER SHOP
              </h2>
            </div>
          </div>

          {/* Current Credits Badge */}
          <div className="bg-slate-950 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-2 self-start sm:self-auto shadow-inner">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="text-right">
              <span className="text-[9px] text-slate-400 uppercase block leading-none">
                {lang === 'en' ? 'Balance' : 'Guthaben'}
              </span>
              <span className="text-sm font-extrabold text-amber-300">{currentCredits} Credits</span>
            </div>
          </div>
        </div>

        {/* MAIN NAVIGATION TABS */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'marketplace'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>{lang === 'en' ? 'Marketplace' : 'Marktplatz'}</span>
          </button>

          <button
            onClick={() => setActiveTab('wheel')}
            className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'wheel'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <RotateCw className="w-4 h-4 shrink-0" />
            <span>{lang === 'en' ? 'Wheel of Fortune' : 'Glücksrad'}</span>
          </button>

          <button
            onClick={() => setActiveTab('exchange')}
            className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'exchange'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>{lang === 'en' ? 'Exchange' : 'Tauschbörse'}</span>
          </button>
        </div>

        {/* TAB 1: MARKTPLATZ (ENTHÄLT SKINS, DESIGN-FARBEN UND ANIMATIONEN ALLES ZUSAMMEN & ALS KATEGORIEN) */}
        {activeTab === 'marketplace' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {lang === 'en' ? 'Cyber Marketplace' : 'Cyber Marktplatz'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Choose from exclusive profile skins, interface design colors, and dynamic UI animations.'
                    : 'Wähle aus exklusiven Profil-Skins, Interface Design-Farben und dynamic UI Animationen.'}
                </p>
              </div>

              <div className="text-xs text-slate-400 font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 shrink-0 self-start sm:self-auto">
                {lang === 'en' ? 'Balance:' : 'Guthaben:'} <span className="text-amber-400">{currentCredits} Cr</span>
              </div>
            </div>

            {/* CATEGORY FILTER REITER / CHIPS */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1 text-slate-400 text-xs mr-2 shrink-0 font-bold">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'en' ? 'Category:' : 'Kategorie:'}</span>
              </div>
              {MARKET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {marketError && (
              <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{marketError}</span>
                </div>
                <button
                  onClick={() => setActiveTab('exchange')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider shrink-0 ml-2"
                >
                  {lang === 'en' ? 'Top Up Credits' : 'Credits aufladen'}
                </button>
              </div>
            )}

            {/* Success Message */}
            {marketMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{marketMessage}</span>
              </div>
            )}

            {/* SECTION 1: SKINS (ALL SKINS CONSOLIDATED INTO ONE CATEGORY) */}
            {(selectedCategory === 'all' || selectedCategory === 'skins') && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? `Profile Skins (${AVAILABLE_SKINS.length})`
                        : `Profil-Skins (${AVAILABLE_SKINS.length})`}
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {lang === 'en' ? 'Exclusive Vector Artworks' : 'Exklusive Vektor-Artworks'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AVAILABLE_SKINS.map((skin) => {
                    const isOwned = ownedSkinIds.includes(skin.id);
                    const isEquipped = equippedSkinId === skin.id;
                    const sName = translateSkinName(skin, lang);
                    const sDesc = translateSkinDesc(skin, lang);

                    return (
                      <div
                        key={skin.id}
                        className={`relative bg-slate-950 rounded-2xl p-3.5 border transition-all flex flex-col justify-between group ${
                          isEquipped
                            ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                            : isOwned
                            ? 'border-emerald-500/50 bg-emerald-950/10'
                            : 'border-slate-800 hover:border-amber-500/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                                skin.rarity === 'legendary'
                                  ? 'bg-yellow-950 text-yellow-300 border-yellow-500/60'
                                  : skin.rarity === 'epic'
                                  ? 'bg-purple-950 text-purple-300 border-purple-500/60'
                                  : skin.rarity === 'rare'
                                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {skin.rarity}
                            </span>

                            {isEquipped ? (
                              <span className="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Check className="w-3 h-3 text-slate-950" />
                                <span>{lang === 'en' ? 'ACTIVE' : 'AKTIV'}</span>
                              </span>
                            ) : isOwned ? (
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/60 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{lang === 'en' ? 'OWNED' : 'BESITZT'}</span>
                              </span>
                            ) : (
                              <span className="text-amber-400 font-extrabold text-xs flex items-center space-x-1">
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                <span>{skin.price} Cr</span>
                              </span>
                            )}
                          </div>

                          {skin.avatarUrl && (
                            <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-800 mb-2.5 relative group-hover:border-amber-500/50 transition-all bg-slate-900">
                              <img
                                src={skin.avatarUrl}
                                alt={sName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter contrast-125 brightness-90"
                              />

                              <button
                                onClick={() => setPreviewSkin(skin)}
                                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/60 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                                title={lang === 'en' ? 'Preview' : 'Vorschau'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <h4 className="text-sm font-bold text-slate-100 mb-1">{sName}</h4>
                          <p className="text-[11px] text-slate-400 leading-tight mb-3 line-clamp-2">
                            {sDesc}
                          </p>
                        </div>

                        <div>
                          {isOwned ? (
                            <button
                              onClick={() => onEquipSkin && onEquipSkin(skin)}
                              className={`w-full py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                                isEquipped
                                  ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 cursor-default'
                                  : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-slate-200 active:scale-95'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {isEquipped
                                  ? lang === 'en'
                                    ? 'Equipped'
                                    : 'Ausrüstung Aktiv'
                                  : lang === 'en'
                                  ? 'Equip Skin'
                                  : 'Skin Ausrüsten'}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuySkinClick(skin)}
                              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-1.5 active:scale-95"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>
                                {lang === 'en' ? `Buy (${skin.price} Cr)` : `Kaufen (${skin.price} Cr)`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: DESIGN-FARBEN (EINZELN FREISCHALTBAR PRO FARBE BEI 100 CREDITS & MIT VORSCHAU) */}
            {(selectedCategory === 'all' || selectedCategory === 'designs') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 flex items-center space-x-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Interface Design Colors (100 Cr/Color)'
                        : 'Interface Design-Farben (Einzeln freischaltbar - 100 Cr/Farbe)'}
                    </span>
                  </h4>
                  <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                    {lang === 'en' ? 'Max 3 active' : 'Max. 3 gleichzeitig aktiv'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {INTERFACE_COLOR_PALETTE.map((color) => {
                    const isUnlocked = color.hex === '#06b6d4' || color.price === 0 || unlockedDesignColors.includes(color.hex);
                    const isSelected = selectedDesignColors.includes(color.hex);
                    const selectedIndex = selectedDesignColors.indexOf(color.hex);
                    const cName = lang === 'en' && color.nameEn ? color.nameEn : color.name;
                    const cDesc = lang === 'en' && color.descriptionEn ? color.descriptionEn : color.description;

                    return (
                      <div
                        key={color.id}
                        className={`relative bg-slate-950 rounded-2xl p-3.5 border transition-all flex flex-col justify-between group ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                            : isUnlocked
                            ? 'border-emerald-500/50 bg-emerald-950/10'
                            : 'border-slate-800 hover:border-cyan-500/50'
                        }`}
                      >
                        <div>
                          {/* Top Tag & Price */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                              Design
                            </span>

                            {isSelected ? (
                              <span className="bg-cyan-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Check className="w-3 h-3 text-slate-950" />
                                <span># {selectedIndex + 1} {lang === 'en' ? 'ACTIVE' : 'AKTIV'}</span>
                              </span>
                            ) : isUnlocked ? (
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/60 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{lang === 'en' ? 'UNLOCKED' : 'FREIGESCHALTET'}</span>
                              </span>
                            ) : (
                              <span className="text-amber-400 font-extrabold text-xs flex items-center space-x-1">
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                <span>{color.price} Cr</span>
                              </span>
                            )}
                          </div>

                          {/* Color Visual Swatch Preview Box */}
                          <div
                            className="w-full h-24 rounded-xl border-2 border-slate-700/80 mb-2.5 relative flex items-center justify-center overflow-hidden group-hover:scale-102 transition-transform shadow-lg"
                            style={{
                              backgroundColor: color.hex,
                              boxShadow: `0 0 25px ${color.bgGlow}`,
                            }}
                          >
                            <button
                              onClick={() => setPreviewColor(color)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-200 hover:text-cyan-300 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                              title={lang === 'en' ? 'Preview' : 'Vorschau'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <div className="w-10 h-10 rounded-full bg-slate-950/40 border border-white/20 flex items-center justify-center text-white font-bold backdrop-blur-sm">
                              <Palette className="w-5 h-5 text-white" />
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-slate-100 mb-1 flex items-center justify-between">
                            <span>{cName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{color.hex}</span>
                          </h4>

                          <p className="text-[11px] text-slate-400 leading-tight mb-3 line-clamp-2">
                            {cDesc}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setPreviewColor(color)}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all shrink-0"
                            title={lang === 'en' ? 'Detail Preview' : 'Detail-Vorschau'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isUnlocked ? (
                            <button
                              onClick={() => onToggleDesignColor && onToggleDesignColor(color.hex)}
                              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition-all ${
                                isSelected
                                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {isSelected
                                  ? lang === 'en'
                                    ? 'Activated'
                                    : 'Aktiviert'
                                  : lang === 'en'
                                  ? 'Activate'
                                  : 'Aktivieren'}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuyColorClick(color)}
                              className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-1 active:scale-95"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>{lang === 'en' ? `Buy (${color.price} Cr)` : `Kaufen (${color.price} Cr)`}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 3: ANIMATIONEN (DYNAMISCHE HINTERGRÜNDE MIT VORSCHAU & KAUF) */}
            {(selectedCategory === 'all' || selectedCategory === 'animations') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-purple-400 flex items-center space-x-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Interface UI Animations (250–750 Credits)'
                        : 'Interface UI Animationen (250–750 Credits)'}
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {lang === 'en' ? 'Effectful Cyber Background' : 'Effektvoller Cyber-Hintergrund'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {UI_ANIMATION_OPTIONS.map((anim) => {
                    const isPurchased = purchasedAnimationIds.includes(anim.id);
                    const isEquipped = equippedAnimationId === anim.id;
                    const aName = lang === 'en' && anim.nameEn ? anim.nameEn : anim.name;
                    const aDesc = lang === 'en' && anim.descriptionEn ? anim.descriptionEn : anim.description;
                    const aComp = lang === 'en' && anim.complexityEn ? anim.complexityEn : anim.complexity;

                    return (
                      <div
                        key={anim.id}
                        className={`p-4 rounded-2xl border transition-all bg-slate-950 flex flex-col justify-between group ${
                          isEquipped
                            ? 'border-purple-400 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                            : isPurchased
                            ? 'border-emerald-500/50 bg-emerald-950/10'
                            : 'border-slate-800 hover:border-purple-500/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                              {aComp}
                            </span>

                            {isEquipped ? (
                              <span className="bg-purple-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Zap className="w-3 h-3 text-slate-950" />
                                <span>{lang === 'en' ? 'ACTIVE' : 'AKTIV'}</span>
                              </span>
                            ) : isPurchased ? (
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/60 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{lang === 'en' ? 'UNLOCKED' : 'FREIGESCHALTET'}</span>
                              </span>
                            ) : (
                              <span className="text-amber-400 font-extrabold text-xs flex items-center space-x-1">
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                <span>{anim.price} Cr</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-100 mb-1 flex items-center space-x-2">
                            <Film className="w-4 h-4 text-purple-400 shrink-0" />
                            <span>{aName}</span>
                          </h4>

                          <p className="text-xs text-slate-400 leading-relaxed mb-3">
                            {aDesc}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-900">
                          <button
                            onClick={() => setPreviewAnimation(anim)}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-purple-400 hover:border-purple-500/50 transition-all shrink-0"
                            title={lang === 'en' ? 'Detail Preview' : 'Detail-Vorschau'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPurchased ? (
                            <button
                              onClick={() => onEquipAnimation && onEquipAnimation(anim.id)}
                              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 active:scale-95 ${
                                isEquipped
                                  ? 'bg-purple-500/30 border border-purple-400 text-purple-200'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              }`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>
                                {isEquipped
                                  ? lang === 'en'
                                    ? 'Active (Deactivate)'
                                    : 'Aktiviert (Deaktivieren)'
                                  : lang === 'en'
                                  ? 'Activate'
                                  : 'Aktivieren'}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuyAnimationClick(anim)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-1.5 active:scale-95"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>{lang === 'en' ? `Buy (${anim.price} Cr)` : `Kaufen (${anim.price} Cr)`}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GLÜCKSRAD */}
        {activeTab === 'wheel' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 flex flex-col items-center justify-between text-center py-2">
            <div className="max-w-md mx-auto">
              <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block mb-1">
                DAILY BONUS // WHEEL OF FORTUNE
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                {lang === 'en' ? 'Spin the Wheel of Fortune!' : 'Drehe das Glücksrad!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'en'
                  ? 'Every day you can spin the wheel once and win valuable in-game credits with a bit of luck.'
                  : 'Jeden Tag kannst du einmal am Rad drehen und mit etwas Glück wertvolle Ingame-Credits gewinnen.'}
              </p>
            </div>

            {/* Visual Spinning Wheel Graphic */}
            <div className="relative my-2 w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center shrink-0">
              <div className="absolute -top-3 z-20 text-amber-400 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-400" />
              </div>

              <div
                className="w-full h-full rounded-full border-4 border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.3)] relative overflow-hidden transition-transform ease-out"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transitionDuration: isSpinning ? '3.5s' : '0s',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-950 via-yellow-900 to-amber-950 flex items-center justify-center">
                  <div className="w-full h-full relative">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-extrabold text-amber-300 flex flex-col items-center">
                      <Coins className="w-4 h-4 text-amber-400 mb-0.5" />
                      <span>5 Credits</span>
                    </div>

                    <div className="absolute top-1/2 right-2 -translate-y-1/2 rotate-90 text-xs font-bold text-slate-500">
                      <span>{lang === 'en' ? 'No Win' : 'Niete'}</span>
                    </div>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rotate-180 text-xs font-extrabold text-amber-300 flex flex-col items-center">
                      <Coins className="w-4 h-4 text-amber-400 mb-0.5" />
                      <span>25 Credits</span>
                    </div>

                    <div className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 text-xs font-bold text-slate-500">
                      <span>{lang === 'en' ? 'No Win' : 'Niete'}</span>
                    </div>

                    <div className="absolute top-1/4 right-6 text-[10px] font-black text-amber-200 rotate-45 flex items-center space-x-0.5">
                      <Sparkles className="w-3 h-3 text-yellow-300 animate-spin" />
                      <span>100 Credits</span>
                    </div>

                    <div className="absolute bottom-1/4 left-6 text-[10px] font-bold text-slate-500 -rotate-45">
                      <span>{lang === 'en' ? 'No Win' : 'Niete'}</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-lg z-10">
                  <Gift className="w-5 h-5" />
                </div>
              </div>
            </div>

            {wheelWinMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold max-w-md w-full animate-fadeIn ${
                  wheelWinMessage.includes('GLÜCKWUNSCH') || wheelWinMessage.includes('CONGRATULATIONS')
                    ? 'bg-amber-950/90 border border-amber-500/80 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                {wheelWinMessage}
              </div>
            )}

            <div className="w-full max-w-md pt-2">
              <button
                onClick={handleSpinWheel}
                disabled={hasSpunToday || isSpinning}
                className={`w-full py-3 px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg ${
                  hasSpunToday
                    ? 'bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed opacity-80'
                    : isSpinning
                    ? 'bg-amber-950 border border-amber-500/50 text-amber-400 cursor-wait'
                    : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95'
                }`}
              >
                {isSpinning ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{lang === 'en' ? 'Wheel spinning...' : 'Rad dreht sich...'}</span>
                  </>
                ) : hasSpunToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'en' ? 'Already spun today' : 'Heute bereits gedreht'}</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Spin for free now!' : 'Jetzt kostenlos drehen!'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: TAUSCHBÖRSE */}
        {activeTab === 'exchange' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="text-center max-w-lg mx-auto mb-2">
              <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block mb-0.5">
                CURRENCY STORE // REAL MONEY EXCHANGE
              </span>
              <h3 className="text-base font-bold text-slate-100">
                {lang === 'en' ? 'Top Up Credit Packages' : 'Credit-Pakete aufladen'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'en'
                  ? 'Purchase credits to unlock exclusive skins, design colors, and UI animations.'
                  : 'Kaufe Credits, um exklusive Skins, Design-Farben und UI-Animationen freizuschalten.'}
              </p>
            </div>

            {purchaseSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">{purchaseSuccessMessage}</span>
                </div>
                <button
                  onClick={() => setPurchaseSuccessMessage(null)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs font-bold underline ml-2"
                >
                  OK
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative bg-slate-950 p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group hover:scale-[1.02] active:scale-95 ${
                    pkg.popular
                      ? 'border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950'
                      : pkg.bestValue
                      ? 'border-cyan-500/80 shadow-[0_0_25px_rgba(0,240,255,0.25)] bg-gradient-to-b from-cyan-950/40 via-slate-950 to-slate-950'
                      : 'border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                      {lang === 'en' ? 'Popular' : 'Beliebt'}
                    </div>
                  )}
                  {pkg.bestValue && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                      {lang === 'en' ? 'Best Value' : 'Bester Wert'}
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1 font-bold">
                      {pkg.title}
                    </span>
                    <div className="flex items-center justify-center space-x-1.5 text-amber-400 my-2">
                      <Coins className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform" />
                      <span className="text-3xl font-black text-slate-100">{pkg.credits}</span>
                    </div>
                    <span className="text-xs text-amber-400 font-bold block">Credits</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
                    <span className="text-xl font-extrabold text-slate-100 block mb-2">{pkg.price}</span>
                    <button
                      type="button"
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-1"
                    >
                      <span>{lang === 'en' ? 'Select' : 'Auswählen'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SKIN DETAIL PREVIEW MODAL */}
      {previewSkin && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-fadeIn font-mono">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.4)]">
            <button
              onClick={() => setPreviewSkin(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-amber-400 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-500/60">
                  {previewSkin.rarity}
                </span>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  {lang === 'en' ? 'Profile Skin' : 'Profil-Skin'}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-100">
                {translateSkinName(previewSkin, lang)}
              </h3>

              {previewSkin.avatarUrl && (
                <div className="w-full h-56 rounded-2xl overflow-hidden border-2 border-amber-500/40 relative shadow-2xl bg-slate-950">
                  <img
                    src={previewSkin.avatarUrl}
                    alt={translateSkinName(previewSkin, lang)}
                    className="w-full h-full object-cover filter contrast-125 brightness-95"
                  />
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed">
                {translateSkinDesc(previewSkin, lang)}
              </p>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">
                  {lang === 'en' ? 'Price:' : 'Preis:'}
                </span>
                <span className="text-lg font-black text-amber-400">{previewSkin.price} Credits</span>
              </div>

              <div className="pt-1">
                {ownedSkinIds.includes(previewSkin.id) ? (
                  <button
                    onClick={() => {
                      if (onEquipSkin) onEquipSkin(previewSkin);
                      setPreviewSkin(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase"
                  >
                    {lang === 'en' ? 'Equip' : 'Ausrüsten'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleBuySkinClick(previewSkin);
                      setPreviewSkin(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  >
                    {lang === 'en'
                      ? `Buy (${previewSkin.price} Credits)`
                      : `Kaufen (${previewSkin.price} Credits)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLOR DETAIL PREVIEW MODAL */}
      {previewColor && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-fadeIn font-mono">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/70 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.4)]">
            <button
              onClick={() => setPreviewColor(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/60">
                  {lang === 'en' ? 'Interface Color' : 'Interface Farbe'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{previewColor.hex}</span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-100">
                {lang === 'en' && previewColor.nameEn ? previewColor.nameEn : previewColor.name}
              </h3>

              {/* Glowing Color Box Preview */}
              <div
                className="w-full h-40 rounded-2xl border-2 border-slate-600 flex items-center justify-center relative overflow-hidden shadow-2xl"
                style={{
                  backgroundColor: previewColor.hex,
                  boxShadow: `0 0 40px ${previewColor.bgGlow}`,
                }}
              >
                <div className="w-16 h-16 rounded-full bg-slate-950/50 border-2 border-white/40 flex items-center justify-center text-white backdrop-blur-md">
                  <Palette className="w-8 h-8 text-white" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'en' && previewColor.descriptionEn
                  ? previewColor.descriptionEn
                  : previewColor.description}
              </p>

              <div className="pt-1 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400">
                  {lang === 'en' ? 'Price:' : 'Einzelpreis:'}
                </span>
                <span className="text-lg font-black text-amber-400">{previewColor.price} Credits</span>
              </div>

              <div className="pt-1">
                {unlockedDesignColors.includes(previewColor.hex) ? (
                  <button
                    onClick={() => {
                      if (onToggleDesignColor) onToggleDesignColor(previewColor.hex);
                      setPreviewColor(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs uppercase shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    {selectedDesignColors.includes(previewColor.hex)
                      ? lang === 'en'
                        ? 'Deactivate Color'
                        : 'Farbe Deaktivieren'
                      : lang === 'en'
                      ? 'Activate Color'
                      : 'Farbe Aktivieren'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleBuyColorClick(previewColor);
                      setPreviewColor(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  >
                    {lang === 'en' ? 'Unlock Color (100 Cr)' : 'Farbe Freischalten (100 Cr)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATION DETAIL PREVIEW MODAL */}
      {previewAnimation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-fadeIn font-mono">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-purple-500/70 rounded-2xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.4)]">
            <button
              onClick={() => setPreviewAnimation(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-purple-400 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/60">
                  {lang === 'en' && previewAnimation.complexityEn
                    ? previewAnimation.complexityEn
                    : previewAnimation.complexity}
                </span>
                <span className="text-xs text-purple-300 font-bold">UI Background FX</span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
                <Film className="w-5 h-5 text-purple-400" />
                <span>
                  {lang === 'en' && previewAnimation.nameEn
                    ? previewAnimation.nameEn
                    : previewAnimation.name}
                </span>
              </h3>

              <div className="w-full p-4 rounded-2xl bg-slate-950 border border-purple-500/40 text-center space-y-2 shadow-inner">
                <Zap className="w-8 h-8 text-purple-400 mx-auto animate-pulse" />
                <p className="text-xs text-slate-300 italic">
                  {lang === 'en' && previewAnimation.descriptionEn
                    ? previewAnimation.descriptionEn
                    : previewAnimation.description}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400">
                  {lang === 'en' ? 'Price:' : 'Preis:'}
                </span>
                <span className="text-lg font-black text-amber-400">{previewAnimation.price} Credits</span>
              </div>

              <div className="pt-1">
                {purchasedAnimationIds.includes(previewAnimation.id) ? (
                  <button
                    onClick={() => {
                      if (onEquipAnimation) onEquipAnimation(previewAnimation.id);
                      setPreviewAnimation(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-500 text-slate-950 font-bold text-xs uppercase shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  >
                    {equippedAnimationId === previewAnimation.id
                      ? lang === 'en'
                        ? 'Deactivate'
                        : 'Deaktivieren'
                      : lang === 'en'
                      ? 'Activate'
                      : 'Aktivieren'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleBuyAnimationClick(previewAnimation);
                      setPreviewAnimation(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  >
                    {lang === 'en' ? `Buy (${previewAnimation.price} Cr)` : `Kaufen (${previewAnimation.price} Cr)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT POPUP MODAL */}
      {selectedPackage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-fadeIn font-mono">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.4)]">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-amber-400 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500/50 text-amber-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-widest block font-bold">
                  EXCHANGE CHECKOUT
                </span>
                <h3 className="text-base font-bold text-slate-100">
                  {lang === 'en' ? 'Payment Overview' : 'Zahlungsübersicht'}
                </h3>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 mb-5">
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">{lang === 'en' ? 'Selected Package:' : 'Gewähltes Paket:'}</span>
                <span className="font-bold text-slate-100">{selectedPackage.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">{lang === 'en' ? 'Included Credits:' : 'Enthaltene Credits:'}</span>
                <span className="font-bold text-amber-400 flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>+{selectedPackage.credits} Credits</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="font-bold text-slate-300">{lang === 'en' ? 'Total Amount:' : 'Gesamtsumme:'}</span>
                <span className="text-lg font-black text-slate-100">{selectedPackage.price}</span>
              </div>
            </div>

            <button
              onClick={handlePayNow}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center space-x-2 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>{lang === 'en' ? 'Purchase Now' : 'Jetzt Kostenpflichtig Kaufen'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
