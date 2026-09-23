# ARC native IAP architecture (Phase 10)

ARC uses `capacitor-plugin-cdv-purchase` 13.18 as its native billing bridge. It explicitly supports Capacitor 8, StoreKit 2 (iOS 15+) and Google Play Billing 8.3 (Android API 23+), including consumables and unfinished local transactions. No RevenueCat, Iaptic, Stripe, Supabase, or custom payment server is part of the active path.

## Product configuration

The trusted product/credit mapping is `ARC_IAP_PRODUCT_CATALOG`. Store identifiers are intentionally unset until the products exist in the consoles:

```text
VITE_ARC_IAP_APPLE_CREDITS_100=
VITE_ARC_IAP_APPLE_CREDITS_500=
VITE_ARC_IAP_APPLE_CREDITS_1500=
VITE_ARC_IAP_GOOGLE_CREDITS_100=
VITE_ARC_IAP_GOOGLE_CREDITS_500=
VITE_ARC_IAP_GOOGLE_CREDITS_1500=
```

Do not reuse an identifier across different credit amounts. Real-money price and currency always come from StoreKit/Play Billing; fallback copy never supplies an authoritative price. Until IDs are configured and returned by the store, packages remain unavailable.

### Intended launch packages

| Internal ARC product ID | ARC Credits | Target launch price | Apple product ID | Google product ID | Positioning |
| --- | ---: | ---: | --- | --- | --- |
| `credits_100` | 100 | €0.99 | `VITE_ARC_IAP_APPLE_CREDITS_100` | `VITE_ARC_IAP_GOOGLE_CREDITS_100` | Standard |
| `credits_500` | 500 | €3.99 | `VITE_ARC_IAP_APPLE_CREDITS_500` | `VITE_ARC_IAP_GOOGLE_CREDITS_500` | Popular |
| `credits_1500` | 1,500 | €9.99 | `VITE_ARC_IAP_APPLE_CREDITS_1500` | `VITE_ARC_IAP_GOOGLE_CREDITS_1500` | Best value / preferred |

These euro amounts are launch-positioning metadata for configuring the store consoles. They are not runtime prices, are not passed to the Shop display model, and cannot prove or settle a purchase. The production Shop renders only `displayPrice` returned by StoreKit or Google Play Billing.

## Transaction flow

1. Shop requests product metadata through `LocalIapService` and the Phase-9 `ArcNativeRuntimeService`.
2. The native adapter registers only configured consumables for the current platform.
3. Shop submits only an internal ARC product ID; it cannot submit credits or a price.
4. Pending and cancelled results grant nothing.
5. An approved native transaction supplies its store product ID and transaction/token identity.
6. `LocalIapService` matches that ID to the trusted catalog and passes the confirmed purchase—not a caller-selected reward—to `LocalEconomyService`.
7. `applyVerifiedExternalPurchase` atomically appends the ledger entry and derives the exact credits from the catalog.
8. Only after the save succeeds does ARC finish/consume the native transaction.

Transaction ID, original transaction ID, Google purchase token/order ID, timestamp, environment when exposed, and acknowledgement/consumption flags are retained as minimal ledger metadata. No payment credentials, account credentials, card, or banking data are stored.

## Recovery and idempotency

On initialized-app launch and foreground resume, reconciliation refreshes local store transactions without blocking core startup. Approved but unfinished transactions are replayed through the same economy path. Ledger matching covers the primary external ID plus transaction ID, purchase token, and order ID. A duplicate callback, restart, or repeated refresh therefore returns the existing grant; `finish()` can safely be retried afterward.

If the ledger write fails, ARC does not finish the store transaction. If the ledger succeeds but finish fails, the visible credits remain granted and the unconsumed transaction is retried later. Pending transactions remain uncredited until a later approved update. Store failures/offline state affect only purchasing, never save loading or gameplay.

`restorePurchases()` is deliberately not presented as restoration of consumed currency. Reconciliation recovers only store-reported unfinished/unprocessed consumable transactions. Once a credit pack is consumed and its local save is lost, this offline architecture cannot promise cross-device or reinstall restoration.

## Security boundary

The native plugin provides on-device StoreKit/Play Billing transaction state, but Phase 10 has no server receipt/token verification. A fully local, user-controlled device is less fraud-resistant than server verification. Controls retained locally are known configured product IDs, fixed product-to-credit mapping, durable identity idempotency, atomic ledger writes, and no UI/native caller-controlled credit amount. This must not be described as server-grade validation.

## Manual Apple setup

1. Install full Xcode and select it with `xcode-select`.
2. Configure signing/team and the final bundle record for `com.yourarc.arc`.
3. Create three consumable products in App Store Connect; supply their actual IDs through the Apple environment variables.
4. Complete contracts/tax/banking and product localization/pricing.
5. Enable/test In-App Purchase capability as required by the signing profile.
6. Test product loading, Ask to Buy/pending, cancellation, interrupted finish, relaunch reconciliation, duplicate delivery, and consumable repurchase using StoreKit Configuration and Sandbox/TestFlight.

## Manual Google setup

1. Install a supported JDK plus Android Studio/SDK and accept required licenses.
2. Configure release signing for application ID `com.yourarc.arc`.
3. Create and activate three one-time consumable products in Play Console; supply their actual IDs through the Google environment variables.
4. Upload an eligible signed build to an internal test track and configure license testers/payments.
5. Test on a Play-enabled device with the installed test-track build: product loading, slow/pending payment, cancellation, offline errors, consumption, process death, relaunch reconciliation, and duplicate purchase callbacks.

Native store behavior has not been validated in this environment because full Xcode and the Android JDK/SDK are unavailable.
