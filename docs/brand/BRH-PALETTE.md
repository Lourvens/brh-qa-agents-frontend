# BRH Brand Palette — Live Extraction

**Extracted:** 2026-07-20
**Source:** https://www.brh.ht (live)
**Method:** `agent-browser` CLI + `curl` against the live site. Authoritative
for every chrome decision until a BRH brand refresh ships a new release.

This file is the **provenance** for the brand tokens referenced in
[`docs/UIUX-PRINCIPLES.md`](../UIUX-PRINCIPLES.md) §5. The principles
file is the source of truth for *how* we apply these tokens. This
file is the source of truth for *what they are*.

---

## 1. Primary palette

| Token (frontend)   | Hex       | Source on brh.ht                                | Role                                         |
|--------------------|-----------|--------------------------------------------------|----------------------------------------------|
| `primary`          | `#05155b` | Splash background; `#05155b` on body / hero    | Brand navy — header, splash, primary CTA      |
| `primary-2`        | `#213a8c` | `slashc.two-tier-menu.css` background           | Secondary navy — nav hover, sub-surfaces      |
| `accent`           | `#005c8a` | Section headers, link accents                   | Teal — info highlights, callouts             |
| `destructive`      | `#e02a20` | `data-hover-color` on social icon strip         | Red — destructive / rare accent              |
| `muted-surface`    | `#f1f5f9` | `.wp-block-button` / card backgrounds            | Cool grey-blue — page surface, card bg       |
| `background`       | `#ffffff` | Default body                                    | Light theme base                              |
| `foreground`       | `#05155b` | Default body text                               | Light theme text                              |

The deep navy `#05155b` is the dominant BRH brand color — the splash
screenshot in this folder shows it as the page background on cold
load. The WordPress theme derives two related navies (`#031a71`,
`#213a8c`) for layered surfaces; we collapse them to one `primary-2`.

---

## 2. Typography stack

Extracted from `<style>` and `<link>` declarations in
`brh-homepage-snapshot-2026-07-20.html`.

| Role          | Family                                  | Source on brh.ht                           |
|---------------|------------------------------------------|---------------------------------------------|
| Headings      | `Montserrat` (600, 500)                 | Google Fonts                                |
| Body          | `Roboto` (400, 500)                      | Google Fonts                                |
| System backup | `Poppins`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` | Stack fallback          |
| Icons         | `fontAwesome` (BRH site) — we **don't use this**; we use `lucide-react` | shadcn / AI Elements default |

Loaded via `next/font/google` in the Next.js app so the fonts ship
self-hosted — no third-party requests from a French user.

---

## 3. Logo / wordmark

The BRH ship a "BRH" wordmark in two color variants.

| Variant         | File                                | Dimensions  | Background | Letters |
|-----------------|-------------------------------------|-------------|------------|---------|
| Light (default) | `public/brh-logo-light.png` | 251 × 123 px | `#ffffff`  | `#05155b` (navy) |
| Dark            | `public/brh-logo-dark.png`  | 251 × 123 px RGBA | transparent | `#ffffff` (white) |

**Source URLs:**
- Light: `https://www.brh.ht/wp-content/themes/brh/img/logo.png`
- Dark:  `https://www.brh.ht/wp-content/uploads/logo-dark.png`

Usage rule (mirroring the BRH site):

- **Dark variant** on `bg-primary` surfaces (header bar, splash).
- **Light variant** on `bg-background`, `bg-card`, or `bg-muted`
  surfaces.

If a higher-fidelity / vector version is needed later, the BRH uses
the same wordmark across its publications — email
`webmaster@brh.ht` (from the LinkedIn corporate record) to ask. Do
**not** scrape the BRH site for additional versions; this extraction
is sufficient for v1.

---

## 4. Surfaced behavior (browsed live on 2026-07-20)

Notes from actually navigating brh.ht with `agent-browser`.

- The site is WordPress (`wp-content/themes/brh/`).
- The site loads content via JS hydration — `document.body.innerHTML`
  is empty until the splash transitions to the homepage. The splash
  *itself* is the brand surface and sets expectations.
- The BRH publishes Volume 5 of the RDDCF series with a dedicated
  banner image (`banner-web-site-RDCCF-VOL-5-scaled.png`) — referenced
  in the slider. This is the same corpus the backend queries against
  (ADR-0015 in the backend repo), so the visual continuity between
  the BRH site and our chat UI is intentional and natural.
- The site ships only in French (no English locale). Matches the
  French-only constraint in the principles file §1.6.

---

## 5. What we are NOT copying

These are deliberate non-decisions, recorded so the next session
doesn't re-derive them.

- **WordPress.** Don't add WP files to the repo.
- **`fontAwesome`.** Lucide is the established shadcn icon set; we
  follow that.
- **The literal splash screen.** Our app is a chat, not a billboard.
  The navy colour carries over; the loading dots do not.
- **The carousel slider.** Our home is a single conversation; no
  carousels, no rotating banners.
- **Per-section background colours.** The BRH site uses several
  navy variants for layering — we collapse to two (`primary`,
  `primary-2`) per the principles doc.

---

## 6. Re-running this extraction

The BRH site can change. To re-validate:

```bash
agent-browser close --all
agent-browser --args "--no-sandbox" open https://www.brh.ht
agent-browser wait 6000

# Pull the rendered HTML and search for hex values
curl -sL --max-time 15 https://www.brh.ht \
  -o /tmp/brh-home.html \
  && grep -oE 'background[^;}]*#[0-9a-fA-F]{3,8}' /tmp/brh-home.html \
       | sort -u

# Wordmark
curl -sL --max-time 15 \
  https://www.brh.ht/wp-content/themes/brh/img/logo.png \
  -o /tmp/brh-logo.png

# Splash screenshot
agent-browser screenshot /tmp/brh-splash.png
```

If the hex values change, the principles file §5 must be updated and
this file regenerated. If only the WordPress theme version bumps, we
ignore the diff (we're after chroma + type, not markup).

---

## 7. Sources used during extraction

| Source                              | What it gave us                                                |
|-------------------------------------|----------------------------------------------------------------|
| `curl https://www.brh.ht` (raw HTML) | Color hex dumps, font-family declarations, image URLs          |
| `curl …/img/logo.png`               | Light wordmark                                                  |
| `curl …/uploads/logo-dark.png`      | Dark wordmark                                                   |
| `agent-browser open + screenshot`   | Splash visible state (proves the navy IS the brand surface)   |
| `mcp__exa__web_fetch_exa`           | Page content for semantic reference (loaded text, structure)   |
| LinkedIn corporate record            | Contact (webmaster@brh.ht) for higher-fidelity logo if needed |
