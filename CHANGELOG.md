# CHANGELOG

## Post-launch fixes (round 4 — EN/TR split into separate static pages)
The site was one bilingual `index.html` with both languages' text always in
the DOM and a JS class-toggle (`.i18n-hidden`) hiding whichever one wasn't
active. That meant: every visitor downloaded both languages regardless of
which one they'd see (real page-weight cost, not just a cosmetic one), crawlers
and link-preview bots that don't execute JS (Bing, LinkedIn, Slack, WhatsApp)
saw both languages as one block of mixed-language text, there was no
per-language URL to share or add `hreflang` to, and the language switch
couldn't be a plain link.

Restructured to two fully separate static pages instead:
- **`template.html`** is now the bilingual source (what `index.html` used to
  be) — edit this, not the generated pages.
- **`scripts/build-lang-pages.js`** (Node + cheerio) reads `template.html`
  and generates `index.html` (English, at the site root) and `tr/index.html`
  (Turkish) — each with *only* its own language physically present in the
  DOM, nothing hidden via CSS. Run `node scripts/build-lang-pages.js` after
  editing `template.html` (one-time `npm install` inside `scripts/` first).
- Each generated page gets its own correct `<html lang>`, `canonical`,
  `og:url`, localised `<title>`/description/OG/Twitter copy, and reciprocal
  `<link rel="alternate" hreflang="en|tr|x-default">` tags pointing at both
  URLs.
- The Turkish page's `assets/...` references are rewritten to `../assets/...`
  since it lives one directory down.
- The language switch in the sidebar/mobile bar is now a real link to the
  other language's page (`tr/` from English, `../` from Turkish) with the
  current language shown as a plain, non-interactive label — not a
  JavaScript toggle.
- Removed the now-dead language-toggle logic from `assets/js/main.js`
  (`applyLang`, `langButtons`, the `.i18n-hidden` class-flipping, and the
  `applyLang('en')` call that would otherwise have force-set `lang="en"` on
  the Turkish page too) and the matching `.i18n-hidden` rule from
  `styles.css`. Theme and currency toggles are unaffected — those still
  work identically via JS on both pages.

## Post-launch fixes (round 3 — SEO)
- `<link rel="canonical">`, `og:url`, `og:image` and `twitter:image` were
  still pointing at the `example.com` placeholder from before the site had
  a real address. Now that it's published, all four point at
  `https://mehmetcihangiryirgal.github.io/mehmet-cihangir-yirgal-portfolio/`,
  and the two image tags are absolute URLs (a relative path in `og:image`
  resolves against the *crawler's* base, not the page's, so link previews
  on LinkedIn/Slack/etc. would have broken).

