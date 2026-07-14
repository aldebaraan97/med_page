# CLAUDE.md — `med_page` (Pediatra Lavielle booking landing page)

Context doc for troubleshooting. Self-contained: you can reason about this project
without repo access. Pairs with `BOOKING_PROJECT_SPEC.md` (the *why*) and
`BOOKING_CLAUDE_CODE_PROMPT.md` (the *how*), which live one directory up.

---

## What this is

A single-page paid-ad landing page for **Dr. Vicente Lavielle Sotomayor** (pediatra,
Cuautitlán Izcalli, México). It is the conversion surface for Google Ads traffic.

**The goal of the current work:** move the measured conversion off a WhatsApp tap
(which fired as the user *left* the page, losing the `gclid` and capturing no
patient data) onto an **owned on-page booking flow** that writes into a calendar we
control. The booking widget (Cal.com) is the new primary CTA; the real conversion
fires on an owned confirmation page (`/cita-confirmada`) that only loads on a
successful booking.

- **Live site:** https://pediatralavielle.com/
- **Repo:** https://github.com/aldebaraan97/med_page (deploys from `main` on push, Cloudflare Pages)
- **This is the LIVE website.** Pushing to `main` deploys to production. Work on a branch.

---

## Stack

- **Astro v6.4.3** — static site generator, zero-runtime output (no SSR, no backend).
- **Tailwind CSS v4.3** — via the `@tailwindcss/vite` plugin (NOT a separate config
  file; v4 is CSS-first). The only stylesheet is `src/styles/global.css`, which is
  one line: `@import "tailwindcss";`. There is **no `tailwind.config.js`**.
- **Node ≥ 22.12** (see `package.json` `engines`).
- No database, no API keys, no secrets in the repo, no runtime dependencies beyond
  the Cal.com embed script that loads client-side from `app.cal.com`.

### Commands
```bash
npm install
npm run dev      # dev server at http://localhost:4321/
npm run build    # static output to dist/
npm run preview  # serve the built dist/
```

---

## File structure

```
med_page/
├── astro.config.mjs          # Astro config; registers the Tailwind Vite plugin. Minimal.
├── package.json              # deps: astro, tailwindcss, @tailwindcss/vite. Node >=22.12.
├── tsconfig.json             # extends astro/tsconfigs/base
├── public/
│   ├── favicon.ico
│   └── favicon.svg
└── src/
    ├── styles/
    │   └── global.css        # one line: @import "tailwindcss";
    └── pages/
        ├── index.astro       # THE landing page (everything lives here)
        └── cita-confirmada.astro   # NEW confirmation page = the conversion surface
```

Astro routing is file-based: `src/pages/index.astro` → `/`, and
`src/pages/cita-confirmada.astro` → `/cita-confirmada`.

There is no layout component, no shared header/footer, no framework islands. Both
pages are standalone full HTML documents. Styling is Tailwind utility classes
inline in the markup. Design tokens in use: `bg-slate-50` page bg, white card
(`max-w-xl rounded-2xl shadow-sm border border-slate-200`), `blue-600` accent,
`slate` text scale.

---

## `index.astro` — anatomy

Frontmatter (the `---` block at top) holds JS constants, then the HTML. Key constants:

| Constant | Purpose |
|---|---|
| `calLink` | Cal.com event link, format `<username>/<event-slug>`. **PLACEHOLDER** `"lavielle/consulta"` — see Pending. |
| `calBrandColor` | `#2563eb` (Tailwind blue-600) — themes the embed to match the page. |
| `hoursDisplay` | `"lunes a sábado, 8:00 a 14:30"` — single source for displayed hours. |
| `waDoctor` / `waAssistant` | WhatsApp numbers (doctor `525521068585`, assistant `525563232833`). |
| `waDoctorLink` / `waAssistantLink` | `https://wa.me/...?text=Tengo una duda` |

Page sections, top to bottom:
1. **Hero** — name, specialty, years.
2. **Credentials row** — cédula, UNAM, "20+ opiniones verificadas".
3. **Booking widget (PRIMARY CTA)** — `<div id="cal-booking">` filled by the Cal.com
   inline embed. Heading "Agenda tu cita en línea" + hours line.
4. **WhatsApp questions channel** — two small low-weight icon links (doctor +
   assistant) under "¿Dudas? Escríbenos". Demoted; no longer a booking door.
5. **Bio** — experience, hospital, insurers.
6. **Doctoralia trust text** — plain "⭐ 20+ opiniones verificadas en Doctoralia"
   (the booking button was removed).

Two inline scripts (both `is:inline`, so Astro ships them verbatim):
- In `<head>`: **gclid capture** — reads `gclid`/`gbraid`/`wbraid` from the URL into
  `sessionStorage` (keys prefixed `lav_`), and defines `window.getAdAttribution()`.
- Before `</body>`: **Cal.com embed loader + init** — standard Cal embed bootstrap,
  then `Cal("inline", {...})` pointed at `#cal-booking`, then `Cal("ui", {...})` for
  theming. Reads `getAdAttribution()` and passes the keys as booking metadata.

GTM container `GTM-TB2P8V8P` loads in `<head>` (standard snippet, present on both pages).

---

## `cita-confirmada.astro` — the conversion surface

A new static page that **only loads on a successful booking** (Cal.com redirects
here after the slot locks — configured in the Cal.com dashboard, not in code).

Its single `is:inline` script, on load:
1. Pushes **one** `booking_confirmed` event to `dataLayer` (this is the conversion;
   GTM maps it to the Google Ads tag — the Ads tag is NOT inline in the page).
