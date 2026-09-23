import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Award, Check, ClipboardCheck, Clock3, Coins, Database, LockKeyhole, Plus, RotateCcw, Shield, Trophy, X } from 'lucide-react';
import { Language } from '../../utils/i18n';
import {
  MissionDefinition as MissionCatalogItem,
  MissionDifficulty,
  MissionRun,
  PersonalMissionsPayload,
} from '../../features/missions/missionTypes';
import { calculateAchievementProgress } from '../../features/achievements/achievementEngine';
import type { AchievementDefinition, AchievementSnapshot, UserTitle } from '../../features/achievements/achievementTypes';
import { ACHIEVEMENT_CATALOG, isActiveAchievement } from '../../features/achievements/achievementCatalog';
import {
  getLocalizedTitleName,
  localizeAchievement,
  localizeAchievementProgress,
  localizeAchievementRarity,
  localizeAchievementReward,
  localizeAchievementSection,
  localizeAchievementState,
} from '../../features/achievements/achievementLocalization';
import { getTodayDateString } from '../../utils/storage';
import { localObjectivesService } from '../../services/localSaveService';

type ObjectiveView = 'missions' | 'achievements';

interface MissionsPageProps {
  lang: Language;
  level: number;
  currentXp: number;
  requiredXp: number;
  initialView?: ObjectiveView;
  onCreditBalanceChange: (balance: number) => void;
}

interface ObjectiveViewProps {
  isEn: boolean;
}

const ObjectiveTabs: React.FC<{
  activeView: ObjectiveView;
  isEn: boolean;
  onChange: (view: ObjectiveView) => void;
}> = ({ activeView, isEn, onChange }) => (
  <nav className="arc-objective-tabs" aria-label={isEn ? 'Objective systems' : 'Zielsysteme'}>
    <button
      type="button"
      className={activeView === 'missions' ? 'is-active' : ''}
      aria-current={activeView === 'missions' ? 'page' : undefined}
      onClick={() => onChange('missions')}
    >
      <ClipboardCheck />
      <span>{isEn ? 'Missions' : 'Missionen'}</span>
    </button>
    <button
      type="button"
      className={activeView === 'achievements' ? 'is-active' : ''}
      aria-current={activeView === 'achievements' ? 'page' : undefined}
      onClick={() => onChange('achievements')}
    >
      <Trophy />
      <span>Achievements</span>
    </button>
  </nav>
);

const difficultyLabels: Record<MissionDifficulty, { de: string; en: string }> = {
  easy: { de: 'Leicht', en: 'Easy' },
  medium: { de: 'Mittel', en: 'Medium' },
  hard: { de: 'Schwer', en: 'Hard' },
  epic: { de: 'Episch', en: 'Epic' },
};

function missionTitle(mission: MissionCatalogItem, isEn: boolean) {
  return isEn ? mission.title_en : mission.title_de;
}

function missionObjective(mission: MissionCatalogItem, isEn: boolean) {
  return isEn ? mission.objective_en : mission.objective_de;
}

