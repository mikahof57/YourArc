# ARC native runtime foundation (Phase 9)

ARC uses Capacitor as a thin native shell around the existing offline React/Vite application. `ArcSaveRepository` and its IndexedDB adapter remain the sole gameplay persistence authority. Native APIs are isolated behind `ArcNativeRuntimeAdapter`; React and gameplay domains must not import Capacitor directly.

## Runtime boundaries

- Platform and lifecycle: `ArcNativeRuntimeService` coalesces concurrent foreground work and invokes the existing idempotent local ARC-day initializer. Background transitions do not mutate gameplay. Task, mission, achievement, companion, and economy rewards are never replayed by lifecycle code.
- Companion apps: the native transport port is disabled. A future transport must pass every envelope to `processCompanionEvent`, which delegates to the Phase-8 `LocalCompanionBridgeService`; it may not mutate saves directly.
- Secure/native storage: the port is reserved for small native secrets or receipts. It is unavailable today and must never become a second gameplay store.
- Deep links: the adapter recognizes only the reserved `arc:` scheme and exposes every link as `unhandled`. No production route or external event acceptance is active.

## IndexedDB in native WebViews

Capacitor's WKWebView and Android WebView provide IndexedDB, so no save migration is required. Data normally survives process termination, restarts, and application updates while the app identity remains unchanged. It does not survive uninstall, OS/app-data clearing, or all device-loss scenarios. iOS/Android WebView storage is app-container data and must not be treated as a user-exportable backup. ARC's primary/recovery snapshots protect against logical corruption inside the same store, not container deletion. A future explicit export/native-file backup can be added through a separate adapter without replacing the repository authority.

ARC's repository transaction queue remains the consistency boundary. Web Locks are opportunistic; a single native WebView is the Phase-9 runtime assumption. Multi-window/native background writers require a stronger storage adapter in a later phase.

## Offline and layout

All active core assets are bundled by Vite. Skin images live under `public/assets/skins`; avatars used by the offline product are local. Obsolete Supabase/Auth/community runtime sources were removed after the offline cutover and remain recoverable from the `pre-offline-migration-snapshot` branch. `viewport-fit=cover`, safe-area variables, dock/header/modal padding, `100dvh`, and mobile modal scrolling cover system bars, notches, the home indicator, and keyboard-constrained screens without changing the visual design.

## Commands

```sh
npm run dev
npm run build
npm run native:sync
npm run native:ios
npm run native:android
```

`native:sync` builds the Vite bundle then copies it into both platform projects. iOS opening/building requires full Xcode (not only Command Line Tools) and CocoaPods/SPM support required by the installed Capacitor version. Android requires a supported JDK, Android Studio/SDK, and configured SDK tools. Portrait orientation is configured; native release signing, app-store metadata, icons/splash polish, real companion/deep-link declarations are intentionally later work.
