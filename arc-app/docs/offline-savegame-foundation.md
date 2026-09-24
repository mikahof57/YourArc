# ARC offline savegame foundation — Phase 1

This document records the phased migration that established ARC's versioned local save.
The migration is complete: `ArcSaveRepository` is now the sole durable gameplay authority.
Earlier Supabase references below describe historical phase boundaries rather than the
current production architecture.

## Schema

`ArcSaveGame` has a persistent `saveId`, a separate `characterId`, schema and audit
timestamps, and sections for profile/character, canonical and custom progression,
assignments/history, XP/level, economy ledger, inventory/equipment, legacy wheel data, missions,
achievements/titles, settings, calendar, routine and UI preferences.

The current schema version is `6`. Canonical stat IDs and values, identity fields,
XP/level and Credit balance are validated before a save is accepted.

## Storage and atomicity

Game data is stored in IndexedDB through `ArcSaveStorageAdapter`. UI and future domain
code should use `ArcSaveRepository`, not browser storage directly. Repository writes
are serialized, optionally use the Web Locks API across browser contexts, validate a
complete cloned draft, then replace the primary IndexedDB record in one operation.

The adapter boundary also provides an in-memory implementation for deterministic tests
and permits a future native SQLite adapter without changing domain callers.

## Migration and recovery

Before a schema migration the raw previous record is written to a timestamped backup.
Unknown newer versions are rejected. Invalid primary data is never silently replaced:
the repository searches newest-first for a valid backup and otherwise reports failure
while the current Supabase application continues running.

On first initialization, compatible data may be copied from `arc_app_system_state_v1`,
the account-scoped secondary key, local Missions and local Achievements. Account-owned
data is imported only when a preferred identity is supplied or exactly one legacy
identity exists. Ambiguous multi-account data is left untouched and recorded as a
warning. Legacy keys are never deleted in Phase 1.

## Phase boundary

App startup initializes this repository on a best-effort basis. It does not hydrate UI
state from it and does not write gameplay changes into it yet. Supabase remains the
authority for all live profile, progression, Credits, inventory and settlement data.
Local progression and economy cutover belong to later phases.

## Phase 2 local progression shadow domain

`localProgressionDomain.ts` is a pure TypeScript port of the current daily-engine
rules without React, Supabase, browser storage, or network dependencies.
`LocalProgressionService` runs every multi-field mutation through a single validated
`ArcSaveRepository` transaction.

The port covers canonical stat identity, values from 0 through 100, permanent 100,
+2 completion progress, missed-day -1 decay to zero, login/stat streaks, the six-day
Muskeln rest cycle, official XP (`10 + floor(tier / 3)`), exponential level thresholds,
daily snapshots with 90-day retention, idempotent completion/decay events, character
initialization/reset, and the five-custom-stat/thirty-custom-task limits.

Preset selection preserves tier and least-used/oldest-first behavior. PostgreSQL's
internal `hashtextextended` tie-break is represented by a stable local hash, so tied
task selection need not be byte-identical while task identity and progression rules
remain stable.

This is an explicit shadow/test API only. The live UI does not invoke local progression
mutations; Supabase remains authoritative for character creation, daily initialization,
completion, XP, stats, custom content and reset until a later controlled cutover.

## Phase 3 local player and presentation shadow

Save schema 3 defines an offline-only player profile: name, avatar, gender, optional
age/weight/height, avatar category, creation state and frame preference. It deliberately
has no email, auth user ID, online status, last-seen state, friends or social identity.
`saveId` identifies the save and `characterId` identifies its character; neither can be
changed through profile operations.

`LocalProfileService` provides transactional profile, avatar, gender, settings, private
calendar, weekly routine and UI-preference updates. Each section has an updated-at marker
so later imports can avoid replacing newer local content with stale cache data. The v2→v3
migration adds those markers, preserves progression/economy byte-for-byte and creates a
raw backup first.

The current Settings save mirrors only the profile returned by Supabase plus explicitly
local physical/presentation fields. Language, quote selection and module selection are
also shadowed after their existing UI update. Local failures are logged and never alter
the still-authoritative production result.

`characterCode` remains stored because current profile and calendar UI render it, but it
is presentation-only locally and is not a save/account identity. Rank frames remain a
local display preference pending redesign. Personal calendar events and the weekly
routine are part of the offline save. Existing group-calendar data is preserved for
compatibility, while the new profile service intentionally updates only private events;
the multiplayer-shaped group-calendar feature remains a later removal/product decision.

