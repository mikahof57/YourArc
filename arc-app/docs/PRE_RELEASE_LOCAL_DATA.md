# ARC local data and release surfaces

ARC v1 is accountless and stores gameplay state in the versioned `ArcSaveGame` IndexedDB repository. The Data & Storage settings tab exports a validated `.arcbackup` envelope (`formatVersion: 1`) and imports only fully validated saves. Import writes a recovery backup before the atomic primary-record replacement; malformed and newer formats are rejected.

Legacy group-calendar records remain readable by save migrations but are dormant in the v1 UI. Achievement IDs 67–72 and 76–78 remain catalogued as `inactive_legacy`; existing unlocked IDs are preserved, but these network-dependent entries are hidden from achievable progress and cannot unlock offline.

Generic Android application backup is deliberately disabled. Explicit ARC backup/export avoids merging stale virtual-currency ledgers or native purchase identifiers through an opaque OS restore.

Release links use `VITE_ARC_PRIVACY_POLICY_URL`, `VITE_ARC_SUPPORT_URL`, `VITE_ARC_TERMS_URL`, and `VITE_ARC_IMPRINT_URL`. Only valid HTTPS links render. Privacy, support, and terms must be configured before store submission; no placeholder URL is shipped.
