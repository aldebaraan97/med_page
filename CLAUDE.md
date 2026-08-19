# CLAUDE.md — `med_page` (Pediatra Lavielle landing page)

Context doc for troubleshooting. Self-contained: you can reason about this project
without repo access. Pairs with `BOOKING_PROJECT_SPEC.md` (the *why* of the booking
work) and `BOOKING_CLAUDE_CODE_PROMPT.md` (the *how*), which live one directory up.

> **This doc was rewritten to match the componentized, config-driven codebase.**
> An earlier version described a single-file `index.astro` with an inline Cal.com
> embed as the primary CTA — that is obsolete. If anything here disagrees with the
> code, the code wins; fix this doc.

---

## What this is

A single-page paid-ad landing page for **Dr. Vicente Joaquín Lavielle Sotomayor**
(pediatra, Cuautitlán Izcalli, Estado de México). It is the conversion surface for
Google Ads traffic.

- **Live site:** https://pediatralavielle.com/
- **Repo:** https://github.com/aldebaraan97/med_page (deploys from `main` on push, Cloudflare Pages)
- **This is the LIVE website.** Pushing to `main` deploys to production. Work on a branch.

**Current contact model:** `booking.mode` is `"whatsapp"`. Patients reach the doctor
via WhatsApp CTAs (hero + sticky dock); he agrees a time in chat and enters it
himself. The Cal.com self-serve booking flow is **built but dormant** — it only
renders when `booking.mode` is flipped to `"self-serve"` (see below).

---

## Stack

- **Astro** + **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (CSS-first; there
  is **no `tailwind.config.js`**). Static, zero-runtime output — no SSR, no backend.
- Exact versions live in `package.json` (`engines` pins the Node floor). Treat
  `package.json` as the source of truth for versions — do not hardcode a version in
  this doc again.
- The only stylesheet is `src/styles/global.css`: `@import "tailwindcss";` plus an
  **`@theme` block** that defines the design tokens (brand colors, `font-display`,
  `max-w-wrap`, radius, spacing). Components reference these tokens; nothing is
  hardcoded hex.
- No database, no API keys, no secrets, no runtime deps beyond the Cal.com embed
  script (which only loads in self-serve mode).

### Commands
```bash
npm install
npm run dev      # dev server
npm run build    # static output to dist/
npm run preview  # serve the built dist/
```

---

## Architecture — the important part

**`src/config/client.ts` + the `@theme` block are the entire per-client delta.**
Cloning to another client (e.g. the dental prospect) should touch those two places
and nothing else. Components in `src/components/` are **client-agnostic**: if a change
forces client content into a component, that's the signal the component needs a
**prop**, with the literal staying in `client.ts`.

```
med_page/
├── astro.config.mjs
├── package.json
├── public/                     # favicons, static passthrough
└── src/
    ├── assets/                 # optimized images (portrait, consultorio) — Astro <Image>
    ├── config/
    │   └── client.ts           # THE per-client config (see below)
    ├── layouts/
    │   └── Base.astro           # <head>, GTM, shared shell for both pages
    ├── lib/
    │   ├── maps.ts             # Google Maps link/embed helpers (Place ID → URL)
    │   └── schema.ts           # schema.org structured data (reads client.ts)
    ├── components/
    │   ├── Hero.astro          # eyebrow, name (H1), lede, WhatsApp CTA, + portrait
    │   ├── Credentials.astro   # cédulas, formación, reviews
    │   ├── Booking.astro       # Cal.com inline embed — self-serve mode ONLY
    │   ├── Services.astro      # the services array
    │   ├── Vaccines.astro      # #vacunas section (config-driven, optional)
    │   ├── Pricing.astro       # price rows
    │   ├── Locations.astro     # the three consultorios (maps via lib/maps.ts)
    │   ├── Consultorio.astro   # bottom photo section (config-driven, optional)
    │   ├── Questions.astro     # WhatsApp questions channel — self-serve mode ONLY
    │   ├── SiteFooter.astro
    │   ├── Dock.astro          # sticky bottom WhatsApp CTA
    │   ├── WhatsAppCta.astro   # the WhatsApp button (fires whatsapp_click)
    │   └── WhatsAppIcon.astro
    └── pages/
        ├── index.astro         # assembly order only — no literals, no logic beyond the mode gate
        └── cita-confirmada.astro   # conversion surface — self-serve flow only
```

### `index.astro` is an assembly order
It imports the components and lays them out. The only logic is the mode gate:
```
Hero → Credentials → [Booking] → Services → [Vaccines] → Pricing → Locations
     → [Consultorio] → [Questions] → SiteFooter → Dock
```
- `{selfServe && <Booking />}` and `{selfServe && <Questions />}` render only when
  `booking.mode === "self-serve"`.
- `{client.vaccines && <Vaccines />}` and `{client.consultorio && <Consultorio />}`
  render only when those optional config blocks exist — so the dental clone drops
  them by omitting the block, no code change.

### `client.ts` — what lives there
`site`, `booking` (`mode` + `calLink`), `practitioner` (name, specialty, licenses,
tenure, **`photo`**), `contact` (whatsapp digits + prefill), `hours` (display +
schema.org), `locations[]` (name, address, Place ID, lat/lng), `services[]`,
`prices[]`, `insurers[]`, `copy` (title/description/eyebrow/lede/CTA labels),
`tracking` (`gtmId`), and the optional **`vaccines`** and **`consultorio`** blocks.

