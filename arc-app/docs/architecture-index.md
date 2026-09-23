# ARC current architecture

ARC is a local-first, offline single-player React/Vite application packaged for iOS and Android with Capacitor.

- `src/features/savegame`: versioned IndexedDB save, validation, migration, backup and recovery.
- `src/features/progression`: authoritative local daily assignments, stats, XP and history.
- `src/features/economy`: local Credits ledger, inventory, Shop, wheel and native-IAP settlement boundary.
- `src/features/missions`, `achievements`, `objectives`: local catalogs and objective engines.
- `src/features/appHub`, `companion`: local App Hub and constrained companion-event bridge.
- `src/features/native`: Capacitor lifecycle and StoreKit/Google Play Billing adapters.

The production graph contains no login, Supabase, Stripe, chat, clan, friend, presence or global-ranking runtime. Historical online implementation is preserved by Git and the `pre-offline-migration-snapshot` recovery branch rather than as executable source.

Legacy localStorage keys remain read-only migration inputs in `ArcSaveRepository`; they must not be removed until the supported upgrade window is intentionally ended. Native product identifiers remain environment-configured placeholders. Runtime price and purchase state come only from StoreKit or Google Play Billing.

See also:

- [Offline savegame foundation](offline-savegame-foundation.md)
- [Native runtime foundation](native-runtime-foundation.md)
- [Native IAP architecture](native-iap-architecture.md)
