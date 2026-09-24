# Retired native IAP — compatibility notes

Release 1 has no real-money purchases, credit packs, Store product configuration, billing
adapter, purchase listeners or reconciliation. The native purchase plugin has been removed.
The earlier Phase 10 integration described here is no longer part of the application.

Existing save-game purchase records are retained as inert historical data:
`externalPurchaseId`, `processedExternalPurchaseIds` and ledger metadata may occur in old
saves or imported backups. They do not initiate network requests, settle transactions or
credit balances again. Removing the integration must never remove existing Credits or items.

The normal free 100-Credit starting grant, Mission/Achievement rewards, skin spending and
module-reload costs remain unchanged. There are no new store identifiers to configure.

The legal-page drafts now describe this release without IAP. Remaining personal/contact,
hosting and legal-assessment requirements are listed in `public-legal-pages.md`.