Images are **imported at the top of `client.ts`** and referenced in the config
(`photo.src`, `consultorio.images[].src`, typed `ImageMetadata`). This keeps the
per-client delta in one file while still using Astro's `<Image>` optimization.

### The `booking.mode` knob
- `"whatsapp"` (current): the doctor is the contact channel. Hero + Dock WhatsApp
  CTAs are the whole call-to-action. `Booking` and `Questions` do not render.
- `"self-serve"`: the Cal.com inline embed becomes the primary CTA under the
  credentials; WhatsApp demotes to a `Questions` channel near the end; bookings
  redirect to `/cita-confirmada`, which fires `booking_confirmed`.
- Both modes terminate at the same calendar, so the downstream n8n reminder flow is
  identical. This is a per-client knob, not a global decision.

---

## Current client facts (from `client.ts`, confirmed 2026-07-15 unless noted)

- **Name:** Dr. Vicente Joaquín Lavielle Sotomayor.
- **Hours:** Lunes a sábado, 8:00 a 17:00 (`Mo-Sa 08:00-17:00`). *This supersedes the
  earlier 8:00–14:30 in the booking spec — 17:00 is the re-confirmed value.*
- **WhatsApp:** `525521068585` (doctor). Prefill: appointment request.
- **Locations (three):** Hospital San Rafael (Parque Industrial La Luz),
  Hospital Polimédica de Lago (Bosques de Morelos), Grupo Médico Madrid (no Place ID
  yet → maps link falls back to an address text query).
- **Price:** $600 MXN for most services and for cartas/certificados.
- **Insurers:** GNP, MetLife, Seguros Monterrey.
- **`#vacunas` section:** Triple Viral (SRP) and Doble Viral (SR), applied by the
  doctor. The vaccination Google Ads ad group's final URL is
  `https://pediatralavielle.com/#vacunas` — **the anchor must stay exactly `vacunas`.**

---

## Tracking / fixed identifiers — DO NOT CHANGE

- GTM container: `GTM-TB2P8V8P` (loads in `Base.astro`, present on all pages).
- `whatsapp_click` — the live conversion event. Fired by `WhatsAppCta`. Carries a
  `context` param (`hero`, `dock`, `vacunas`, …) to distinguish which CTA. **Never
  rename the event; adding a new `context` value is fine.**
- Google Ads Conversion ID `AW-18189103348` and the `booking_confirmed` event are
  reserved for the self-serve flow. The Ads conversion **tag** lives in GTM, never
  inline in a page.

---

## `cita-confirmada.astro` (self-serve only, currently dormant)

Loads only after a successful Cal.com booking (Cal redirects here — dashboard config,
not code). On load it pushes one `booking_confirmed` event, reads booking params
(`startTime`/`endTime`/`attendeeName`/`uid`, ISO-8601 UTC), formats them in
`America/Mexico_City` / `es-MX`, renders the real appointment, and builds
add-to-calendar links (Google / Outlook / Apple `.ics`). Degrades gracefully if
params are missing but still fires the conversion. Inert while `booking.mode` is
`"whatsapp"`.

---

## Common troubleshooting

- **A literal is wrong on the page** → it lives in `client.ts`, not in a component.
  Fix it there. If you can't find a knob for it, the component is missing a prop.
- **Tailwind class not applying** → no config file; v4 scans source for literal class
  strings. Make sure the class is a literal (not built by string concatenation),
  then restart `npm run dev`.
- **Color looks off / hardcoded** → colors come from the `@theme` block via `bg-brand`,
  `text-paper`, etc. Don't hardcode hex in a component.
- **Image not optimizing / type error** → local images must be imported (returns
  `ImageMetadata`) and passed to `<Image>`; per-client images are imported in
  `client.ts` and referenced through the config.
- **`whatsapp_click` not firing** → confirm the tag is on `WhatsAppCta` and the event
  name is unchanged; `context` is only a param.
- **Booking/Questions/Cal embed missing** → expected: `booking.mode` is `"whatsapp"`.
  Flip to `"self-serve"` (and set a real `calLink`) to bring them back.
- **`#vacunas` heading hidden on scroll** → the sticky Dock; the section uses
  `scroll-margin-top` to clear it.
- **Script not taking effect** → confirm it's `is:inline`; non-inline `<script>` gets
  bundled/hoisted by Astro and behaves differently.

---

## Constraints (design + scope)

- No redesign — reuse existing `@theme` tokens and component patterns. Spanish
  throughout. Mobile-first, no layout shift.
- Static only — no SSR, no backend, no DB, no new runtime deps. No patient PII stored
  anywhere. No secrets committed. No scraping of any external site.
- `client.ts` + `@theme` are the per-client delta. A clone that forces edits into
  `src/components/` means a component needs a prop, not a fork.

---

## Status

**Live (whatsapp mode):** hero (now with portrait + full legal name), credentials,
services (incl. the vaccination line), `#vacunas` section, pricing, three locations,
consultorio photo section, footer, sticky WhatsApp dock.

**Built but dormant (self-serve mode):** Cal.com embed (`Booking`), `Questions`
channel, `/cita-confirmada` conversion page, `booking_confirmed`. Needs a real
`calLink` + the Cal.com/GTM/Ads/n8n config in `BOOKING_CLAUDE_CODE_PROMPT.md` before
it can be switched on.

**Open data:** vaccine price (services note is a `"Consultar"` placeholder);
Grupo Médico Madrid Place ID + coordinates; exact accent/spelling of "Joaquín" on the
cédula.