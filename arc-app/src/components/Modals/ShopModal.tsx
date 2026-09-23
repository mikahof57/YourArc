import React, { useEffect, useState } from 'react';
import {
  X,
  ShoppingCart,
  Coins,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  Gift,
  Check,
  AlertTriangle,
  Tag,
  Eye,
} from 'lucide-react';
import {
  AVAILABLE_SKINS,
  CyberSkin,
  type SkinCollection,
  SKIN_COLLECTIONS,
  translateSkinName,
} from '../../data/skinData';
import { getTodayDateString } from '../../utils/storage';
import type { ArcIapDisplayProduct, ArcIapPurchaseOutcome } from '../../features/economy/localIapService';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface ShopModalProps {
  lang?: string;
  currentCredits: number;
  ownedSkinIds: string[];
  equippedSkinId?: string;
  lastWheelSpinDate?: string;
  onBuySkin: (skin: CyberSkin) => boolean | Promise<boolean>;
  onEquipSkin?: (skin: CyberSkin) => void;
  onClaimDailyWheel: () => Promise<{ reward: number; balance: number }>;
  onClose: () => void;
  initialTab?: 'wheel' | 'exchange' | 'marketplace';
  embedded?: boolean;
  playerName?: string;
  playerAvatarUrl?: string;
  playerLevel?: number;
  playerCurrentXp?: number;
  playerRequiredXp?: number;
  iapAvailable?: boolean;
  nativePlatform?: 'web' | 'ios' | 'android';
  onLoadCreditProducts?: () => Promise<ArcIapDisplayProduct[]>;
  onPurchaseCredits?: (productId: string) => Promise<ArcIapPurchaseOutcome>;
}

