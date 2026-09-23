# MY ARC first-time introduction

The reusable `AppIntroduction` modal has six offline UI previews, localized copy, progress indicators, Back/Next/Skip and a final action. It uses existing stat icons and a local Shop skin image, blocks background interaction, traps focus, supports reduced motion and uses the shared safe-area modal bounds with a scrollable content region and 44px actions.

Fresh saves receive `settings.introductionState = eligible`. Every successful new-character initialization sets `pending` within the same save transaction, including recreations. Overview presents it from the committed creation result, only when the character and progression are initialized. Skip, Escape and completion persist `completed` through the existing local settings service. If saving fails, the tutorial stays open with a retry message. An interrupted pending tutorial resumes after restart.

Missing state means already handled: existing saves need no migration. Legacy browser imports and v0 migrations explicitly discard the new factory default. Reset alone clears an old pending tutorial; only successful character creation arms it again. Backup import clears historical pending state because restoring is not new-character creation. Settings replay is presentation-only and performs no save writes. No progression, economy, inventory, prices or starting-credit changes are made.

Copy deliberately describes available skins, gameplay Credit rewards and upcoming companion apps. It does not promise unconfigured native store products or compatibility-only design items.

## Final copy and visuals

### 1. Six stat cards using the actual names and emoji.

**DE — Deine Stats**

Das sind deine sechs Stats. Sie zeigen, wie sich dein Charakter in den wichtigsten Bereichen entwickelt.

**EN — Your stats**

Meet your six stats. They show how your character develops across the key areas of your life.

### 2. Task → completion → stat improvement → progress loop.

**DE — Deine Tagesaufgaben**

Jeden Tag bekommst du Aufgaben für deine aktiven Stats. Erledige sie, um deine Werte zu steigern und deinen Charakter weiterzuentwickeln.

**EN — Your daily tasks**

Each day brings tasks for your active stats. Complete them to improve your stats and develop your character.

### 3. Miniature quote card and quote-source settings hint.

**DE — Tägliche Motivation**

Auf der Übersicht begleitet dich jeden Tag ein Gedanke. Unter Einstellungen → Motivation wählst du die Quellen deiner Zitate.

**EN — Daily motivation**

Find a daily thought on your Overview. Choose your quote sources under Settings → Motivation.

### 4. Mission card with illustrative progress bar.

**DE — Missionen**

Wähle eine Mission für ein größeres Ziel. Erfülle ihre Bedingungen und erhalte nach Abschluss deine Belohnung.

**EN — Missions**

Choose a mission for a bigger goal. Meet its requirements and receive your reward when it is complete.

### 5. Existing local Shop skin and the 100 starting Credits message.

**DE — Shop & Design**

Mit Credits schaltest du Skins für deinen Charakter frei. Missionen und Erfolge bringen dir weitere Credits. Wenn du möchtest, such dir im Shop deinen ersten Skin aus.

**EN — Shop & Design**

Use Credits to unlock skins for your character. Missions and achievements earn you more Credits. Pick your first skin in the Shop whenever you like.

Du startest mit 100 Credits. / You start with 100 Credits.

### 6. Five navigation icons; App Hub marked coming soon.

**DE — Du bist bereit**

Starte mit deinen Tagesaufgaben und baue deinen eigenen ARC auf. Im Menü findest du Einstellungen, Kalender, Statistik und Wochenplan. Der ARC App Hub ist für kommende Begleit-Apps reserviert.

**EN — You’re ready**

Start with your daily tasks and build your own ARC. Find Settings, Calendar, Statistics and Weekly Routine in Menu. The ARC App Hub is reserved for upcoming companion apps.

## Physical-device verification

Rendered viewport checks remain unconfirmed: browser control timed out in the final session. Test 375×667, 390×844, 393×852 and 430×932 plus desktop. Check both languages, safe areas, text scaling, all six visuals and footer controls, background interaction blocking, Skip and completion across restart, and Settings replay. Automated structural/state tests are not a substitute for device sign-off.