## Post-launch fixes (round 2)
- **Real bug: subnav links inside a case study (e.g. "3D Zirve '24" /
  "Woman to Women", or Diksiyon's "01 Customer and Content Operations" etc.)
  were kicking the visitor back to the Home page instead of scrolling to
  that part of the page.** Cause: the `hashchange` listener added for
  browser Back/Forward support treated *every* hash change as a top-level
  view request, and since sub-anchors like `#proj-3dzirve` don't match any
  `view-*` id, it fell back to `home` and hid the section the visitor was
  already reading. Fixed by only acting on hashes that name a real view;
  anything else is left to the browser's native same-page anchor scrolling.
- Redesigned `.subnav` from one big pill-shaped container to individual
  rounded chips per link (hover lift, proper focus ring) — the old version
  looked like a single flat bar with no separation between items.
- Fixed the 3D Zirve logo graphic rendering with a large dead band of white
  space above it — the source file had ~230px of empty canvas above the
  actual wordmark. Auto-cropped to the real content bounding box.
- Added a "post + matching story, side by side" layout (`.media-pair`) used
  in two places: the 3D Zirve sponsor-speaker gallery (each person's
  Instagram post next to their own "session started" story, both scaled to
  the same width with nothing cropped) and the Woman to Women hero (launch
  poster next to the closing 4-founder panel poster). Also added 3 more
  individual Woman to Women speaker cards in a 3-up gallery below the hero.
- Removed the "8 months of internal tracking data" tag that was awkwardly
  appended mid-sentence inside the Diksiyon homepage teaser card — it read
  as a UI glitch rather than a badge; the substantive `Verified`/
  `Self-reported` tags elsewhere (which appear as their own line, not stuck
  inside a sentence) were left as-is.

Rebuild of `mehmet-cihangir-yirgal-portfolio-edited (3).html` into a
production-ready static site. Source file: 386 MB single HTML file with all
media base64-embedded. Output: `index.html` (119 KB) + `assets/`.

## Post-launch content additions
- **All gallery/hero frames switched to natural (uncropped) sizing.** Every
  `.media` box — image or video — now renders at the source file's own
  aspect ratio instead of being force-cropped into a fixed 4:3/16:9 box.
  This also fixed a real bug: the three "Reels" videos in the Diksiyon
  Case 01 evidence gallery had picked up the `.media` classes directly on
  the `<video>` tag itself rather than on a wrapping `<div>`, and the CSS
  only sized media as a *descendant* of `.media` — so those three videos
  had no width/height rule at all and rendered at an oversized, uncontrolled
  size that spilled out of their cards. Added a `video.media, img.media`
  rule for that self-tagged case and removed the now-dead `.tall`/`.wide`
  crop variants.
- **ACC Bilkent now has real photography.** Replaced the honest-but-empty
  text evidence list with two separate case cards — "3D Zirve '24" and
  "Woman to Women" — each with a real hero poster and a curated photo
  gallery, using event materials and live event photos supplied directly
  (sponsor speaker cards for QNB, Google, Microsoft, TAV, Some Carbon;
  live photos from the Ankara Chamber of Commerce venue; Woman to Women
  speaker cards and the closing 4-founder panel poster). See TODO.md item 4.
- **Added 3 English-market ad creative videos to the Lernbee case** (Case 04),
  supplied directly, showing the actual adapted advertising referenced in
  that case's "Scope" section ("Existing advertising materials ... translated
  and adapted through HeyGen"). Re-encoded from ~56–65 MB H.264 source files
  down to ~2–3 MB each for web delivery.

## Post-release fixes

### 1. `file://` navigation crash
Opening `index.html` directly via a `file://` URL made every organisation
page (Diksiyon, Robomost, ACC, Bionluk) fail to render past the homepage:
Chrome throws a `SecurityError` on `history.replaceState()` when the
document's origin is `null` (which is what `file://` pages get), and since
that call happened on page load before the language/theme/currency toggles
were wired up, the uncaught error stopped the rest of `main.js` from
running. Fixed by wrapping that call in `try/catch` in `assets/js/main.js`.

### 2. Clicking a case study just scrolled back to the homepage (the real bug)
After fix #1, clicking "Diksiyon Akademi" (or any org) still visibly did
nothing but jump back to the top of the Home page — reproduced this directly
in a real Chrome tab, not just guessed at. Root cause: the CSS `:target`
rule I'd added for a no-JS fallback (`.view:target{display:block;}`)
combined badly with using `history.replaceState()` for *every* navigation,
including the very first one on page load. Chrome set `#view-home` as the
`:target` on that first load and then never re-evaluated `:target` on
subsequent `replaceState()` calls (it only recomputes on a real navigation/
`hashchange`, not on History-API URL swaps) — so `#view-home` stayed
permanently forced to `display:block` by that rule no matter which section
was actually `.active`. Every case-study page *was* rendering underneath;
clicking a nav item scrolled to the top of the document (line 1 of
`main.js`'s `show()` calls `window.scrollTo(0,0)`), which was still the
now-much-taller Home section sitting on top of it. Confirmed the fix by
reading `getComputedStyle(...).display` on both sections after a click
(not just eyeballing a screenshot): before the fix both `view-home` and
`view-diksiyon` reported `"block"` simultaneously; after removing the
`:target` rule, exactly one of them is ever `"block"`. Fixed by deleting
that CSS rule from `assets/css/styles.css`. The `href="#view-xxx"` links
themselves are unaffected and still give keyboard/right-click/deep-link
access — only the CSS-only no-JS fallback was removed, since the small
accessibility nicety wasn't worth risking the primary JS-driven navigation.

## 1. Performance & file structure
- Extracted 24 embedded images and 8 embedded videos out of the single
  386 MB HTML file into `assets/images/` and `assets/videos/`; de-duplicated
  by content hash (a few images/videos were embedded more than once).
- Converted all images to WebP (24 files, 17 MB → 1.3 MB, ~92% smaller).
- Re-encoded all videos to H.264/AAC MP4 with `faststart` (8 files,
  260 MB → 55 MB, ~79% smaller) and generated a poster JPG per video.
- Added `loading="lazy" decoding="async"` to every image except the
  above-the-fold homepage headshot, which loads eagerly.
- Videos already used `preload="metadata"`; kept it and added `poster=` so
  the first frame doesn't need a network round trip to render.
- Moved all CSS into `assets/css/styles.css` and all JS into
  `assets/js/main.js` (previously both were inline in the HTML).
- Result: `index.html` went from 386,031,648 bytes to ~119,000 bytes.

## 2. Removed incomplete / accidental content
- Deleted two `<style>` blocks (`#mttstyle`, `#mttstyleSubtitle`) that were
  leftover CSS from a browser translation/OCR/Tippy.js extension, not part
  of the site.
- Deleted the entire "Edit mode" feature (floating panel, inline
  content-editing, per-image "Replace"/"+ Add image" buttons, `<input
  type="file">` elements, and the "Download edited copy" button/script).
  That tooling was for editing the mockup, not for the published site.
- Rewrote every dashed-border image-mockup placeholder box (`.img-slot`)
  that had no real media into either (a) a matching real `<img>`/`<video>`
  reused from the language that *did* have it, or (b) for ACC Bilkent, an
  honest text-only evidence list, since no photography existed for that
  section in either language. No placeholder boxes remain in the shipped
  page — see the media-parity fixes below for the exact list.
- No empty `data:video/webm;base64,` sources were present in this revision
  of the file (checked; none found).

## 3. Links & conversion
- LinkedIn and CV links were `href="#"` (dead links that looked functional).
  Replaced with plain, visibly non-interactive text plus an inline
  `<!-- TODO(content) -->` comment — see TODO.md items 1.
- Email address converted to a `mailto:` link (sidebar and About → Contact).
- Added a homepage hero CTA row: "View case studies" (jumps straight to the
  strongest case, Diksiyon) and "Contact" (`mailto:`), in both languages. A
  CV-download button was not added since no CV file/URL exists yet
  (TODO.md item 1).
- The four organisation cards on the homepage (`.org-tile`) were `<a>` tags
  with no `href` — unreachable by keyboard and not real links. Gave each a
  real `href="#view-<org>"`; the sidebar/mobile "brand" logo (click-to-home)
  had the same problem and got the same fix.
- Added a CSS `:target` rule (`.view:target{display:block;}`) so those
  `href="#view-xxx"` links reveal the right section even with JavaScript
  disabled, instead of doing nothing.
- Back/forward browser buttons now work correctly: added a `hashchange`
  listener and normalised the hash format (`#view-diksiyon`) used by both
  the links and `history.replaceState`.

## 4. Content & consistency fixes
- Robomost target audience: English said "5–17", Turkish said "5–7" — an
  unresolved conflict. Replaced both with a neutral "school-age children" /
  "okul çağındaki çocukların velileri" and logged a TODO rather than pick a
  number or show two different figures on the page.
- Reconciled the Diksiyon role/date discrepancy: "Digital Operations Lead —
  September 2022" (Diksiyon page) vs. "Growth & Operations Lead — May 2023"
  (About page) vs. "Executive Assistant ... to May 2024" (Case 01 header).
  Standardised on: organisation start = September 2022, role change =
  May 2023, title = "Growth & Operations Lead" (current) / "Executive
  Assistant" (Sep 2022–May 2023, matching the case study's own "the official
  role was Executive Assistant" line — the About page previously said
  "Administrative Assistant", now corrected to match). Case 01's date range
  was adjusted from "...to May 2024" to "...to May 2023" for the same reason.
  Flagged for your confirmation in TODO.md item 9.
- Did **not** alter the 1,000–1,500 vs. 106–272 monthly-sales figures — both
  are already tagged "Self-reported" and may cover different scopes; flagged
  in TODO.md item 3 instead of guessing which is right or deleting either.
- "Demo Registiration" → "Demo Registration".
- "Coparate Landing Page" → "Corporate Landing Page" (checked the actual
  screenshot — it's the "Yirmibirgün for Business" B2B landing page, so
  "Corporate" is accurate; it was a typo, not a wrong label).
- "pricing,currency,&nbsp; CTA" → "pricing, currency, CTA" (both occurrences).
- "Google Ads Manager" → "Google Ads" (both languages, Skills section).
- Removed both "to confirm" / "teyit edilecek" chips from visible copy
  (ACC Bilkent "solo vs. team on assets", Bionluk "true order/earnings
  total") and moved the specifics to TODO.md + inline `<!-- TODO(content) -->`
  comments instead.
- Fixed English/Turkish media mismatches: in several galleries the English
  copy showed the real screenshots/videos while the Turkish copy showed a
  *different*, invented-sounding placeholder description with no media
  attached. Fixed by reusing the same real file in both languages, with a
  faithful Turkish caption:
  - Diksiyon Case 01 — YouTube analytics screenshot
  - Diksiyon Case 02 — 3 ad-creative test videos
  - Diksiyon Case 03 — VSL/checkout/UI evidence gallery (3 images)
  - Diksiyon Case 04 (Lernbee) — hero screenshot + 3-image localisation gallery
  - Robomost — hero ad creative + 2-image gallery (this also removed a set of
    Turkish captions that referenced a fabricated "5–7 yaş segmenti" ad
    creative that didn't correspond to any real image)
  - Bionluk — hero image + 2 motion/design sample videos
- Preserved the existing "Verified" / "Self-reported" / "Context" tag
  system as-is; did not upgrade or downgrade any claim's evidence tier.

## 5. Homepage & information architecture
- Added a 3-stat highlight row under the hero (4 orgs/4 years, 750K+
  Instagram reach — Verified, ~5–6x ROAS — Self-reported): all three numbers
  already existed elsewhere on the site, nothing new was introduced.
- Case-study order on the homepage (Diksiyon → Robomost → ACC → Bionluk) was
  already priority-ordered by strength of evidence, so it was left as-is.
- Did not do a full rewrite/re-sequencing of every case study into a strict
  Problem→Role→Actions→Results→Evidence→Limitations template, or a uniform
  30–40% length cut — see TODO.md item 10 for why, and what a follow-up pass
  would need from you.

## 6. Accessibility
- Added meaningful `alt` text to every image that was missing one (ACC and
  Bionluk header/org-grid logos), and to every gallery image that only had a
  visual figcaption before.
- Fixed the actual default-view bug: the raw HTML had `class="view active"`
  hardcoded on the **Bionluk** section (and "active" on its nav buttons) —
  meaning with JavaScript blocked or slow to load, visitors saw the Bionluk
  freelance page instead of the homepage. Moved `active` to the Home section
  and its nav buttons instead.
- Added `aria-current="page"` to the active nav link/button, kept in sync by
  `main.js` on every navigation.
- Added `aria-pressed` (true/false, kept in sync by JS) to every
  theme/language/currency toggle button, sidebar and mobile.
- `<html lang>` now actually switches between `en`/`tr` when the language
  toggle is used (previously only `data-lang` was set; `lang` never changed).
- Added a "Skip to content" link as the first focusable element in the page.
- Added a visible `:focus-visible` outline site-wide (previously no custom
  focus style existed).
- Added a `prefers-reduced-motion` media query that disables smooth-scroll
  and shortens transitions/animations to near-zero for users who request it.
- Darkened the light theme's `--muted` token from `#8b8a84` (≈3.5:1 on white,
  failing WCAG AA) to `#6b6a65` (≈5.4:1), since it's used for small text
  (stat labels, kickers, captions) throughout the site.
- No `<track>` captions were added for the 8 videos — none existed in the
  source and a fabricated one would be worse than none; logged in TODO.md.

## 7. Language, currency & theme
- Language, theme, and currency preferences were already read only per
  session (not persisted) in the source; this rebuild keeps the same runtime
  behaviour and only fixes the bugs above — no `localStorage` persistence
  layer existed in the original file to preserve or extend within scope of
  this fix pass.
- Number formatting now uses `tr-TR` when the site is in Turkish and
  `en-GB` when in English (previously always hardcoded to `en-US`).
- The live FX-rate fetch now checks `response.ok` before parsing JSON, so a
  non-2xx response falls back to the static rate instead of risking a thrown
  error mid-parse. The static fallback note is dated ("approx. as of 28 Aug
  2026") in both the visible text and the JS comment.
- Added a theme (Light/Dark/Auto) toggle to the mobile toolbar — previously
  the only theme control lived in the desktop sidebar, which is hidden on
  mobile, so mobile visitors had no way to change theme at all.

## 8. SEO & sharing
- Rewrote `<title>` and meta description to be more specific.
- Added Open Graph and Twitter Card tags (title, description, image, type).
- Added a `<link rel="canonical">` placeholder (marked TODO — needs the real
  domain once published).
- Added a minimal `Person` JSON-LD block using only facts already present in
  the page (name, job title, contact email, languages, alma mater).
- Added a simple SVG favicon (`assets/images/favicon.svg`).

## 9. Code quality
- Removed all inline `style="position:absolute;inset:0;..."` /
  `style="background:none;border:1px solid var(--line)..."` repetition
  (dozens of near-identical inline styles across every gallery image) in
  favour of two reusable CSS classes: `.media` (fixed-aspect, cropped cover)
  and `.media.natural` (full-width, natural aspect ratio, used for
  screenshots that shouldn't be cropped).
- Removed the now-unused `.img-slot` placeholder CSS (dashed border/
  striped-background mockup styling) since no placeholder boxes remain.
- Deduplicated the repeated headshot inline style into a `.headshot-slot`
  class (was previously the same `style="width:160px;height:160px;..."`
  string pasted twice).
- No build tooling or framework added — plain HTML/CSS/JS throughout, per
  the brief.

## Known limitations (see TODO.md for the full list with detail)
- LinkedIn URL and CV file are placeholders (visibly non-functional, not
  hidden dead links).
- Robomost audience age range shown without specific numbers pending
  confirmation.
- ACC Bilkent has no photography; shown as an honest text evidence list.
- Two monthly-sales figures (1,000–1,500 vs. 106–272) may describe different
  scopes and were left as-is with a TODO rather than guessed at.
- No video captions/subtitles (none existed in the source).
- Case studies were not uniformly shortened by 30–40% or fully
  re-sequenced into a single fixed template — partial tightening only.
