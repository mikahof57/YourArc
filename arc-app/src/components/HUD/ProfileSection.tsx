import React from 'react';
import { UserProfile, StatAttribute } from '../../types';
import { Zap, Users, ShoppingCart, Coins } from 'lucide-react';
import { Language, t, translateStatName } from '../../utils/i18n';

interface ProfileSectionProps {
  profile: UserProfile;
  stats: StatAttribute[];
  credits?: number;
  lang?: Language;
  onOpenCommunity?: () => void;
  onOpenShop?: () => void;
  userRank?: number;
  totalPlayers?: number;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  stats,
  credits = 100,
  lang = 'en',
  onOpenCommunity,
  onOpenShop,
  userRank = 1,
  totalPlayers = 11,
}) => {
  const genderSymbol = profile.gender === 'f' ? '♀' : profile.gender === 'm' ? '♂' : '⚥';
  const genderColor = profile.gender === 'f' ? 'text-pink-400' : 'text-cyan-400';
  const totalLvl = Math.max(1, Math.floor(stats.reduce((acc, s) => acc + s.value, 0) / (stats.length || 1)));

  // Avatar Ranking Frame Calculation
  const isFrameEnabled = profile.showAvatarFrame !== false;
  const percentile = (userRank / (totalPlayers || 1)) * 100;

  let frameBorderClass = 'border border-slate-800/80'; // default when frame is toggled off

  if (isFrameEnabled) {
    if (userRank === 1) {
      frameBorderClass =
        'border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8),0_0_10px_rgba(236,72,153,0.5)] ring-2 ring-fuchsia-400/60';
    } else if (percentile <= 10) {
      frameBorderClass =
        'border-2 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.8)] ring-2 ring-yellow-400/40';
    } else if (percentile <= 20) {
      frameBorderClass =
        'border-2 border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.7)] ring-2 ring-slate-200/30';
    } else {
      frameBorderClass = 'border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]';
    }
  }

  return (
    <div
      className="w-full bg-slate-900/90 border rounded-xl p-3.5 sm:p-5 backdrop-blur-md relative font-mono overflow-hidden transition-all duration-500"
      style={{
        borderColor: 'var(--theme-c1)',
        boxShadow: '0 0 25px var(--theme-glow1)',
      }}
    >
      {/* Background cyber grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

      <div className="flex flex-row items-start gap-3 sm:gap-5 relative z-10">
        {/* Top-Left Profile Card Container */}
        <div className="flex flex-col items-center shrink-0 w-28 sm:w-44 bg-slate-950/80 p-2.5 sm:p-3 rounded-lg border border-slate-800 shadow-inner">
          {/* Profile Picture Avatar (Top Left) with Ranking Frame */}
          <div className={`relative group w-20 h-20 sm:w-28 sm:h-28 rounded-lg overflow-hidden ${frameBorderClass} transition-all duration-300`}>
            <img
              src={profile.avatarUrl || 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80'}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            
            {/* Level Badge Overlay */}
            <div
              className="absolute bottom-1 right-1 text-slate-100 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border z-10 transition-all duration-500"
              style={{
                backgroundColor: 'var(--theme-glow1)',
                borderColor: 'var(--theme-c1)',
                color: 'var(--theme-c1)',
              }}
            >
              LVL {totalLvl}
            </div>
          </div>

          {/* Name & Gender */}
          <div className="w-full text-center mt-2">
            <div className="text-[11px] sm:text-xs text-slate-400 tracking-wider flex items-center justify-center space-x-1">
              <span className="font-bold text-slate-100 uppercase tracking-widest truncate max-w-[80px] sm:max-w-[120px]">
                {profile.name || 'OPERATOR'}
              </span>
              <span className={`text-xs sm:text-sm font-bold ${genderColor}`}>{genderSymbol}</span>
            </div>
            {profile.age && (
              <span className="text-[9px] sm:text-[10px] text-slate-500 block">
                {lang === 'en' ? 'AGE:' : 'ALTER:'} {profile.age}
              </span>
            )}
          </div>

          {/* Weight & Height */}
          {(profile.weight || profile.height) ? (
            <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 w-full flex items-center justify-around text-[9px] sm:text-[10px] text-slate-400 tracking-tight">
              {profile.weight && (
                <span className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                  <strong className="text-cyan-400">{profile.weight}</strong> kg
                </span>
              )}
              {profile.height && (
                <span className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                  <strong className="text-cyan-400">{profile.height}</strong> cm
                </span>
              )}
            </div>
          ) : (
            <div className="mt-1 text-[9px] text-slate-600 italic">SYSTEM ID</div>
          )}

          {/* Community Button directly under Profile Picture Card */}
          <button
            onClick={onOpenCommunity}
            className="w-full mt-2.5 bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center space-x-1 shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="uppercase tracking-wider">Community</span>
          </button>

          {/* Shop Button & Credits Row (Half Width Shop Button + Current Credits beside it) */}
          <div className="w-full mt-2 flex items-center space-x-1.5">
            <button
              onClick={onOpenShop}
              className="w-1/2 bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 hover:from-amber-900 hover:to-yellow-900 border border-amber-500/50 hover:border-amber-400 text-amber-300 py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center space-x-1 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all active:scale-95 shrink-0"
              title="Shop"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="uppercase tracking-wider truncate">Shop</span>
            </button>

            <div
              onClick={onOpenShop}
              className="w-1/2 bg-slate-950/90 border border-amber-500/30 hover:border-amber-400/60 rounded-lg py-1.5 px-1 flex items-center justify-center space-x-1 cursor-pointer transition-all text-amber-300 shadow-inner group shrink-0"
              title="Credits"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold tracking-tight text-amber-300 truncate">
                {credits} <span className="hidden sm:inline">Cr</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status Attributes - Directly to the Right of Profile Picture */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-cyan-400 border-b border-slate-800 pb-1.5">
            <span className="font-bold tracking-widest flex items-center space-x-1.5 truncate">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{t('statusAttributes', lang)}</span>
            </span>
            <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">{t('target100', lang)}</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {stats.map((st) => {
              const pct = Math.min(100, Math.max(1, st.value));
              return (
                <div key={st.id} className="bg-slate-950/70 p-1.5 sm:p-2 rounded border border-slate-800 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="text-xs sm:text-sm shrink-0">{st.emoji}</span>
                      <span className="font-bold text-slate-200 tracking-wide truncate text-[11px] sm:text-xs">
                        {translateStatName(st.name, lang)}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400 text-[11px] sm:text-xs shrink-0 ml-1">
                      {pct}%
                    </span>
                  </div>

                  {/* Fine Line Cyber Progress Bar */}
                  <div className="w-full bg-slate-900 h-1.5 sm:h-2 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                      style={{ width: `${pct}%` }}
                    />
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