const ActiveMissionCard: React.FC<{
  run: MissionRun;
  isEn: boolean;
  pending: boolean;
  settlementStatus?: string;
  onCancel: () => void;
  onAcknowledge: () => void;
}> = ({ run, isEn, pending, settlementStatus, onCancel, onAcknowledge }) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const current = run.progress?.current ?? 0;
  const target = run.progress?.target ?? 1;
  const percent = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  const completed = run.state === 'completed';
  const expired = run.state === 'expired';
  return (
    <article className={`arc-active-mission-card difficulty-${run.mission.difficulty} state-${run.state}`}>
      <header>
        <span>{difficultyLabels[run.mission.difficulty][isEn ? 'en' : 'de']}</span>
        <small>#{String(run.mission.mission_id).padStart(2, '0')}</small>
      </header>
      <h3>{missionTitle(run.mission, isEn)}</h3>
      <p>{missionObjective(run.mission, isEn)}</p>
      <div className="arc-mission-progress-copy"><strong>{current.toLocaleString()} / {target.toLocaleString()}</strong><span>{completed ? (isEn ? 'COMPLETED' : 'ABGESCHLOSSEN') : expired ? (isEn ? 'EXPIRED' : 'ABGELAUFEN') : (isEn ? 'PROGRESS' : 'FORTSCHRITT')}</span></div>
      <div className="arc-mission-progress-track"><i style={{ width: `${percent}%` }} /></div>
      <footer>
        <span><Coins />{run.reward_credits_snapshot}</span>
        {run.deadline_arc_day && <span><Clock3 />{run.deadline_arc_day}</span>}
        {run.mission.repeat_interval_days && <span><RotateCcw />{run.mission.repeat_interval_days}d</span>}
      </footer>
      {completed && settlementStatus !== 'settled' && (
        <div className={`arc-mission-reward-state is-${settlementStatus ?? 'pending'}`}>
          <strong>{settlementStatus === 'failed_terminal'
            ? (isEn ? 'REWARD COULD NOT BE VERIFIED' : 'BELOHNUNG KONNTE NICHT VERIFIZIERT WERDEN')
            : (isEn ? 'REWARD PENDING' : 'BELOHNUNG AUSSTEHEND')}</strong>
          {settlementStatus !== 'failed_terminal' && <span>{isEn
            ? 'The local reward transaction will be retried safely.'
            : 'Die lokale Belohnungstransaktion wird sicher erneut versucht.'}</span>}
        </div>
      )}
      {completed && settlementStatus === 'settled' && <div className="arc-mission-reward-state is-settled"><strong>{isEn ? 'REWARD SETTLED' : 'BELOHNUNG GUTGESCHRIEBEN'}</strong><span>+{run.reward_credits_snapshot} Credits</span></div>}
      {completed || expired ? (
        <button type="button" disabled={pending} onClick={onAcknowledge}><Check />{isEn ? 'Clear slot' : 'Slot freigeben'}</button>
      ) : confirmCancel ? (
        <div className="arc-mission-cancel-confirm">
          <span>{isEn ? 'Abandon this run?' : 'Diesen Lauf abbrechen?'}</span>
          <button type="button" disabled={pending} onClick={onCancel}>{isEn ? 'Confirm' : 'Bestätigen'}</button>
          <button type="button" disabled={pending} onClick={() => setConfirmCancel(false)}>{isEn ? 'Keep' : 'Behalten'}</button>
        </div>
      ) : (
        <button type="button" className="is-secondary" disabled={pending} onClick={() => setConfirmCancel(true)}><X />{isEn ? 'Abandon' : 'Abbrechen'}</button>
      )}
    </article>
  );
};

