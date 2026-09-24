# ARC current architecture

ARC is a local-first, offline single-player React/Vite application packaged for iOS and Android with Capacitor.

- `src/features/savegame`: versioned IndexedDB save, validation, migration, backup and recovery.
- `src/features/progression`: authoritative local daily assignments, stats, XP and history.
- `src/features/economy`: local Credits ledger, inventory, Shop and gameplay reward settlement.
- `src/features/missions`, `achievements`, `objectives`: local catalogs and objective engines.
- `src/features/appHub`, `companion`: local App Hub and constrained companion-event bridge.
- `src/features/native`: Capacitor lifecycle and local native runtime boundaries.

The production graph contains no login, Supabase, Stripe, chat, clan, friend, presence or global-ranking runtime. Historical online implementation is preserved by Git and the `pre-offline-migration-snapshot` recovery branch rather than as executable source.

Legacy localStorage keys remain read-only migration inputs in `ArcSaveRepository`; they must not be removed until the supported upgrade window is intentionally ended. Release 1 has no native billing or purchasable Credit packs. Historical purchase fields remain save-compatibility data.

See also:

- [Offline savegame foundation](offline-savegame-foundation.md)
- [Native runtime foundation](native-runtime-foundation.md)
- [Retired IAP compatibility notes](native-iap-architecture.md)
