import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/App.tsx', 'utf8');
const objectives = readFileSync('src/components/Pages/MissionsPage.tsx', 'utf8');

assert.doesNotMatch(app, /ProgressionDomainModal|progressionDomain|setProgressionDomain/);
assert.match(
  app,
  /onOpenAchievements=\{\(\) => \{[^}]*setObjectiveInitialView\('achievements'\);[^}]*setActiveDestination\('missions'\)/,
);
assert.match(
  app,
  /onOpenMissions=\{\(\) => \{[^}]*setObjectiveInitialView\('missions'\);[^}]*setActiveDestination\('missions'\)/,
);
assert.match(app, /initialView=\{objectiveInitialView\}/);
assert.match(app, /key=\{objectiveInitialView\}/);
assert.doesNotMatch(app, /user\.id|auth\.uid|supabase/);

assert.match(objectives, /initialView\?: ObjectiveView/);
assert.match(objectives, /initialView = 'missions'/);
assert.match(objectives, /useState<ObjectiveView>\(initialView\)/);
assert.match(objectives, /setObjectiveView\(initialView\)/);
assert.match(objectives, /objectiveView === 'missions'[\s\S]*<MissionsView[\s\S]*<AchievementsView/);
assert.match(objectives, /className=\{activeView === 'achievements' \? 'is-active' : ''\}/);

console.log('Achievement navigation regression test passed.');