const MissionsView: React.FC<ObjectiveViewProps & { onCreditBalanceChange: (balance: number) => void }> = ({ isEn, onCreditBalanceChange }) => {
  const catalogRef = useRef<HTMLElement>(null);
  const [payload, setPayload] = useState<PersonalMissionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await localObjectivesService.getMissions(getTodayDateString());
      setPayload(next);
      setError(null);
      onCreditBalanceChange(next.credit_balance);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (isEn ? 'Local Mission state is unavailable.' : 'Der lokale Missionsstatus ist nicht verfügbar.'));
    }
  }, [isEn, onCreditBalanceChange]);

  useEffect(() => { void refresh(); }, [refresh]);

  const mutate = async (key: string, action: () => Promise<void>) => {
    if (pendingKey) return;
    setPendingKey(key);
    try { await action(); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : (isEn ? 'Mission action failed.' : 'Missionsaktion fehlgeschlagen.')); }
    finally { setPendingKey(null); }
  };

  const runsBySlot = new Map<number, MissionRun>((payload?.active_runs ?? []).map((run) => [run.slot_index, run]));
  const activeCount = payload?.active_runs.length ?? 0;
  const difficulties: MissionDifficulty[] = ['easy', 'medium', 'hard', 'epic'];

  return (
    <div className="arc-personal-missions arc-objective-view">
      <section className="arc-active-missions" aria-labelledby="active-missions-title">
        <header className="arc-mission-panel-heading">
          <div><Shield /><span>ARC // PERSONAL OBJECTIVE SLOTS</span><h2 id="active-missions-title">{isEn ? 'Active Missions' : 'Aktive Missionen'}</h2></div>
          <strong>{activeCount} / 6 {isEn ? 'ACTIVE' : 'AKTIV'}</strong>
        </header>
        {error && <div className="arc-mission-error" role="alert">{error}<button type="button" onClick={() => void refresh()}>{isEn ? 'Retry' : 'Erneut versuchen'}</button></div>}
        <div className="arc-active-mission-grid">
          {Array.from({ length: 6 }, (_, index) => {
            const slot = index + 1;
            const run = runsBySlot.get(slot);
            const claim = payload?.reward_claims.find((item) => item.missionRunId === run?.run_id);
            return run ? (
              <ActiveMissionCard key={run.run_id} run={run} isEn={isEn} pending={pendingKey === run.run_id} settlementStatus={claim?.status}
                onCancel={() => void mutate(run.run_id, async () => {
                  const save = await localObjectivesService.cancelMission(run.run_id, { arcDay: getTodayDateString() });
                  onCreditBalanceChange(save.economy.credits);
                })}
                onAcknowledge={() => void mutate(run.run_id, async () => {
                  const save = await localObjectivesService.acknowledgeMission(run.run_id);
                  onCreditBalanceChange(save.economy.credits);
                })} />
            ) : (
              <button key={slot} type="button" className="arc-empty-mission-slot" onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <Plus /><span>{isEn ? 'Add Mission' : 'Mission hinzufügen'}</span><small>{isEn ? `Slot ${slot}` : `Slot ${slot}`}</small>
              </button>
            );
          })}
        </div>
        {!!payload?.reward_claims.filter((claim) => claim.status !== 'settled').length && (
          <section className="arc-mission-pending-rewards" aria-label={isEn ? 'Pending Mission rewards' : 'Ausstehende Missionsbelohnungen'}>
            <h3>{isEn ? 'Pending rewards' : 'Ausstehende Belohnungen'}</h3>
            {payload.reward_claims.filter((claim) => claim.status !== 'settled').map((claim) => (
              <div key={claim.settlementId}>
                <span>Mission #{String(claim.missionId).padStart(2, '0')} · {claim.rewardCreditsSnapshot} Credits</span>
                <strong>{claim.status === 'failed_terminal'
                  ? (isEn ? 'Could not be verified' : 'Konnte nicht verifiziert werden')
                  : (isEn ? 'Will retry automatically' : 'Wird automatisch erneut versucht')}</strong>
              </div>
            ))}
          </section>
        )}
      </section>

      <section ref={catalogRef} className="arc-available-missions" aria-labelledby="available-missions-title">
        <header className="arc-mission-panel-heading">
          <div><Database /><span>ARC // APP-NATIVE MISSION CATALOG</span><h2 id="available-missions-title">{isEn ? 'Available Missions' : 'Verfügbare Missionen'}</h2></div>
          {activeCount >= 6 && <strong>{isEn ? '6 / 6 MISSIONS ACTIVE' : '6 / 6 MISSIONEN AKTIV'}</strong>}
        </header>
        {!payload && !error && <div className="arc-mission-loading">{isEn ? 'Loading local Mission state…' : 'Lokaler Missionsstatus wird geladen…'}</div>}
        {payload && difficulties.map((difficulty) => {
          const missions = payload.available.filter((mission) => mission.difficulty === difficulty);
          return (
            <section key={difficulty} className={`arc-mission-difficulty-section difficulty-${difficulty}`}>
              <header><span>{difficultyLabels[difficulty][isEn ? 'en' : 'de']}</span><small>{missions.length}</small></header>
              {missions.length > 0 ? <div className="arc-available-mission-grid">{missions.map((mission) => (
                <article key={mission.mission_id} className="arc-available-mission-card">
                  <span>#{String(mission.mission_id).padStart(2, '0')}</span>
                  <h3>{missionTitle(mission, isEn)}</h3>
                  <p>{missionObjective(mission, isEn)}</p>
                  <footer><span><Coins />{mission.reward_credits}</span>{mission.repeat_interval_days ? <span><RotateCcw />{mission.repeat_interval_days}d</span> : <span><LockKeyhole />{isEn ? 'ONE-TIME' : 'EINMALIG'}</span>}</footer>
                  <button type="button" disabled={activeCount >= 6 || pendingKey !== null} onClick={() => void mutate(`mission-${mission.mission_id}`, async () => {
                    const save = await localObjectivesService.activateMission(mission.mission_id, { arcDay: getTodayDateString() });
                    onCreditBalanceChange(save.economy.credits);
                  })}>
                    <Plus />{activeCount >= 6 ? (isEn ? 'Slots full' : 'Slots voll') : (isEn ? 'Activate' : 'Aktivieren')}
                  </button>
                </article>
              ))}</div> : <p className="arc-mission-section-empty">{isEn ? 'No eligible Missions in this group.' : 'Keine verfügbaren Missionen in dieser Gruppe.'}</p>}
            </section>
          );
        })}
      </section>
    </div>
  );
};

