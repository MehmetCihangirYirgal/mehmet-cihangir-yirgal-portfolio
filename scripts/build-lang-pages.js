// Splits template.html (the bilingual source, with .lang-en / .lang-tr blocks) into two
// separate static pages: /index.html (English) and /tr/index.html (Turkish) — each with only
// its own language physically present in the DOM, its own canonical/OG/hreflang tags, and a
// plain link (not a JS toggle) to the other language's page.
//
// Run after editing template.html:  node scripts/build-lang-pages.js
// (requires `npm install` inside this scripts/ folder once, for the cheerio dependency)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'template.html');
const SITE_BASE = 'https://mehmetcihangiryirgal.github.io/mehmet-cihangir-yirgal-portfolio/';

const COPY = {
  en: {
    htmlLang: 'en',
    title: 'Mehmet Cihangir Yırgal — Digital Marketing Portfolio',
    description: 'Digital marketing portfolio of Mehmet Cihangir Yırgal, covering paid acquisition, sales funnels, commercial operations and international digital product localisation.',
    url: SITE_BASE,
    assetPrefix: '',
    otherLangHref: 'tr/',
    otherLangLabel: 'TR',
    selfLangLabel: 'EN',
    ariaLabels: null,
  },
  tr: {
    htmlLang: 'tr',
    title: 'Mehmet Cihangir Yırgal — Dijital Pazarlama Portföyü',
    description: 'Reklam, satış hunileri, ticari operasyonlar ve uluslararası dijital ürün lokalizasyonunu kapsayan Mehmet Cihangir Yırgal dijital pazarlama portföyü.',
    url: SITE_BASE + 'tr/',
    assetPrefix: '../',
    otherLangHref: '../',
    otherLangLabel: 'EN',
    selfLangLabel: 'TR',
    ariaLabels: { Theme: 'Tema', Language: 'Dil', Currency: 'Para Birimi' },
  },
};

function buildPage(lang) {
  const other = lang === 'en' ? 'tr' : 'en';
  const c = COPY[lang];
  const html = fs.readFileSync(TEMPLATE, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  // 1. drop the other language's content entirely (not just hide it)
  $('.lang-' + other).remove();
  // 2. strip the now-meaningless language/visibility classes from what's left
  $('.lang-' + lang).removeClass('lang-en lang-tr i18n-hidden');

  // 3. <html lang="…" data-lang="…">
  $('html').attr('lang', c.htmlLang).attr('data-lang', c.htmlLang);

  // 4. title / description / OG / Twitter copy
  $('title').text(c.title);
  $('meta[name="description"]').attr('content', c.description);
  $('meta[property="og:title"]').attr('content', c.title);
  $('meta[property="og:description"]').attr('content', c.description);
  $('meta[name="twitter:title"]').attr('content', c.title);
  $('meta[name="twitter:description"]').attr('content', c.description);

  // 5. canonical / og:url -> this page's own URL
  $('link[rel="canonical"]').attr('href', c.url);
  $('meta[property="og:url"]').attr('content', c.url);

  // 6. reciprocal hreflang alternates, right after the canonical tag
  $('link[rel="canonical"]').after(
    `\n<link rel="alternate" hreflang="en" href="${SITE_BASE}">` +
    `\n<link rel="alternate" hreflang="tr" href="${SITE_BASE}tr/">` +
    `\n<link rel="alternate" hreflang="x-default" href="${SITE_BASE}">`
  );

  // 7. the Turkish page lives one directory deeper, so every relative assets/ reference
  //    needs a "../" prefix; the English page keeps them as-is at the root
  if (c.assetPrefix) {
    $('[href^="assets/"]').each((_, el) => {
      const $el = $(el);
      $el.attr('href', c.assetPrefix + $el.attr('href'));
    });
    $('[src^="assets/"]').each((_, el) => {
      const $el = $(el);
      $el.attr('src', c.assetPrefix + $el.attr('src'));
    });
    $('[poster^="assets/"]').each((_, el) => {
      const $el = $(el);
      $el.attr('poster', c.assetPrefix + $el.attr('poster'));
    });
  }

  // 8. language switch: a static label for the current page's language, and a real link
  //    to the other language's page — no JS toggle, since each page is single-language now
  $('.toggle-group[aria-label="Language"]').each((_, el) => {
    const $el = $(el);
    $el.empty();
    $el.append(`<span class="active" aria-current="true">${c.selfLangLabel}</span>`);
    $el.append(`<a href="${c.otherLangHref}">${c.otherLangLabel}</a>`);
  });

  // 9. translate the (non-visible) aria-label attributes on the Turkish page so screen
  //    readers announce them in Turkish; the elements/behaviour themselves are untouched
  if (c.ariaLabels) {
    Object.entries(c.ariaLabels).forEach(([enLabel, trLabel]) => {
      $(`[aria-label="${enLabel}"]`).attr('aria-label', trLabel);
    });
  }

  // cheerio already preserves the original <!doctype html> from the parsed template
  return $.html();
}

fs.writeFileSync(path.join(ROOT, 'index.html'), buildPage('en'), 'utf8');
fs.mkdirSync(path.join(ROOT, 'tr'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'tr', 'index.html'), buildPage('tr'), 'utf8');
console.log('Built index.html (EN) and tr/index.html (TR) from template.html');
