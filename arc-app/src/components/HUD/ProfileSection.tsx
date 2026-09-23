import React from 'react';
import { UserProfile, StatAttribute } from '../../types';
import { Activity, Boxes, Coins, ShoppingBag, Zap } from 'lucide-react';
import { Language, t, translateStatName } from '../../utils/i18n';
import { DEFAULT_AVATAR_URL } from '../../data/avatars';

interface ProfileSectionProps {
  profile: UserProfile; stats: StatAttribute[]; credits?: number; level?: number; lang?: Language;
  currentLevelXp?: number; requiredLevelXp?: number;
  onOpenAppHub?: () => void; onOpenShop?: () => void; userRank?: number; totalPlayers?: number;
  equippedTitle?: string | null;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile, stats, credits = 0, level, currentLevelXp = 0, requiredLevelXp = 0, lang = 'en', onOpenAppHub, onOpenShop,
  userRank, totalPlayers,
  equippedTitle = null,
}) => {
  const totalLvl = level ?? 1;
  const levelProgress = requiredLevelXp > 0 ? Math.min(100, Math.max(0, (currentLevelXp / requiredLevelXp) * 100)) : 0;
  const percentile = userRank !== undefined && totalPlayers !== undefined
    ? (userRank / Math.max(totalPlayers, 1)) * 100
    : null;
  const frameClass = profile.showAvatarFrame === false ? 'border-slate-700' : userRank === 1
    ? 'border-fuchsia-400'
    : percentile !== null && percentile <= 10 ? 'border-amber-400'
    : 'border-cyan-500/60';

  return (
    <section className="arc-identity-hud arc-v10-profile" aria-label={lang === 'en' ? 'Character and attributes' : 'Charakter und Attribute'}>
      <div className="arc-identity-hero">
        <div className="arc-identity-scanline" />
        <div className={`arc-avatar-frame ${frameClass}`}>
          <img src={profile.avatarUrl || DEFAULT_AVATAR_URL} alt={profile.name || 'ARC Operator'} className="h-full w-full object-cover" />
          <div className="arc-avatar-shade" />
          <span className="arc-level-chip">LVL {totalLvl}</span>
        </div>
        <div className="arc-identity-copy">
          <span className="arc-kicker">ARC // ACTIVE OPERATOR</span>
          <h1 className="arc-display" title={profile.name || 'OPERATOR'}>{profile.name || 'OPERATOR'}</h1>
          {equippedTitle && <span className="arc-equipped-title">{equippedTitle}</span>}
          <span className="arc-xp-label">{currentLevelXp.toLocaleString()} / {requiredLevelXp.toLocaleString()} XP</span>
          <div className="arc-level-track" aria-label={`${currentLevelXp} / ${requiredLevelXp} XP`}><span style={{ width: `${levelProgress}%` }} /></div>
          <div className="arc-identity-meta">
            <span><Activity /> LOCAL SYSTEM ACTIVE</span>
            {(profile.weight || profile.height) && <span>{profile.weight ? `${profile.weight} KG` : ''}{profile.weight && profile.height ? ' / ' : ''}{profile.height ? `${profile.height} CM` : ''}</span>}
          </div>
        </div>
        <div className="arc-identity-actions">
          <button onClick={onOpenAppHub} className="arc-identity-action"><Boxes /><span>{t('appHubTitle', lang)}</span></button>
          <button onClick={onOpenShop} className="arc-identity-action arc-identity-action--gold"><ShoppingBag /><span>Shop</span></button>
          <button onClick={onOpenShop} className="arc-credit-plate" aria-label={`${credits} credits`}><Coins /><strong>{credits}</strong><small>CR</small></button>
        </div>
      </div>
      <div className="arc-attributes-panel">
        <div className="arc-section-heading">
          <div><span className="arc-kicker">CORE PROGRESSION</span><h2 className="arc-display">{lang === 'en' ? 'Attributes' : 'Attribute'}</h2></div>
          <Zap aria-hidden="true" />
        </div>
        <div className="arc-attribute-grid">
          {stats.map((stat, index) => {
            const value = Math.min(100, Math.max(0, stat.value));
            return (
              <article className="arc-attribute-card" key={stat.id} style={{ '--arc-stat-index': index } as React.CSSProperties}>
                <span className="arc-attribute-icon" aria-hidden="true">{stat.emoji}</span>
                <div className="arc-attribute-copy"><span>{translateStatName(stat.name, lang)}</span><div className="arc-attribute-track"><i style={{ width: `${value}%` }} /></div></div>
                <strong>{value}<small>%</small></strong>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
