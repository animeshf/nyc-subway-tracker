# Testing the NYC Subway Tracker homepage

Applies when: verifying changes to `static/index.html`, `static/app.js`, or `static/style.css` — especially anything that affects the hero, search card, CTA (`#search-btn`), or responsive layout.

## Run the app locally

```
cd /home/ubuntu/repos/nyc-subway-tracker
python app.py   # Flask dev server on http://localhost:5000
```

No auth, no external services — all station data is served by Flask directly. The API endpoint used by the search flow is `GET /api/arrivals?station_id=<id>`.

## Viewports to test

The CSS is mobile-first: base styles target small screens, and desktop values live under `@media (min-width: 681px)` and `@media (min-width: 821px)` in `static/style.css`. Always test at BOTH of these in Chrome DevTools responsive mode:

- **Mobile:** 375 × 667 (iPhone SE class). Expected: body padding 12 px, `.hero-entrance` padding-inline 22 px, input 52 px tall, CTA 54 px min-height, arrivals grid single-column, `.cta-dock` is `position: fixed; bottom: 0`.
- **Desktop:** 1024 × 768. Expected: body padding `20px 16px 88px`, `.hero-entrance` padding-left 42 px, input 56 px tall, CTA 56 px, arrivals grid multi-column, `.cta-dock` is `position: static` inside `.search-card`.

DevTools zoom can end up at "Auto-adjust" after resizing — always explicitly set it to 100% before measuring, otherwise `getBoundingClientRect()` values will be wrong.

## Key selectors

| Purpose | Selector |
| --- | --- |
| Search input | `#station-search` |
| Primary CTA button | `#search-btn` (Shoelace `<sl-button>`) |
| CTA wrapper (thumb-zone dock on mobile) | `.cta-dock` |
| Search card container | `.search-card` |
| Hero/header | `.hero-entrance` |
| Station results heading | `#station-info` |
| Arrivals grid | `#station-results` |
| Recent / Favorites blocks | `#quick-access` |

## Golden-path search flow

1. Clear state so you see the first-visit UI: `localStorage.clear(); sessionStorage.clear(); location.reload();`
2. Click `#station-search`, type `times`.
3. Click the `Times Sq-42 St` item in the autocomplete dropdown (a `div[data-name="Times Sq-42 St"]`). That triggers `searchArrivals()` and populates `#station-info`.
4. Verify `#station-info` text contains `Times Sq-42 St` and the 13-line arrivals grid renders.

The CTA `#search-btn` has `onclick="searchArrivals()"` — you can click it instead of picking an autocomplete suggestion, as long as the input text exactly matches a station name.

## Computed-style assertions (run via DevTools console)

Always wrap in an IIFE — bare expressions that end in `;` return `undefined` from the console bridge.

```js
(() => {
  const dock = document.querySelector('.cta-dock');
  const btn  = document.getElementById('search-btn');
  const card = document.querySelector('.search-card');
  return {
    viewport: { w: innerWidth, h: innerHeight },
    dock: { ...getComputedStyle(dock), rect: dock.getBoundingClientRect() },
    btn:  { rect: btn.getBoundingClientRect() },
    card: card.getBoundingClientRect(),
    scrollWidth: document.documentElement.scrollWidth,
  };
})()
```

Mobile invariants to check:
- `.cta-dock` computed `position === 'fixed'`, `bottom === '0px'`
- `#search-btn` `rect.bottom` is within ~40 px of `innerHeight` (the dock is flush with the viewport bottom, minus any safe-area-inset-bottom)
- `scrollWidth === innerWidth` at 375 (no horizontal overflow)
- `body { padding-bottom: 108px }` must be >= dock height so homepage content is not hidden under the bar
- After search → `window.scrollTo(0, document.body.scrollHeight)`, dock still pinned (`rect.bottom === innerHeight`)

Desktop regression invariants:
- `.cta-dock` computed `position === 'static'`, `boxShadow === 'none'`, `borderTopWidth === '0px'`, `padding === '0px'` — mobile-only decorative styles must not leak
- `#search-btn` rect is vertically inside `.search-card` rect (no fixed-position leak)
- `scrollWidth === 1024`

## Shoelace `<sl-button>` shadow-DOM caveat

`#search-btn` is an `<sl-button>` custom element. The visible gradient, padding, and min-height are applied via `::part(base)` inside the shadow DOM. Consequences:

- `getComputedStyle(btn).backgroundImage` returns `"none"` even when the gradient is visibly applied.
- `getComputedStyle(btn).minHeight` may return `"0px"` for the same reason.
- Rely on **rendered dimensions** (`getBoundingClientRect().width/height`) and **screenshots** as source-of-truth for the button's visual size/appearance.

The `::part(base)` CSS lives in `static/style.css` next to the `.sl-primary-btn` rules.

## What NOT to do

- Don't start a recording while still setting up the viewport — recording captures setup steps. Do the viewport/zoom/localStorage reset first, then `record_start`, then execute.
- Don't rely on `getComputedStyle` of the Shoelace host element for visual styles — see caveat above.
- Don't use `curl`/`fetch` to hit `/api/arrivals` directly when validating the UI — the search flow is already wired and is the thing under test.

## Devin secrets needed

None. Local Flask, no auth, no external APIs.
