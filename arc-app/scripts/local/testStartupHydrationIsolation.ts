import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const app = readFileSync(resolve('src/App.tsx'), 'utf8');

// Production startup is local and fails safely if neither primary nor backup is valid.
assert.match(app, /initializeLocalSaveFoundation\(lang\)/);
assert.match(app, /localGameService\.initializeDay\(\)/);
assert.match(app, /setArcInitializationStatus\('error'\)/);
assert.doesNotMatch(app, /getMyProfile|loadFriends|loadClans|loadOwnedInventory|supabase/);
assert.match(app, /<AppHubPage/);
assert.doesNotMatch(app, /fetch\(|WebSocket|realtime|auth\.uid/);

console.log('Offline startup isolation static tests passed.');
