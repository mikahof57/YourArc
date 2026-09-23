import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Cable, CircleDashed, Download, Hexagon, Radio } from 'lucide-react';
import type { Language } from '../../utils/i18n';
import { t, translateStatName } from '../../utils/i18n';
import { applyCompanionRuntimeState, localizeCompanionApp, type ArcCompanionAppDefinition } from '../../features/appHub/appHubCatalog';
import { localAppHubService } from '../../features/appHub/localAppHubService';
import type { ArcCompanionAppState } from '../../features/companion/companionTypes';
import { localCompanionBridgeService } from '../../services/localSaveService';

const statusIcon = {
  coming_soon: CircleDashed,
  available: Download,
  installed: Cable,
  connected: Radio,
};

function statusLabel(status: ArcCompanionAppDefinition['status'], lang: Language): string {
  if (status === 'available') return t('appHubStatus_available', lang);
  if (status === 'installed') return t('appHubStatus_installed', lang);
  if (status === 'connected') return t('appHubStatus_connected', lang);
  return t('appHubStatus_coming_soon', lang);
}

function actionLabel(status: ArcCompanionAppDefinition['status'], lang: Language): string {
  if (status === 'available') return t('appHubAction_available', lang);
  if (status === 'installed') return t('appHubAction_installed', lang);
  if (status === 'connected') return t('appHubAction_connected', lang);
  return t('appHubComingSoonAction', lang);
}

export const AppHubPage: React.FC<{
  lang: Language;
  apps?: readonly ArcCompanionAppDefinition[];
  companionStates?: readonly ArcCompanionAppState[];
}> = ({
  lang,
  apps = localAppHubService.getApps(),
  companionStates,
}) => {
  const [persistedStates, setPersistedStates] = useState<readonly ArcCompanionAppState[]>(companionStates ?? []);
  useEffect(() => {
    if (companionStates) {
      setPersistedStates(companionStates);
      return;
    }
    void localCompanionBridgeService.getCompanionState().then(setPersistedStates).catch(() => undefined);
  }, [companionStates]);
  const resolvedApps = useMemo(() => apps.map((app) => applyCompanionRuntimeState(
    app,
    persistedStates.find((state) => state.appId === app.appId),
  )), [apps, persistedStates]);
  return (
  <main className="arc-destination-page arc-app-hub-page">
    <header className="arc-destination-hero arc-app-hub-hero">
      <div className="arc-destination-emblem"><Boxes /></div>
      <div className="arc-destination-heading">
        <span>ARC // LOCAL ECOSYSTEM</span>
        <h1>{t('appHubTitle', lang)}</h1>
        <p>{t('appHubSubtitle', lang)}</p>
      </div>
      <div className="arc-app-hub-count"><strong>06</strong><span>{t('appHubCompanionSlots', lang)}</span></div>
    </header>

    <section className="arc-app-hub-intro">
      <span>{t('appHubLocalProtocol', lang)}</span>
      <p>{t('appHubLocalExplanation', lang)}</p>
    </section>

    <section className="arc-app-hub-grid" aria-label={t('appHubCompanionSlots', lang)}>
      {[...resolvedApps].sort((a, b) => a.sortOrder - b.sortOrder).map((definition) => {
        const app = localizeCompanionApp(definition, lang);
        const StatusIcon = statusIcon[app.status];
        return (
          <article className={`arc-app-hub-card status-${app.status}`} key={app.slotId} data-app-id={app.appId}>
            <header>
              <span>{t('appHubSlot', lang)} {String(app.sortOrder).padStart(2, '0')}</span>
              <strong><StatusIcon />{statusLabel(app.status, lang)}</strong>
            </header>
            <div className="arc-app-hub-identity">
              <div className="arc-app-hub-placeholder-icon" aria-hidden="true"><Hexagon /><Boxes /></div>
              <div><small>{t('appHubPlaceholderLabel', lang)}</small><h2>{app.displayName}</h2></div>
            </div>
            <div className="arc-app-hub-stat"><span>{t('appHubAssociatedStat', lang)}</span><strong>{translateStatName(app.associatedStat, lang)}</strong></div>
            <p>{app.shortDescription}</p>
            <footer>
              <button type="button" disabled>
                {actionLabel(app.status, lang)}
              </button>
            </footer>
          </article>
        );
      })}
    </section>
  </main>
  );
};
