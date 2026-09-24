import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ACHIEVEMENT_CATALOG, INACTIVE_LEGACY_ACHIEVEMENT_IDS, isActiveAchievement } from '../../src/features/achievements/achievementCatalog';
import { isAchievementUnlocked } from '../../src/features/achievements/achievementEngine';
import { createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { ARC_SAVEGAME_SCHEMA_VERSION } from '../../src/features/savegame/arcSaveGame';
import { ArcSaveRepository } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import type { ArcSaveStorageAdapter } from '../../src/features/savegame/arcSaveStorage';
import { parseArcBackup, serializeArcBackup } from '../../src/features/savegame/arcPortableBackup';

const root = new URL('../../', import.meta.url);
const read = (path:string) => readFile(new URL(path,root),'utf8');

const onboarding=await read('src/components/Onboarding/CharacterCreation.tsx');
assert.match(onboarding,/COPY = \{[\s\S]*de:[\s\S]*en:/);
assert.match(onboarding,/lang: Language/);assert.match(onboarding,/get365PresetTasksForStat/);
assert.match(onboarding,/role="dialog"/);assert.match(onboarding,/aria-pressed/);
const app=await read('src/App.tsx');assert.match(app,/lang=\{lang\}/);

assert.equal(ACHIEVEMENT_CATALOG.length,78);assert.equal(ACHIEVEMENT_CATALOG.filter(isActiveAchievement).length,69);
assert.deepEqual(ACHIEVEMENT_CATALOG.filter(x=>x.availability==='inactive_legacy').map(x=>x.achievement_id),[...INACTIVE_LEGACY_ACHIEVEMENT_IDS]);
const snapshot={dailyTotal:99999,level:999,categoryCounts:{wissen:9999,muskeln:9999,geist:9999,beweglichkeit:9999,business:9999,geld:9999},completionsByDay:{},maxStreak:9999,activeDays:9999,missionsActivated:999,missionsCompleted:999,missionsByDifficulty:{epic:999,easy:1,medium:1,hard:1},missionCompletionsByDay:{},uniqueSkinIds:[],skinTiers:{},gameplayCredits:9999,confirmedFriends:999,clanJoined:true,foundedClanReachedFive:true,receivedClanAdminRole:true,globalRankMilestones:[{rank:1,population:100}],clanRankMilestones:[{rank:1,population:100}]};
for(const item of ACHIEVEMENT_CATALOG.filter(x=>!isActiveAchievement(x)))assert.equal(isAchievementUnlocked(item,snapshot),false);

const storage=new MemoryArcSaveStorage();const repo=new ArcSaveRepository(storage);const first=createNewArcSaveGame('en');await repo.save(first);
const envelope=await repo.export();const raw=serializeArcBackup(envelope);const parsed=parseArcBackup(raw);
assert.equal(parsed.formatVersion,1);assert.equal(parsed.save.saveId,first.saveId);assert.equal(parsed.save.economy.credits,100);
await repo.import(parsed);const restarted=new ArcSaveRepository(storage);const afterRestart=await restarted.load();assert.equal(afterRestart?.saveId,first.saveId);assert.equal(afterRestart?.character.characterId,first.character.characterId);assert.equal(afterRestart?.economy.transactions.length,first.economy.transactions.length);
assert.throws(()=>parseArcBackup('{bad'),/malformed/);
assert.throws(()=>parseArcBackup(JSON.stringify({...envelope,formatVersion:2})),/newer/);
assert.throws(()=>parseArcBackup(JSON.stringify({...envelope,save:{...envelope.save,schemaVersion:ARC_SAVEGAME_SCHEMA_VERSION+1}})),/newer/);
const backupKeys=await storage.keys('backup:');assert.equal(backupKeys.length,1);

class FailingPrimaryWriteStorage implements ArcSaveStorageAdapter {
  failPrimary=false;constructor(readonly inner=new MemoryArcSaveStorage()){}
  get<T>(key:string){return this.inner.get<T>(key)} remove(key:string){return this.inner.remove(key)} keys(prefix?:string){return this.inner.keys(prefix)}
  set<T>(key:string,value:T){if(this.failPrimary&&key==='save:primary')return Promise.reject(new Error('test_write_failure'));return this.inner.set(key,value)}
}
const failingStorage=new FailingPrimaryWriteStorage();const failingRepo=new ArcSaveRepository(failingStorage);const original=createNewArcSaveGame('de');await failingRepo.save(original);
const replacement=createNewArcSaveGame('en');const replacementEnvelope={format:'arc-savegame' as const,formatVersion:1 as const,exportedAt:new Date().toISOString(),save:replacement};
failingStorage.failPrimary=true;await assert.rejects(()=>failingRepo.import(replacementEnvelope),/test_write_failure/);
assert.equal((await failingRepo.load())?.saveId,original.saveId);assert.equal((await failingStorage.keys('backup:')).length,1);

const calendar=await read('src/components/HUD/CalendarWidget.tsx');
assert.match(calendar,/ARC_GROUP_CALENDARS_ACTIVE = false/);assert.match(calendar,/const currentEvents: CalendarEvent\[\] = privateEvents/);
assert.match(calendar,/ARC_GROUP_CALENDARS_ACTIVE && isCreateGroupOpen/);assert.match(calendar,/ARC_GROUP_CALENDARS_ACTIVE && isManageGroupOpen/);
const manifest=await read('android/app/src/main/AndroidManifest.xml');assert.match(manifest,/android:allowBackup="false"/);
const settings=await read('src/components/Modals/SettingsModal.tsx');
for(const copy of ['Data & Storage','Daten & Speicher','Export backup','Backup exportieren','Gameplay Credits','Privacy summary'])assert.match(settings,new RegExp(copy.replace(/[&]/g,'\\&')));
assert.match(settings,/aria-modal="true"/);assert.match(settings,/aria-label=/);
for(const modal of ['src/components/HUD/TaskModal.tsx','src/components/Modals/ExtraModuleModal.tsx','src/components/Modals/StatsGraphModal.tsx','src/components/Modals/ArcMenuModal.tsx','src/components/Modals/ShopModal.tsx']){const source=await read(modal);assert.match(source,/aria-modal/);assert.match(source,/useModalAccessibility/);}
const links=await read('src/config/releaseLinks.ts');assert.match(links,/configuredHttpsUrl/);assert.doesNotMatch(links,/example\.com/);
assert.equal(ARC_SAVEGAME_SCHEMA_VERSION,6);
console.log('ARC pre-release product fixes passed: onboarding DE/EN, 69 active achievements, backup, private calendar, data UI, Android policy.');