export function getWheelTargetSliceDegree(reward: number): number {
  if (reward === 100) return 30;
  if (reward === 25) return 150;
  if (reward === 5) return 270;
  return 90;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  lang = 'en',
  currentCredits,
  ownedSkinIds = [],
  equippedSkinId = '',
  lastWheelSpinDate = '',
  onBuySkin,
  onEquipSkin,
  onClaimDailyWheel,
  onClose,
  initialTab = 'marketplace',
  embedded = false,
  playerName = 'Operator',
  playerAvatarUrl = '',
  playerLevel = 1,
  playerCurrentXp = 0,
  playerRequiredXp = 0,
  iapAvailable = false,
  nativePlatform = 'web',
  onLoadCreditProducts,
  onPurchaseCredits,
}) => {
  const dialogRef = useModalAccessibility<HTMLDivElement>(onClose, !embedded);
  const [activeTab, setActiveTab] = useState<
    'wheel' | 'exchange' | 'marketplace'
  >(initialTab);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'skins'>('all');
  const [skinCollectionFilter, setSkinCollectionFilter] = useState<'all' | SkinCollection>('all');

  // Wheel State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wheelWinMessage, setWheelWinMessage] = useState<string | null>(null);

  // Marketplace Toast / Messages
  const [marketMessage, setMarketMessage] = useState<string | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [purchasingSkinId, setPurchasingSkinId] = useState<string | null>(null);
  const [creditPackages, setCreditPackages] = useState<ArcIapDisplayProduct[]>([]);
  const [iapLoading, setIapLoading] = useState(true);
  const [iapPurchasingId, setIapPurchasingId] = useState<string | null>(null);
  const [iapMessage, setIapMessage] = useState<string | null>(null);
  const [iapError, setIapError] = useState<string | null>(null);

  // Preview Modals
  const [previewSkin, setPreviewSkin] = useState<CyberSkin | null>(null);

  const todayStr = getTodayDateString();
  const hasSpunToday = lastWheelSpinDate === todayStr;

  const loadCreditProducts = async () => {
    setIapLoading(true); setIapError(null);
    try { setCreditPackages(await onLoadCreditProducts?.() ?? []); }
    catch { setIapError(lang === 'en' ? 'Store unavailable. Try again.' : 'Store nicht verfügbar. Erneut versuchen.'); }
    finally { setIapLoading(false); }
  };

  useEffect(() => { void loadCreditProducts(); }, [lang, onLoadCreditProducts]);

  const handleCreditPurchase = async (productId: string) => {
    if (!onPurchaseCredits || iapPurchasingId) return;
    setIapPurchasingId(productId); setIapMessage(null); setIapError(null);
    try {
      const outcome = await onPurchaseCredits(productId);
      if (outcome.state === 'pending') setIapMessage(lang === 'en' ? 'Purchase pending.' : 'Kauf ausstehend.');
      else if (outcome.state === 'cancelled') setIapMessage(lang === 'en' ? 'Purchase cancelled.' : 'Kauf abgebrochen.');
      else setIapMessage(lang === 'en' ? `${outcome.creditsAdded} Credits added. Purchase successful.` : `${outcome.creditsAdded} Credits hinzugefügt. Kauf erfolgreich.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setIapError(message.includes('cancelled')
        ? (lang === 'en' ? 'Purchase cancelled.' : 'Kauf abgebrochen.')
        : (lang === 'en' ? 'Purchase failed. Try again.' : 'Kauf fehlgeschlagen. Erneut versuchen.'));
    } finally { setIapPurchasingId(null); }
  };

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

    const targetSliceDegree = getWheelTargetSliceDegree(reward);

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

  // --- BUY SKIN LOGIC ---
  const handleBuySkinClick = async (skin: CyberSkin) => {
    setMarketError(null);
    setMarketMessage(null);

    const sName = translateSkinName(skin, lang);

    if (ownedSkinIds.includes(skin.id)) {
      setMarketError(lang === 'en' ? 'You already own this Skin.' : 'Du besitzt diesen Skin bereits.');
      return;
    }

    if (currentCredits < skin.price) {
      setMarketError(
        lang === 'en'
          ? `Not enough credits for "${sName}". You have ${currentCredits} Credits, but need ${skin.price} Credits.`
          : `Nicht genügend Credits für "${sName}". Du hast ${currentCredits} Credits, benötigst jedoch ${skin.price} Credits.`
      );
      return;
    }

    if (purchasingSkinId) return;
    setPurchasingSkinId(skin.id);
    try {
      const success = await onBuySkin(skin);
      if (success) {
        setMarketMessage(
          lang === 'en'
            ? `Skin "${sName}" successfully unlocked!`
            : `Skin "${sName}" erfolgreich freigeschaltet!`
        );
        setTimeout(() => setMarketMessage(null), 3000);
      } else {
        setMarketError(lang === 'en' ? 'The trusted purchase failed.' : 'Der verifizierte Kauf ist fehlgeschlagen.');
      }
    } catch (error) {
      console.error('Skin purchase failed:', error);
      const message = error && typeof error === 'object' && typeof Reflect.get(error, 'message') === 'string'
        ? String(Reflect.get(error, 'message')).toLowerCase()
        : String(error ?? '').toLowerCase();
      setMarketError(
        message.includes('insufficient_credits')
          ? (lang === 'en' ? 'Not enough Credits.' : 'Nicht genügend Credits.')
          : message.includes('already_owned')
            ? (lang === 'en' ? 'You already own this Skin.' : 'Du besitzt diesen Skin bereits.')
            : message.includes('product_unavailable') || message.includes('item_not_found')
              ? (lang === 'en' ? 'This Skin is currently unavailable.' : 'Dieser Skin ist derzeit nicht verfügbar.')
              : message.includes('not_authenticated')
                ? (lang === 'en' ? 'Please sign in before purchasing.' : 'Bitte melde dich vor dem Kauf an.')
                : (lang === 'en'
                  ? 'The purchase could not be verified. Please try again.'
                  : 'Der Kauf konnte nicht verifiziert werden. Bitte versuche es erneut.')
      );
    } finally {
      setPurchasingSkinId(null);
    }
  };

  return (
    <div className={embedded ? 'arc-shop-page' : 'arc-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 animate-fadeIn'}>
      <div ref={embedded ? undefined : dialogRef} tabIndex={embedded ? undefined : -1} role={embedded ? undefined : 'dialog'} aria-modal={embedded ? undefined : true} aria-label={embedded ? undefined : 'ARC Shop'} className={embedded ? 'arc-shop-canvas' : 'arc-modal arc-shop relative w-full max-w-4xl bg-slate-900 border border-amber-500/50 rounded-2xl p-4 sm:p-6 my-auto max-h-[92vh] flex flex-col overflow-hidden'}>
        {/* Decorative Corner Lines */}
        {!embedded && <>
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-2xl" />
        </>}

        {/* Close Button */}
        {!embedded && <button
          onClick={onClose}
          aria-label={lang === 'en' ? 'Close shop' : 'Shop schließen'}
          className="absolute top-4 right-4 p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-all z-20 active:scale-95"
          title={lang === 'en' ? 'Close' : 'Schließen'}
        >
          <X className="w-5 h-5" />
        </button>}

        {/* Header */}
        <div className="arc-shop-header arc-shop-world-header border-b border-slate-800 pb-4 mb-4 pr-10 sm:pr-12">
          <div className="arc-shop-player">
            <div className="arc-shop-player-avatar">{playerAvatarUrl ? <img src={playerAvatarUrl} alt="" /> : <ShieldCheck />}</div>
            <div className="arc-shop-player-copy"><span className="arc-shop-eyebrow">ARC // PLAYER ECONOMY</span><strong className="arc-shop-player-name">{playerName || 'Operator'}</strong><div className="arc-shop-player-level"><b>LEVEL {playerLevel}</b><i><em style={{ width: `${playerRequiredXp > 0 ? Math.min(100, (playerCurrentXp / playerRequiredXp) * 100) : 0}%` }} /></i><small>{playerCurrentXp.toLocaleString()} / {playerRequiredXp.toLocaleString()} XP</small></div></div>
          </div>
          <div className="arc-shop-title"><ShoppingCart /><div><span className="arc-shop-eyebrow">ARC // ECONOMY DISTRICT</span><h2>SHOP</h2><p>{lang === 'en' ? 'Skins, credits and daily rewards.' : 'Skins, Credits und tägliche Belohnungen.'}</p></div></div>

          {/* Current Credits Badge */}
          <div className="arc-shop-balance bg-slate-950 border border-amber-500/40 px-3 py-1.5 flex items-center space-x-2 self-start sm:self-auto">
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="arc-shop-balance-copy text-right">
              <span className="arc-shop-balance-label text-[9px] text-slate-400 uppercase block leading-none">
                {lang === 'en' ? 'Balance' : 'Guthaben'}
              </span>
              <span className="arc-shop-balance-value text-sm font-extrabold text-amber-300">{currentCredits}</span>
              <span className="arc-shop-balance-unit">Credits</span>
            </div>
          </div>
        </div>

        <div className="arc-shop-body">
        {/* Supported Shop district navigation. */}
        <nav className="arc-shop-navigation bg-slate-950 border border-slate-800 mb-4 shrink-0" aria-label={lang === 'en' ? 'Shop categories' : 'Shop Kategorien'}>
          <button
            onClick={() => { setActiveTab('marketplace'); setSelectedCategory('all'); setSkinCollectionFilter('all'); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'marketplace' && selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>{lang === 'en' ? 'Recommended' : 'Empfohlen'}</span>
          </button>
          <button
            onClick={() => setActiveTab('exchange')}
            className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'exchange'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span>{lang === 'en' ? 'Credits' : 'Credits'}</span>
          </button>
          <div className="arc-shop-skin-nav-group">
            <button
              onClick={() => { setActiveTab('marketplace'); setSelectedCategory('skins'); setSkinCollectionFilter('all'); }}
              className={`arc-shop-nav-skins py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'marketplace' && selectedCategory === 'skins'
                  ? 'is-parent-active'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Skins</span>
            </button>
            <div className="arc-shop-skin-subnav" aria-label={lang === 'en' ? 'Skin collections' : 'Skin-Kollektionen'}>
              {SKIN_COLLECTIONS.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => {
                    setActiveTab('marketplace');
                    setSelectedCategory('skins');
                    setSkinCollectionFilter(collection.id);
                  }}
                  className={skinCollectionFilter === collection.id && selectedCategory === 'skins' ? 'is-sub-active' : ''}
                >
                  <span>{lang === 'en' ? collection.labelEn : collection.labelDe}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setActiveTab('wheel')} className={`py-2 px-3 text-xs font-bold uppercase flex items-center gap-2 ${activeTab === 'wheel' ? 'is-active' : ''}`}><RotateCw className="w-4 h-4"/><span>{lang === 'en' ? 'Spin Wheel' : 'Glücksrad'}</span></button>
        </nav>

        {/* TAB 1: RECOMMENDED + SKINS */}
        {activeTab === 'marketplace' && (
          <div className="arc-shop-catalog flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {lang === 'en' ? 'Cyber Marketplace' : 'Cyber Marktplatz'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Browse the current profile-skin collection and preview future credit packages.'
                    : 'Entdecke die aktuelle Profil-Skin-Kollektion und die Vorschau künftiger Credit-Pakete.'}
                </p>
              </div>

              <div className="text-xs text-slate-400 font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 shrink-0 self-start sm:self-auto">
                {lang === 'en' ? 'Balance:' : 'Guthaben:'} <span className="text-amber-400">{currentCredits} Cr</span>
              </div>
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
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] uppercase tracking-wider shrink-0 ml-2"
                >
                  {lang === 'en' ? 'View Credit Preview' : 'Credit-Vorschau'}
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

            {selectedCategory === 'all' && (
              <section className="arc-shop-shelf arc-shop-credit-shelf">
                <header><div><span>ECONOMY // CREDITS</span><h4>{lang === 'en' ? 'Credit packages' : 'Credit-Pakete'}</h4></div><button onClick={() => setActiveTab('exchange')}>{lang === 'en' ? 'Details' : 'Details'} <ArrowRight /></button></header>
                <div className="arc-shop-credit-packages">
                  {creditPackages.map((pkg) => <button key={pkg.internalProductId} type="button" disabled={!pkg.available || Boolean(iapPurchasingId)} onClick={() => void handleCreditPurchase(pkg.internalProductId)} title={!iapAvailable ? (nativePlatform === 'web' ? (lang === 'en' ? 'Native app required.' : 'Native App erforderlich.') : (lang === 'en' ? 'Store unavailable.' : 'Store nicht verfügbar.')) : undefined}><Coins className="arc-credit-package-icon" /><span className="arc-credit-package-copy"><strong className="arc-credit-package-amount">{pkg.credits.toLocaleString()}</strong><small className="arc-credit-package-label">Credits</small></span><b className="arc-credit-package-price">{pkg.displayPrice ?? '—'}</b></button>)}
                </div>
              </section>
            )}

            {/* Four presentation shelves over one authoritative skin catalog. */}
            {(selectedCategory === 'all' || selectedCategory === 'skins') && (
              <div className="arc-shop-skin-collections space-y-4 pt-1">
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
                    {lang === 'en' ? 'ARC Skin Collection' : 'ARC Skin-Kollektion'}
                  </span>
                </div>

                {SKIN_COLLECTIONS.filter(
                  (collection) => skinCollectionFilter === 'all' || collection.id === skinCollectionFilter
                ).map((collection) => {
                  const collectionSkins = AVAILABLE_SKINS.filter(
                    (skin) => skin.collection === collection.id
                  );
                  return (
                    <section
                      key={collection.id}
                      className={`arc-shop-category-section arc-shop-category-section--skins arc-shop-skin-collection arc-shop-skin-collection--${collection.id}`}
                    >
                      <header className="arc-shop-skin-collection-header">
                        <div>
                          <span>{lang === 'en' ? collection.labelEn : collection.labelDe}</span>
                          {(lang === 'en' ? collection.subtitleEn : collection.subtitleDe) && (
                            <small>{lang === 'en' ? collection.subtitleEn : collection.subtitleDe}</small>
                          )}
                        </div>
                        <b>{collectionSkins.length}</b>
                      </header>
                      <div className="arc-shop-product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {collectionSkins.map((skin) => {
                    const isOwned = ownedSkinIds.includes(skin.id);
                    const isEquipped = equippedSkinId === skin.id;
                    const sName = translateSkinName(skin, lang);

                    return (
                      <div
                        key={skin.id}
                        className={`arc-shop-product-card arc-shop-skin-card ${isEquipped ? 'is-equipped' : isOwned ? 'is-owned' : 'is-purchasable'} relative bg-slate-950 rounded-2xl p-3.5 border transition-all flex flex-col justify-between group ${
                          isEquipped
                            ? 'border-amber-400 bg-amber-950/20'
                            : isOwned
                            ? 'border-emerald-500/50 bg-emerald-950/10'
                            : 'border-slate-800 hover:border-amber-500/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="arc-shop-skin-tier text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border">
                              {skin.tier === 'standard'
                                ? 'Standard'
                                : skin.tier === 'premium'
                                ? (lang === 'en' ? 'Premium' : 'Hochwertig')
                                : (lang === 'en' ? 'Extremely Epic' : 'Extrem episch')}
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
                            <div className="arc-shop-product-art w-full h-32 rounded-xl overflow-hidden border border-slate-800 mb-2.5 relative group-hover:border-amber-500/50 transition-all bg-slate-900">
                              <img
                                src={skin.avatarUrl}
                                alt={sName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter contrast-125 brightness-90"
                              />

                              <button
                                onClick={() => setPreviewSkin(skin)}
                                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/60 transition-all opacity-0 group-hover:opacity-100"
                                title={lang === 'en' ? 'Preview' : 'Vorschau'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <h4 className="text-sm font-bold text-slate-100 mb-1">{sName}</h4>
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
                              disabled={purchasingSkinId !== null}
                              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-wait text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 active:scale-95"
                            >
                              {purchasingSkinId === skin.id ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
                              <span>
                                {purchasingSkinId === skin.id
                                  ? (lang === 'en' ? 'Verifying…' : 'Wird geprüft…')
                                  : (lang === 'en' ? `Buy (${skin.price} Cr)` : `Kaufen (${skin.price} Cr)`)}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: GLÜCKSRAD */}
        {activeTab === 'wheel' && (
          <div className="arc-shop-economy-system arc-shop-wheel flex-1 overflow-y-auto pr-1 space-y-4 flex flex-col items-center justify-between text-center py-2">
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
              <div className="absolute -top-3 z-20 text-amber-400">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-400" />
              </div>

              <div
                className="w-full h-full rounded-full border-4 border-amber-500/80 relative overflow-hidden transition-transform ease-out"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transitionDuration: isSpinning ? '3.5s' : '0s',
                }}
              >
                <div className="absolute inset-0 bg-amber-950 flex items-center justify-center">
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
                    ? 'bg-amber-950/90 border border-amber-500/80 text-amber-300'
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
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
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
          <div className="arc-shop-economy-system arc-shop-exchange flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="text-center max-w-lg mx-auto mb-2">
              <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block mb-0.5">
                CURRENCY STORE // REAL MONEY EXCHANGE
              </span>
              <h3 className="text-base font-bold text-slate-100">
                {lang === 'en' ? 'Top Up Credit Packages' : 'Credit-Pakete aufladen'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'en'
                  ? 'Purchase credits for the current ARC skin collection.'
                  : 'Kaufe Credits für die aktuelle ARC Skin-Kollektion.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{lang === 'en'
                ? (iapAvailable ? 'Prices and availability are provided by your native store.' : nativePlatform === 'web' ? 'Credit purchases require the native mobile app. No web checkout is available.' : 'Store unavailable. Try again later.')
                : (iapAvailable ? 'Preise und Verfügbarkeit werden vom nativen Store bereitgestellt.' : nativePlatform === 'web' ? 'Credit-Käufe erfordern die native Mobile-App. Es gibt keinen Web-Checkout.' : 'Store nicht verfügbar. Versuche es später erneut.')}</span>
            </div>

            {iapLoading && <div className="text-center text-xs text-slate-400">{lang === 'en' ? 'Loading products…' : 'Produkte werden geladen…'}</div>}
            {iapMessage && <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs">{iapMessage}</div>}
            {iapError && <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs flex justify-between gap-3"><span>{iapError}</span><button onClick={() => void loadCreditProducts()}>{lang === 'en' ? 'Try again' : 'Erneut versuchen'}</button></div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.internalProductId}
                  className={`arc-shop-exchange-package relative bg-slate-950 p-4 rounded-2xl border cursor-default transition-all flex flex-col justify-between group ${
                    pkg.positioning === 'popular'
                      ? 'border-amber-500/80 bg-amber-950/40'
                      : pkg.positioning === 'best-value'
                      ? 'border-cyan-500/80 bg-cyan-950/40'
                      : 'border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  {pkg.positioning === 'popular' && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                      {lang === 'en' ? 'Popular' : 'Beliebt'}
                    </div>
                  )}
                  {pkg.positioning === 'best-value' && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                      {lang === 'en' ? 'Best Value' : 'Bester Wert'}
                    </div>
                  )}

                  <div className="arc-shop-exchange-package-copy text-center pt-2">
                    <span className="arc-shop-exchange-package-title text-[11px] text-slate-400 uppercase tracking-widest block mb-1 font-bold">
                      {pkg.title}
                    </span>
                    <div className="arc-shop-exchange-package-value flex items-center justify-center space-x-1.5 text-amber-400 my-2">
                      <Coins className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform" />
                      <span className="arc-credit-package-amount text-3xl font-black text-slate-100">{pkg.credits}</span>
                    </div>
                    <span className="arc-credit-package-label text-xs text-amber-400 font-bold block">Credits</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
                    <span className="arc-credit-package-price text-xl font-extrabold text-slate-100 block mb-2">{pkg.displayPrice ?? '—'}</span>
                    <button
                      type="button"
                      disabled={!pkg.available || Boolean(iapPurchasingId)}
                      onClick={() => void handleCreditPurchase(pkg.internalProductId)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-1"
                    >
                      <span>{iapPurchasingId === pkg.internalProductId
                        ? (lang === 'en' ? 'Purchase pending' : 'Kauf läuft')
                        : pkg.available ? (lang === 'en' ? 'Buy' : 'Kaufen')
                          : iapAvailable || nativePlatform !== 'web' ? (lang === 'en' ? 'Purchase unavailable' : 'Kauf nicht verfügbar')
                            : (lang === 'en' ? 'Native app required' : 'Native App erforderlich')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* SKIN DETAIL PREVIEW MODAL */}
      {previewSkin && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/95 animate-fadeIn font-mono">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-6">
            <button
              onClick={() => setPreviewSkin(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-amber-400 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  {previewSkin.tier === 'standard'
                    ? 'Standard'
                    : previewSkin.tier === 'premium'
                    ? (lang === 'en' ? 'Premium' : 'Hochwertig')
                    : (lang === 'en' ? 'Extremely Epic' : 'Extrem episch')}
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

              <div className="pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">
                  {lang === 'en' ? 'Price:' : 'Preis:'}
                </span>
                <span className="text-lg font-black text-amber-400">
                  {previewSkin.price} Credits
                </span>
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
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase"
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

    </div>
  );
};
