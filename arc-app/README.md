# ARC

ARC is a local-first, offline single-player progression app built with React, Vite and Capacitor.

## Run Locally

**Prerequisite:** Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

Create a production web bundle with `npm run build`; synchronize it into the native projects with `npx cap sync`.

ARC stores gameplay in its versioned IndexedDB savegame. Release 1 has no real-money purchases or advertising. Credits come from a free starting balance and gameplay rewards and can be spent on skins and module reloads.

See [the architecture index](docs/architecture-index.md) for the current system boundaries.
