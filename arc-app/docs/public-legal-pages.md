# Public legal pages — 24 September 2026

Three standalone German HTML documents are copied unchanged by Vite from `public` into `dist`:
`/privacy`, `/impressum`, `/support`. They share `/legal-pages.css`, use system fonts, no scripts,
no forms, no third-party embeds and no app bundle. They never open the app database.
The supplied operator/provider details are filled in; no legal placeholders remain.

## Hosting and local preview

- The existing Vercel SPA fallback is retained. Explicit page rewrites (including trailing slashes)
  precede it, so direct requests and refreshes serve the legal HTML rather than the game.
- `arc-app/vercel.json` supports a Vercel Root Directory of `arc-app`.
- Hosting config review: both variants remain necessary to support the existing repository layout
  without assuming an uninspected dashboard Root Directory. No additional routing or hosting changes
  are needed for the revised release plan. The repository-root `vercel.json` supports Root Directory `.`: its install/build commands and
  output directory now point into `arc-app`, where the only package.json actually exists.
- Other static hosts can serve the directory index files directly; `/privacy/`, `/impressum/`,
  `/support/` should resolve to their index.html. Configure extensionless routes before any SPA fallback.
- Local preview: `npm run build`, `npm run preview`, then open `/privacy/`, `/impressum/`, `/support/`.
  Production routing is specified in Vercel config; Vite does not execute Vercel rewrites.
- No deployment was performed. Before submission, verify the chosen real HTTPS domain, direct
  requests and refreshes, mobile layout and accessibility without login on the actual host.

## Verified current release

Operator: Mika Hofmann, explicitly supplied by the user. Release 1 has no monetization,
no In-App Purchases, no real-money Credit purchases and no advertising. Credits are an internal
gameplay currency: a new local save receives a free 100-Credit starting balance; further Credits
come from gameplay rewards (missions and achievements). Character reset does not repeat the grant.
The pages make no promise or consent request for hypothetical future advertising.

The purchase UI, product catalog, purchase callbacks, Store initialization/listeners,
reconciliation/settlement runtime and purchase plugin/native integration have been removed.
Existing balances, inventory, historical ledger entries and legacy purchase fields remain
compatible; retaining historical data does not enable purchases or contact a Store.
TypeScript, all 23 regression tests, the production build and iOS sync passed after removal.
Mika reports that the updated build was successfully tested on a physical iPhone.

The app remains local/offline-first. Apple's own App Store download/update processing remains
relevant even without monetization. The text describes local sensitive content and necessary email support processing without asserting
consent or an Article 9 exception for local app data.
No application code, native configuration, economy or Wheel-removal changes are made by this
legal-documentation update.

## Confirmed operator and providers

Mika Hofmann, Alter Postweg 87a, 21075 Hamburg, Germany.
Public/privacy/support email: `MyArcApp@proton.me`.
Hosting: Vercel. Email: Proton Mail / Proton AG, Switzerland.
Authority: Hamburgischer Beauftragter für Datenschutz und Informationsfreiheit,
Ludwig-Erhard-Straße 22, 20459 Hamburg, Germany.
Mika reports no VAT ID or register details to publish, no employees and no obligation or
commitment to consumer arbitration. Corresponding placeholders were removed; no phone number,
identification number, arbitration body or fixed provider retention period was invented.
Provider processing, retention criteria and transfer information are linked in the privacy page.

## Contact and sensitive-content wording

The public Support page and `MyArcApp@proton.me` provide contact; no phone number is added.
Local optional sensitive content, history and internal backups are not automatically transmitted
to Mika. Export/share remains user-controlled. Privacy and Support ask users not to email special-category
information unless strictly necessary. Voluntarily included information is described only as part
of receiving/storing the email and reading/responding to the request through Proton Mail.
No consent or Article 9 exception is claimed for local data or inferred from voluntary disclosure.
The corresponding unresolved placeholders and draft banners have been removed as requested.

## Article 9 code review

- `SettingsModal.tsx`: editable optional `profile.weight` and `profile.height`; context may make
  these health data. `age` is retained in the profile/save model; age alone is not Article 9 data.
- `settings.quotes.selectedCategories` and `selectedReligion`: Christianity, Islam, Judaism,
  Buddhism, Hinduism. Content preferences do not prove belief but may permit sensitive inference.
- Custom attribute names, task titles/descriptions (`SettingsModal.tsx`), weekly task `text`
  (`WeeklyRoutineWidget.tsx`), calendar `title`/`description` (`CalendarWidget.tsx`) permit sensitive
  free text. Related completions/history and backups can retain or reveal that content.
- `arcSaveGame.ts` persists these locally; no automatic operator upload or HealthKit access.
  Exporting/sharing a backup or sending email can disclose the information beyond the device.
