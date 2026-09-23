# Mobile shell correction — September 22, 2026

## Root causes and contract

Previously, Overview alone reserved dock clearance. Missions, Achievements and App Hub used a separate fixed scroller with `inset: 54px 0 63px`; embedded Shop used the same fixed offsets. The dock was 63px plus the iOS safe bottom, so these routes ended behind the safe-area portion of the dock. Their fixed top offset also ignored the header's real height.

All four destinations now render within `App.tsx`'s `.arc-route-content`, and the document owns scrolling. The wrapper reserves `--arc-content-bottom-clearance`: `--arc-bottom-nav-height` (63px including border) + `--arc-safe-bottom` + .75rem breathing room. The dock and its navigation row consume that same height variable. Pages must not add fixed viewport offsets or independent dock/safe-area compensation. Normal page padding is still allowed. Route changes start at the document top.

The shell owns left/right safe padding. The header owns top safe padding. The dock owns bottom safe padding. Modal overlays sit above navigation: their children are bounded by `100dvh` minus the actual overlay top/bottom gaps and scroll internally. Menu is centered. Settings, Statistics, Weekly Plan and Calendar share these bounds.

The mobile `display:none!important` rule removed all header utilities, while `hidden sm:inline` independently removed both language labels. Both causes were removed. DE and EN have 44px minimum targets, pressed state and visible labels. Header controls wrap in normal flow; mobile character recreation remains accessible from Menu. The existing language change/persistence handler is unchanged.

Books shared the Extra Module header's absolutely positioned actions and `pr-52` title reservation. All Extra Modules now use a two-column identity/close row, full-width wrapping title, and a wrapping credits/reload row. The header does not shrink; the body scrolls beneath it so close, credits and reload remain reachable. The safe-bounded outer modal can also scroll if an exceptionally short viewport cannot fit the header.

Overview and Shop no longer render `characterCode`. Existing persisted fields, migration, backup and internal identity handling remain untouched for compatibility. Calendar's old group controls remain behind `ARC_GROUP_CALENDARS_ACTIVE = false`; no social feature was enabled. CharacterCreation and both portrait assets were untouched.

## Automated checks

`npx tsx scripts/local/testResponsiveShell.tsx` checks JSX ancestry, shared CSS clearance and safe-area contracts, absence of fixed route offsets, rendered DE/EN controls and selected state, all localized Extra Module headers, and absence of code display in Overview/Shop. These are structural assertions, not browser geometry or screenshot tests.

Also run existing onboarding, saves, profile/settings, progression, local objectives, economy/catalog, App Hub, achievement navigation/localization, pre-release, offline cutover and native runtime tests.

## Required rendered/device QA — pending

No browser or native app surface was exposed to the session's UI tooling. No rendered viewport or physical-iPhone result is claimed.

Check both languages at 375×667, 390×844, 393×852, 430×932 and desktop (e.g. 1280×800), then in the synchronized Capacitor app:

- Overview: visible DE/EN, correct pressed state, no logo/status-bar collision; switching updates immediately and survives relaunch. No CYBER code in profile or Shop.
- Overview, Missions, Achievements, App Hub and every Shop tab: scroll to the end; final content sits above the dock with a small gap; no horizontal overflow. Check with nonzero safe bottom on a notched iPhone.
- Menu, Settings, Statistics, Weekly Plan and Calendar: modal stays inside all safe edges, internal scroll reaches the last action, close remains reachable.
- Books and other modules: title, eyebrow, credits, reload and close never overlap. Check long German titles and large balances. Scroll the list fully and use a disposable test save to check reload charging.
- Character creation: the existing two portraits, Male/Female choice and selected state remain unchanged.

Do not treat structural test success as device sign-off.