Supabase remains authoritative for the visible profile, character code, equipped/owned
shop content and every gameplay/social domain. No local save value hydrates or overwrites
the live UI in Phase 3.

## Phase 4 local economy shadow

Save schema 4 makes the local economy internally auditable: every balance mutation is an
append-only ledger record containing source, signed amount, before/after balances, stable
reference, optional item/reward/external-purchase identity and metadata. Reference IDs and
future native purchase IDs are idempotency boundaries. Validation rejects broken chains,
negative balances, duplicate ownership, invalid equipped skins and malformed indexes.

Brand-new local saves receive the current product rule of 100 starting Credits and a matching
`initial_grant`. Existing v3 saves retain their exact balance; migration never grants them 100.
Legacy balances are represented by explicit migration ledger entries and existing inventory,
animation and color placeholders are normalized without deleting legacy keys.

`localShopCatalog.ts` is network-independent. Its active catalog contains the 22 current skin
products with stable IDs, prices and local assets. Neon Cyan is the default free color. Retired
color and animation sales remain unavailable compatibility records, preventing accidental
reintroduction while allowing previously owned identifiers to migrate.

`LocalEconomyService` provides atomic credit/debit, purchase, grant, equip/unequip,
module-reload and Mission/Achievement reward operations. Purchases
debit, append the ledger and grant inventory in one save transaction. The wheel feature has
been removed. Its saved claim history and historical ledger entries remain inert compatibility
data; historical rewards still count toward existing achievement progress. No new claims or
random rewards can be generated by the retired feature.

External purchase settlement has been removed for Release 1. Existing purchase ledger entries
and external identifiers remain inert compatibility data; balances and inventory are preserved.

Phase 4 exposes the local economy as a shadow/test API only. Production Shop, balance, inventory,
wheel, reload spending and reward settlements still call Supabase, so there is no local double
debit or reward and no local value can override the visible balance.

## Phase 5 local objectives shadow

Save schema 5 moves the offline Mission, Achievement and title state into one identity-bound
save graph. `objectives.saveId` and `objectives.characterId` bind activity to the durable local
save and character; embedded legacy Mission/Achievement identity fields are normalized to the
same `saveId`. Migration from v4 creates a backup first, preserves existing runs, events, claims,
snapshots, titles, progression and economy, and does not delete any legacy localStorage keys.

`LocalObjectivesService` is the single atomic persistence boundary for the Phase 5 shadow path.
Mission activation, activity ingestion, completion, reward settlement, Achievement evaluation,
title unlock and Credit ledger changes commit in the same validated `ArcSaveRepository`
transaction. Stable activity IDs and economy reward references make retries idempotent. A failed
validation or reward operation commits none of the draft. Titles can only be equipped when owned.

The bundled app-native catalogs remain the content source: 80 Personal Missions, 78
Achievements and 13 title definitions keep their existing stable IDs, catalog versions, rule
engines and reward snapshots. Achievement and title presentation now has complete central DE/EN
content without changing those stable identities or rules. Community and global/clan-ranking Achievements remain dormant in a
pure offline snapshot because there is no local multiplayer/ranking fact that can legitimately
unlock them. Their future removal or replacement needs a product/content decision.

The local Achievement snapshot is derived only from explicit local objective activity plus
already-authoritative local save state. Gameplay-Credit milestones count the existing trusted
product categories (`daily_wheel` and `mission_reward`), excluding starting grants, purchases and
Achievement rewards. Mission and Achievement Credits are appended through the Phase 4 local
economy ledger, never by directly changing the balance.

## Phase 6 production authority cutover

The normal application now starts with `ArcSaveRepository.initialize()`, applies recovery or a
versioned migration when necessary, initializes the local ARC day, and projects the validated save
into transient React presentation state. A missing character opens local Character Creation; an
existing character enters the application without a session, account, email, password, network
request or server hydration. A failed primary/recovery load is surfaced and never silently reset.

The local save is now the sole durable production authority for profile presentation, character,
six-stat and custom-stat progression, assignments, completion, XP/levels, streaks/decay, history,
Credits and ledger, Shop inventory/equip, Missions, Achievements, titles, private calendar,
weekly routine, settings and local UI preferences. Cross-domain gameplay actions use one repository
transaction so progression, objective evaluation and Credit rewards cannot commit partially.
Legacy `arc_app_system_state_v1`, account-scoped Mission/Achievement repositories and language
localStorage values remain import inputs only; the active app no longer writes gameplay state to
them.