2. Reads booking details from the query params Cal.com forwards
   (`startTime`, `endTime`, `attendeeName`, `uid` — ISO-8601 UTC times), formats
   them in `America/Mexico_City` / `es-MX`, and renders the real appointment.
3. Builds **add-to-calendar** links (Google, Outlook, Apple `.ics` via a data URI).

If params are missing it degrades gracefully (shows "Tu cita ha sido registrada",
hides the calendar buttons) but still fires the conversion.

**Test URL (local):**
```
/cita-confirmada?startTime=2026-07-02T14:00:00.000Z&endTime=2026-07-02T14:30:00.000Z&attendeeName=Mariana%20Lopez&uid=abc123
```
Expect: "jueves, 2 de julio de 2026", "8:00 a.m." (14:00 UTC → UTC-6), working
calendar links, exactly one `booking_confirmed` in `dataLayer`.

---

## The conversion data flow (end to end)

```
Google Ad click (?gclid=...) 
   → index.astro head script stores gclid in sessionStorage
   → patient books in Cal.com embed; gclid attached as booking metadata[gclid]
   → Cal.com locks the slot + two-way syncs to the owned Google Calendar
   → Cal.com redirects to /cita-confirmada?startTime=...&attendeeName=...
   → confirmation page fires booking_confirmed → GTM → Google Ads conversion
   → (Phase 2, later) stored gclid uploaded to Ads when appointment marked attended
```

**Attribution depends on a GTM Conversion Linker** being live on all pages (it
persists the gclid first-party cookie across the page hop). That's GTM config, not
code. Without it, confirmation-page conversions won't attribute to the ad click.

---

## Fixed identifiers — DO NOT CHANGE

- GTM container: `GTM-TB2P8V8P`
- Google Ads Conversion ID: `AW-18189103348`
- Existing event name: `whatsapp_click` (kept; now carries a `contact` param
  `doctor`/`assistant` — the name must not be renamed)
- New conversion event: `booking_confirmed` (fires only on `/cita-confirmada`)

The Google Ads conversion **tag** must never be inlined in a page — it lives in GTM.

---

## Status: built vs. pending

### Done in code (in this branch, not yet pushed)
- [x] gclid/gbraid/wbraid capture + `getAdAttribution()` helper
- [x] Cal.com inline embed as primary CTA, themed, gclid threaded as metadata
- [x] `/cita-confirmada` page (dynamic details + add-to-calendar + `booking_confirmed`)
- [x] WhatsApp demoted to two `contact`-tagged question icons
- [x] Doctoralia booking button removed (reviews trust text kept)
- [x] Hours corrected to 8:00–14:30

### Pending — PLACEHOLDER / BLOCKERS in code
- [ ] **`calLink` is a placeholder** (`"lavielle/consulta"`). Until the real Cal.com
      event type exists and the slug is swapped in (`index.astro` frontmatter), the
      embed renders a Cal.com "not found" iframe and the booking flow can't be
      tested end-to-end. **This is the #1 thing to fix to test real bookings.**

### Pending — manual config OUTSIDE this repo (no code)
- [ ] **Cal.com** event type "Consulta pediátrica": Requires Confirmation = OFF,
      Email Verification = OFF, availability 8:00–14:30 Lun–Sáb, custom questions
      (niño/a, teléfono, motivo), **redirect-on-booking → `https://pediatralavielle.com/cita-confirmada`**,
      two-way Google Calendar sync, booking-created webhook → n8n, daily cap.
- [ ] **Cal.com** second event type "Cita interna" (operator manual entry): same as
      above but **no `/cita-confirmada` redirect** (don't fire ad conversion for
      hand-entered patients).
- [ ] **GTM:** Conversion Linker on all pages; conversion tag (`AW-18189103348` +
      new label) firing on `booking_confirmed` / the `/cita-confirmada` path.
- [ ] **Google Ads:** new conversion action "Booking confirmed - Lavielle" set
      Primary; `whatsapp_click` set Secondary.
- [ ] **n8n + WhatsApp Cloud API** (one dedicated automation number): booking-created
      notifications to operators + day-before two-way confirm. (Roadmap, not v1 code.)

---

## Common troubleshooting

- **Embed shows "not found" / blank box** → `calLink` is still the placeholder, or
  the Cal.com event type/slug doesn't exist. Fix the slug in `index.astro`.
- **Conversion not attributing in Ads** → GTM Conversion Linker missing, or the Ads
  conversion action isn't wired to `booking_confirmed`. Code side only emits the
  dataLayer event; the rest is GTM/Ads config.
- **Confirmation page shows "Tu cita ha sido registrada" with no date** → Cal.com
  isn't forwarding params (enable "Forward parameters" on the redirect, default on),
  or the redirect URL is wrong.
- **Wrong time shown** → times are formatted in `America/Mexico_City`; Cal sends UTC
  in `startTime`. A wrong offset means the source `startTime` is wrong, not the page.
- **Tailwind class not applying** → there is no config file; v4 scans source for
  class strings. Make sure the class is a literal in the markup (not built by string
  concatenation), then restart `npm run dev`.
- **Script changes not taking effect** → confirm the script tag is `is:inline`;
  non-inline `<script>` tags get bundled/hoisted by Astro and behave differently.

---

## Constraints (design + scope)

- No redesign — reuse existing Tailwind tokens; the confirmation page must look like
  the same site. Spanish throughout. Mobile-first, no layout shift.
- Static only — no SSR, no backend, no DB, no new runtime deps beyond the Cal.com
  embed. No patient PII stored in `localStorage`/`sessionStorage` (only the gclid
  attribution key). No secrets committed. No scraping of any external site.