- Male/female avatar choice, age and ordinary gameplay statistics are not automatically special
  categories. The app does not request diagnosis, biometric identification or sexual orientation
  in dedicated fields; free text can nevertheless contain such information.

Before publishing, check the actual hosting dashboard/services and applicable provider agreements,
public HTTPS routes and App Store diagnostics/privacy answers. These operational checks do not
justify inventing a provider-specific retention period or claiming this is legal certification.

## Current technical evidence

| Area | Current finding | Evidence |
| --- | --- | --- |
| Saves | IndexedDB primary save and local backups; language/legacy data in localStorage; no automatic backup expiry | `features/savegame/arcSaveStorage.ts`, `arcSaveRepository.ts`, `utils/i18n.ts` |
| Contents | Profile, optional body/age data, tasks/history, routines/private calendar, quote preferences, Credits/inventory and historical purchase ledger | `features/savegame/arcSaveGame.ts` |
| Reset | Character reset preserves economy; it is not full data deletion | `features/runtime/localGameService.ts` |
| Backup | JSON text, no app-level encryption, selected-file import; export via native browser share or download; recovery copy before import | `services/localBackupService.ts`, `features/savegame/arcPortableBackup.ts` |
| Network | No active Supabase/auth/social/cloud backend or own telemetry SDK in source/runtime dependencies | `package.json`, `App.tsx`, `features/native/nativeRuntimeAdapter.ts` |
| Images | Current assets bundled; legacy/imported avatar strings can still be external URLs and are rendered as images | `features/profile/localProfileDomain.ts`, `components/HUD/ProfileSection.tsx` |
| iOS | Capacitor Core 8.5.1 and App 8.1.1: lifecycle/deep-link hooks; no HealthKit, contacts, photo or location integration in inspected app | `capacitor.config.ts`, native adapter, `ios/App/App/Info.plist` |
| Purchases removed | No purchase UI/runtime, product configuration or billing plugin/native dependency; legacy purchase fields remain local compatibility data | `package.json`, lockfiles, `components/Modals/ShopModal.tsx`, native adapter, `ios/App/CapApp-SPM/Package.swift`, `scripts/local/testNativeIap.ts` |
| Gameplay Credits | Free 100-Credit new-save grant; mission/achievement rewards; existing balances and inventory preserved | `features/savegame/arcSaveRepository.ts`, `features/economy/localEconomyDomain.ts`, `features/objectives/localObjectivesDomain.ts` |
| Diagnostics | No own reporting endpoint; Capacitor manifests declare no tracking/collected data. This does not replace checking Apple reports, final archive or App Store privacy answers | installed Capacitor PrivacyInfo.xcprivacy files |
| Future integrations | Companion transport and secure-storage port unavailable; do not describe them as active cloud or encrypted storage | native adapter |

Privacy text scopes itself to iOS. The Android purchase-plugin integration was also removed.
Installed presentation dependencies (React, icons, charts, confetti) render locally.
The assessment is based on code/configuration, not a live network capture or final signed archive.

## Existing in-app links — unchanged

Settings → Data & Storage already conditionally renders privacy, support, terms and imprint links.
`src/config/releaseLinks.ts` accepts valid HTTPS build-time values only. The inspected local production
configuration has no valid privacy, imprint or support URL; these links are therefore not visible in
that build. No values were added and no app UI was changed. Later, after publication, configure
`VITE_ARC_PRIVACY_POLICY_URL`, `VITE_ARC_IMPRINT_URL`, `VITE_ARC_SUPPORT_URL` with the public HTTPS routes
and rebuild the app. Remote CI/dashboard configuration was not inspected. Terms remain a separate
existing release field and are outside these three requested pages.

## Sources reviewed

- [GDPR, especially Articles 6, 9, 13 and 15–22](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [§5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html)
- [§25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html)
- [§36 VSBG](https://www.gesetze-im-internet.de/vsbg/__36.html)
- [Apple App Store privacy information](https://www.apple.com/legal/privacy/data/de/app-store/)
- [Apple App Review Guidelines, 5.1.1](https://developer.apple.com/app-store/review/guidelines/#privacy)
- [Vercel rewrites](https://vercel.com/docs/routing/rewrites)

The pages describe the inspected functionality and supplied operational facts; this documentation
is not an App Store compliance certification.

Provider sources checked for this update: [Vercel privacy](https://vercel.com/legal/privacy-notice),
[Vercel DPA](https://vercel.com/legal/dpa), [Proton Mail privacy](https://proton.me/mail/privacy-policy),
[Proton privacy](https://proton.me/legal/privacy), [Proton DPA](https://proton.me/legal/dpa),
[EU adequacy decisions](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en).
