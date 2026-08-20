# ARC Backend Setup – Community + Credits + Stripe

Die ZIP enthält jetzt die komplette **Code-/Datenbank-Seite** des bisher geplanten Community- und Shop-Ausbaus. Die einzigen noch offenen Schritte liegen bewusst außerhalb des ZIPs: deine echte Supabase-Instanz, Stripe, Vercel/GitHub und die abschließenden Zwei-Account-/Zahlungstests.

## Enthaltene Backend-Funktionen

### Community
- serverseitig eindeutige Character Codes
- Freundesanfragen und Freundschaften
- Realtime-Aktualisierung für soziale Änderungen
- Online-/Offline-Status
- 1:1-Unterhaltungen
- persistente Gruppenchats
- persistenter Clan-Chat
- Clans, Mitglieder und Rollen
- Clan-Beitrittsanfragen
- Clan-Einladungen
- Rollenänderungen
- Kicken und Verlassen
- Gründerwechsel beim Verlassen
- RLS und serverseitige RPCs für kritische Aktionen

### Shop / Credits
- serverseitig geschütztes Credit-Guthaben
- Credit-Transaktionshistorie
- Shop-Artikelkatalog
- serverseitige Preise für Skins, Farben, Animationen und Design-Funktion
- serverseitige Käufe mit atomarer Abbuchung
- Inventar
- Schutz gegen doppelte Käufe
- tägliches Glücksrad serverseitig gegen Mehrfachauszahlung abgesichert

### Stripe
- `create-checkout-session` Edge Function
- `stripe-webhook` Edge Function
- Stripe Checkout für die drei Credit-Pakete
- Zahlung wird ausschließlich über den Webhook als bezahlt anerkannt
- Credits werden ausschließlich serverseitig gutgeschrieben
- doppelte Webhook-Verarbeitung wird abgefangen
- asynchrone erfolgreiche Checkout-Zahlungen werden ebenfalls verarbeitet

### Sicherheit
- RLS auf Community-, Chat-, Shop- und Moderationstabellen
- keine Stripe Secret Keys im Frontend
- Credits können nicht durch normalen Profil-Update vom Client verändert werden
- kritische Clan-/Freund-/Shop-Aktionen laufen über `SECURITY DEFINER` RPCs
- Block-/Report-Datenmodell ist vorbereitet

## Noch NICHT ausführen

Diese Schritte machen wir anschließend gemeinsam auf den echten Plattformen:

1. Supabase SQL Migration ausführen.
2. Prüfen, ob die bestehende `profiles`-Struktur mit der Migration kompatibel ist.
3. Supabase Edge Functions deployen.
4. Stripe zunächst im **Testmodus** einrichten.
5. Stripe Webhook auf die Supabase Function zeigen lassen.
6. Supabase Function Secrets setzen.
7. Vercel Environment Variables prüfen.
8. GitHub/Vercel deployen.
9. Mit zwei echten Testaccounts Community-Funktionen testen.
10. Mit Stripe-Testkarten den kompletten Kaufablauf testen.
11. Danach erst auf Live-Zahlungen umstellen.
12. Vor dem öffentlichen Echtgeldbetrieb rechtliche/verbraucherrechtliche Anforderungen für Deutschland/EU prüfen.

## Wichtige Secrets

Niemals diese Werte in `VITE_*` Variablen oder Frontend-Code eintragen:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
```

Für die Supabase Edge Functions werden benötigt:

```text
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
APP_URL=https://your-arc.vercel.app
```

Supabase stellt seine eigenen Function-Umgebungsvariablen bereit.

## Stripe Webhook

Nach dem Deployment zeigt der Webhook auf:

```text
https://<DEIN_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
```

Mindestens diese Ereignisse aktivieren:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
```

## Credit-Pakete

Die Datenbank enthält aktuell:

| Paket | Credits | Preis |
|---|---:|---:|
| Starter Pack | 100 | 1,99 € |
| Cyber Pro Pack | 500 | 6,99 € |
| Overlord Vault | 1500 | 14,99 € |

Die Preise werden beim Checkout aus `store_products` gelesen. Der Browser kann den Preis nicht selbst bestimmen.

## Architektur

```text
Vercel / React
      |
      v
Supabase Auth
      |
      +-- PostgreSQL
      |     +-- profiles
      |     +-- friendships
      |     +-- clans
      |     +-- conversations
      |     +-- messages
      |     +-- store_products
      |     +-- purchases
      |     +-- user_inventory
      |     +-- credit_transactions
      |
      +-- Realtime
      |
      +-- Edge Functions
              |
              v
            Stripe
              |
              v
           Webhook
              |
              v
           Supabase
```

Die aktuelle ZIP ist damit auf der **Code-Seite fertig vorbereitet**. Die Plattformkonfiguration und der reale Testablauf folgen erst gemeinsam.

## Important: existing ARC profiles table

The current ARC database uses `profiles.id` as the auth user id and initially contains `email` and `credits`. The migration in this package is designed to extend that existing table safely: it adds/backfills `user_id` and the community profile fields instead of recreating `profiles`. Do not replace or drop the existing `profiles` table.
