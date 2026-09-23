import React from 'react';
import { Boxes, ClipboardCheck, Home, Menu, ShoppingCart } from 'lucide-react';
import { Language, t } from '../../utils/i18n';

interface BottomBarProps {
  lang?: Language; onGoHome: () => void;
  onOpenMissions: () => void; onOpenAppHub: () => void; onOpenShop?: () => void; onOpenMenu: () => void;
  activeDestination?: 'home' | 'missions' | 'appHub' | 'shop';
}

export const BottomBar: React.FC<BottomBarProps> = ({ lang = 'en', onGoHome, onOpenMissions, onOpenAppHub, onOpenShop, onOpenMenu, activeDestination = 'home' }) => {
  const nav = [
    { id: 'home', label: lang === 'de' ? 'Übersicht' : 'Home', icon: Home, action: onGoHome },
    { id: 'missions', label: lang === 'de' ? 'Missionen' : 'Missions', icon: ClipboardCheck, action: onOpenMissions },
    { id: 'appHub', label: t('appHubTitle', lang), icon: Boxes, action: onOpenAppHub },
    { id: 'shop', label: t('shop', lang), icon: ShoppingCart, action: onOpenShop, accent: 'gold' },
    { id: 'menu', label: lang === 'de' ? 'Menü' : 'Menu', icon: Menu, action: onOpenMenu },
  ];
  return (
    <nav className="arc-dock arc-v10-dock" aria-label={lang === 'de' ? 'Hauptnavigation' : 'Primary navigation'}>
      <div className="arc-primary-navigation">
        {nav.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} onClick={item.action} className={`arc-nav-destination ${activeDestination === item.id ? 'is-active' : ''} ${item.accent === 'gold' ? 'is-gold' : ''}`}><Icon /><span>{item.label}</span></button>;
        })}
      </div>
    </nav>
  );
};