const AchievementsView: React.FC<ObjectiveViewProps> = ({ isEn }) => {
  const language: Language = isEn ? 'en' : 'de';
  const [data,setData]=useState<{snapshot:AchievementSnapshot;catalog:readonly AchievementDefinition[];trustedUnlocked:number[];local:{locallyUnlocked:number[];claims:Array<{achievementId:number;status:string}>};titles:UserTitle[];equippedTitle:string|null}|null>(null);
  const [rarity,setRarity]=useState<string>('all');
  const refresh=useCallback(async()=>{await localObjectivesService.evaluateAchievements();const save=await localObjectivesService.load();if(!save)return;setData({snapshot:save.achievements.snapshot!,catalog:ACHIEVEMENT_CATALOG,trustedUnlocked:[],local:save.achievements,titles:save.titles.owned,equippedTitle:save.titles.equippedTitleId});},[]);
  useEffect(()=>{void refresh();},[refresh]);
  if(!data)return <section className="arc-achievements-command arc-objective-view"><div className="arc-mission-loading">Achievements…</div></section>;
  const unlocked=new Set([...data.trustedUnlocked,...data.local.locallyUnlocked]);
  const activeCatalog=data.catalog.filter(isActiveAchievement);
  const activeUnlocked=activeCatalog.filter(item=>unlocked.has(item.achievement_id)).length;
  const sections=Array.from(new Set(activeCatalog.map(x=>x.section))) as AchievementDefinition['section'][];
  return <section className="arc-achievements-command arc-objective-view">
    <header className="arc-achievements-command__identity"><Award/><div><span>ARC // PRESTIGE ARCHIVE</span><h2>{isEn?'Achievement Archive':'Achievement-Archiv'}</h2><p>{activeUnlocked} / {activeCatalog.length} {isEn?'unlocked':'freigeschaltet'}</p></div></header>
    <div className="arc-achievement-filters">{(['all','common','rare','epic','legendary'] as const).map(value=><button className={rarity===value?'is-active':''} key={value} onClick={()=>setRarity(value)}>{value==='all'?(isEn?'All':'Alle'):localizeAchievementRarity(value,language)}</button>)}</div>
    {data.titles.length>0&&<section className="arc-title-selector"><h3>{isEn?'Equipped title':'Ausgerüsteter Titel'}</h3><select value={data.equippedTitle??''} onChange={async e=>{await localObjectivesService.equipTitle(e.target.value||null);window.dispatchEvent(new Event('arc-title-changed'));await refresh();}}><option value="">{isEn?'No title':'Kein Titel'}</option>{data.titles.map(title=><option key={title.title_id} value={title.title_id}>{getLocalizedTitleName(title.title_id,language,title)}</option>)}</select></section>}
    {sections.map(section=>{const items=activeCatalog.filter(x=>x.section===section&&(rarity==='all'||x.rarity===rarity));if(!items.length)return null;return <section className="arc-achievement-section" key={section}><h3>{localizeAchievementSection(section,language)}</h3><div className="arc-achievement-grid">{items.map(def=>{const progress=calculateAchievementProgress(def,data.snapshot);const isUnlocked=unlocked.has(def.achievement_id);const claim=data.local.claims.find(x=>x.achievementId===def.achievement_id);const copy=localizeAchievement(def,language);return <article key={def.achievement_id} aria-label={`${copy.title} · ${localizeAchievementState(isUnlocked,language)}`} className={`arc-achievement-card rarity-${def.rarity} ${isUnlocked?'is-unlocked':'is-locked'}`}><header><span>{localizeAchievementRarity(def.rarity,language)}</span><small>#{def.achievement_id} · {localizeAchievementState(isUnlocked,language)}</small></header><Trophy/><h4>{copy.title}</h4><p>{copy.description}</p><div className="arc-achievement-progress"><i style={{width:`${Math.min(100,progress.current/progress.target*100)}%`}}/></div><strong>{progress.current} / {progress.target} <small>{localizeAchievementProgress(progress.completed,language)}</small></strong><footer><span title={localizeAchievementReward(language)}><Coins/>{def.reward_credits} Credits</span>{def.title_id&&<span><Award/>{getLocalizedTitleName(def.title_id,language)}</span>}</footer>{claim&&claim.status!=='settled'&&<div className="arc-achievement-pending">{claim.status==='failed_terminal'?(isEn?'Reward could not be verified':'Belohnung konnte nicht verifiziert werden'):(isEn?'Local reward pending · safe retry scheduled':'Lokale Belohnung ausstehend · sichere Wiederholung geplant')}</div>}</article>})}</div></section>})}
  </section>;
};

export const MissionsPage: React.FC<MissionsPageProps> = ({
  lang,
  level,
  currentXp,
  requiredXp,
  initialView = 'missions',
  onCreditBalanceChange,
}) => {
  const isEn = lang === 'en';
  const [objectiveView, setObjectiveView] = useState<ObjectiveView>(initialView);
  const progress = requiredXp > 0 ? Math.min(100, (currentXp / requiredXp) * 100) : 0;

  useEffect(() => {
    setObjectiveView(initialView);
  }, [initialView]);

  return (
    <main className="arc-destination-page arc-missions-page">
      <header className="arc-destination-hero arc-missions-page__hero">
        <div className="arc-destination-emblem"><ClipboardCheck /></div>
        <div className="arc-destination-heading">
          <span>ARC // OBJECTIVE COMMAND</span>
          <h1>{isEn ? 'Missions' : 'Missionen'}</h1>
          <p>{isEn ? 'Long-term objectives and challenges.' : 'Langfristige Ziele und Herausforderungen.'}</p>
        </div>
        <div className="arc-destination-player-status" aria-label={isEn ? 'Player progression' : 'Spielerfortschritt'}>
          <span>LEVEL {level}</span>
          <div><i style={{ width: `${progress}%` }} /></div>
          <small>{currentXp.toLocaleString()} / {requiredXp.toLocaleString()} XP</small>
        </div>
      </header>

      <ObjectiveTabs activeView={objectiveView} isEn={isEn} onChange={setObjectiveView} />
      {objectiveView === 'missions'
        ? <MissionsView isEn={isEn} onCreditBalanceChange={onCreditBalanceChange} />
        : <AchievementsView isEn={isEn} />}
    </main>
  );
};