Auth gates, account actions, presence, realtime chat, friends, clans, reports, blocking and global
rankings are not reachable from the production component graph. The former Community destination
now renders a deliberately non-interactive `ARC App Hub — Coming Soon` placeholder; the six-app Hub
is not part of Phase 6. The fake registration HTTP endpoint was removed. Real-money purchase UI
remains disabled, and no Stripe checkout or future StoreKit/Play Billing adapter is called.

Historical Supabase services, components, Edge Functions and SQL migrations are retained as
reference/migration evidence and are not imported by the active application. Consequently the
Supabase package remains a source-tree/build dependency for those isolated historical TypeScript
files, but the generated browser application has no Supabase production path. Removing that archive
and dependency is safe only after it is no longer needed for parity/reference audits.

## Phase 7 local ARC App Hub

The former Community destination now contains a production-shaped local App Hub with exactly six
permanent companion slots. The code-owned catalog maps the slots one-to-one, in deterministic order,
to `wissen`, `muskeln`, `geist`, `beweglichkeit`, `business` and `geld`. Names remain deliberately
neutral placeholders until each companion product has approved branding. All six current definitions
are `coming_soon`, unavailable, uninstalled and disconnected, with no URL, store identifier, network
request or account requirement.

Lifecycle values (`coming_soon`, `available`, `installed`, `connected`) and DE/EN presentation are
already modeled so individual cards can advance without changing page structure. A runtime port defines
future install, connection, local-state and open-app operations, but the production service has no
adapter and safely refuses unavailable operations. Real deep links and platform installation detection
remain future work.

Phase 7 reserved the local bridge vocabulary without accepting or applying events.

## Phase 8 local Companion App Event Bridge

Save schema 6 adds a versioned local Companion bridge section. Migration from v5 creates a raw backup,
adds six default uninstalled/disconnected app records, an empty durable replay index, bounded accepted-event
audit history and daily reward usage, and preserves every prior profile, progression, economy, inventory,
Mission, Achievement, title, calendar, routine, settings and UI field. Migration grants no reward.

`ArcCompanionEventEnvelope` version 1 accepts only `activity_completed`, `milestone_completed` and
`daily_goal_completed`. Its whitelist and source-to-stat mapping are derived from the six-slot App Hub
catalog: each companion can reward only its corresponding canonical stat. Event and activity IDs must be
stable non-empty strings; timestamps, integer point/XP amounts and flat primitive metadata are validated.
No reward is inferred. Omitted optional XP explicitly means zero XP.

The central `ARC_COMPANION_REWARD_POLICY` limits one event to 5 stat points and 100 XP and one source app
to 20 requested stat points and 500 XP per local receipt day. Companion rewards use the existing `updateStat`
and `addXp` rules, so values remain 0..100, permanent 100 remains locked and level thresholds remain shared
with normal ARC progression. They never complete a Daily Assignment, alter streaks, run decay or masquerade
as normal task completion. A reward received on the active ARC day refreshes that day's presentation snapshot
without creating completion evidence.

`LocalCompanionBridgeService.processEvent()` validates first and then performs duplicate/policy checks,
stat reward, XP reward, progression event, durable replay marker, daily usage and accepted audit entry inside
one `ArcSaveRepository` transaction. Expected rejections return a structured reason and write nothing.
Unexpected failures roll back the cloned transaction. Audit entries are capped at 1,000 and daily usage uses
a rolling 90-day window. Replay IDs are never silently pruned; the bridge stops accepting new unique events
at 10,000 IDs so old events cannot accidentally become replayable.

The handshake model contains app ID, protocol/app versions, a handshake ID and timestamp. It is a future
native-adapter boundary only. Production catalog entries remain `coming_soon`, and persisted state cannot
override that release gate. Controlled adapters can later mark an available app installed/connected,
disconnect it and render that real state without changing the App Hub structure.

This local bridge provides validation, limits, atomicity and replay resistance, not cryptographic authenticity.
A user with full device control can forge or alter local messages and save data. A future native transport may
add platform-bound signatures, nonces or attestation at the adapter boundary. Phase 8 deliberately does not
claim server trust, implement fake signing, detect installations, open deep links, call a network or integrate billing.
