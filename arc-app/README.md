<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/64f2f452-552c-485b-82a0-7df447e3b0f1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## ARC Community + Payments Backend

The project now contains the code-side implementation for the ARC Community, realtime chat, clans, secure credit economy and Stripe Checkout architecture.

See `SUPABASE_STRIPE_SETUP.md` for the remaining platform-side setup. The application intentionally keeps private Supabase/Stripe credentials out of the frontend.
