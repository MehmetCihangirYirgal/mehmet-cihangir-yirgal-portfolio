(function () {
  'use strict';

  var views = document.querySelectorAll('.view');
  var navButtons = document.querySelectorAll('[data-nav]');
  var order = ['home', 'about', 'diksiyon', 'robomost', 'acc', 'bionluk'];

  // hrefs use the real section id ("#view-diksiyon") so the links work, are keyboard-
  // reachable and degrade via CSS `:target` with JS disabled; normalise back to the
  // bare id ("diksiyon") the rest of this script works with.
  function idFromHash() {
    return (location.hash || '').replace('#', '').replace(/^view-/, '');
  }

  function show(id) {
    views.forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + id); });
    document.querySelectorAll('.navlink, nav.mobile-primary button').forEach(function (b) {
      var isActive = b.getAttribute('data-nav') === id;
      b.classList.toggle('active', isActive);
      if (isActive) { b.setAttribute('aria-current', 'page'); }
      else { b.removeAttribute('aria-current'); }
    });
    window.scrollTo(0, 0);
    // Chrome throws a SecurityError for pushState/replaceState when the page is opened
    // directly as a file:// URL (origin "null") — never let that break navigation.
    try { history.replaceState(null, '', '#view-' + id); } catch (err) { /* file:// origin, ignore */ }
  }
  navButtons.forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      show(el.getAttribute('data-nav'));
    });
  });
  var initial = idFromHash() || 'home';
  if (!document.getElementById('view-' + initial)) initial = 'home';
  show(initial);

  // keep the SPA in sync with the browser's Back/Forward buttons (hash navigation).
  // Only act on hashes that name a real top-level view ("#view-diksiyon", "#diksiyon", ...);
  // anything else (e.g. an in-page subnav anchor like "#proj-3dzirve") is left alone so the
  // browser's native same-page anchor scroll can do its job without us yanking the view back
  // to Home underneath it.
  window.addEventListener('hashchange', function () {
    var id = idFromHash();
    if (!id || !document.getElementById('view-' + id)) return;
    show(id);
  });

  // keyboard shortcuts 1-6, ignored while typing in a field
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= order.length) { show(order[n - 1]); }
  });

  // theme toggle: light / dark / auto
  var themeButtons = document.querySelectorAll('[data-theme-btn]');
  function setTheme(mode) {
    if (mode === 'auto') { document.documentElement.removeAttribute('data-theme'); }
    else { document.documentElement.setAttribute('data-theme', mode); }
    themeButtons.forEach(function (b) {
      var isActive = b.getAttribute('data-theme-btn') === mode;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
  }
  themeButtons.forEach(function (b) {
    b.addEventListener('click', function () { setTheme(b.getAttribute('data-theme-btn')); });
  });

  // language toggle (EN / TR) — uses an !important hidden class so it overrides any element's own
  // display value (flex/grid/block), rather than relying on clearing inline styles.
  var langButtons = document.querySelectorAll('[data-lang-btn]');
  function applyLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('.lang-en').forEach(function (el) { el.classList.toggle('i18n-hidden', lang !== 'en'); });
    document.querySelectorAll('.lang-tr').forEach(function (el) { el.classList.toggle('i18n-hidden', lang !== 'tr'); });
    langButtons.forEach(function (b) {
      var isActive = b.getAttribute('data-lang-btn') === lang;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
  }
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang-btn')); });
  });
  applyLang('en');

  // currency toggle (TRY / USD / GBP) — approx. fallback rates as of 28 Aug 2026, replaced by a live fetch when available
  var FX_FALLBACK = { TRY: 1, USD: 1 / 48.24, GBP: 1 / 65.59 };
  var FX = { TRY: FX_FALLBACK.TRY, USD: FX_FALLBACK.USD, GBP: FX_FALLBACK.GBP };
  var CURR_SYMBOL = { TRY: '₺', USD: '$', GBP: '£' };
  var currentCurrency = 'TRY';
  var currButtons = document.querySelectorAll('[data-curr-btn]');

  function localeForLang() {
    return document.documentElement.getAttribute('data-lang') === 'tr' ? 'tr-TR' : 'en-GB';
  }

  function formatMoney(tryVal, style) {
    var val = tryVal * FX[currentCurrency];
    var sym = CURR_SYMBOL[currentCurrency];
    var locale = localeForLang();
    var numStr;
    if (style === 'roundM' || style === 'roundK') {
      // auto-pick the abbreviation scale from the CONVERTED value, not the original TRY
      // magnitude — a value that reads as millions in TRY can be a small number of
      // thousands once converted to USD/GBP, and vice versa.
      var abs = Math.abs(val);
      if (abs >= 1e6) {
        numStr = (val / 1e6).toFixed(abs >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
      } else if (abs >= 1000) {
        numStr = Math.round(val / 1000) + 'K';
      } else {
        numStr = Math.round(val).toLocaleString(locale);
      }
    } else if (style === 'decimal') {
      numStr = val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      numStr = Math.round(val).toLocaleString(locale);
    }
    return currentCurrency === 'TRY' ? (numStr + sym) : (sym + numStr);
  }
  function applyCurrency(cur) {
    currentCurrency = cur;
    document.querySelectorAll('.curr[data-try]').forEach(function (el) {
      var tryVal = parseFloat(el.getAttribute('data-try'));
      var style = el.getAttribute('data-fmt') || 'int';
      el.textContent = formatMoney(tryVal, style);
    });
    currButtons.forEach(function (b) {
      var isActive = b.getAttribute('data-curr-btn') === cur;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
  }
  currButtons.forEach(function (b) {
    b.addEventListener('click', function () { applyCurrency(b.getAttribute('data-curr-btn')); });
  });

  // re-render currency figures with the right locale whenever the language changes
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { applyCurrency(currentCurrency); });
  });

  // attempt a live FX rate fetch; silently keep the fallback rates if it fails (offline file, blocked network, CORS, non-2xx, etc.)
  var fxNoteEls = document.querySelectorAll('[data-fx-note]');
  fetch('https://api.frankfurter.app/latest?from=TRY&to=USD,GBP')
    .then(function (r) { if (!r.ok) throw new Error('FX request failed: ' + r.status); return r.json(); })
    .then(function (data) {
      if (data && data.rates && data.rates.USD && data.rates.GBP) {
        FX.USD = data.rates.USD;
        FX.GBP = data.rates.GBP;
        var usdRate = (1 / FX.USD).toFixed(2);
        var gbpRate = (1 / FX.GBP).toFixed(2);
        fxNoteEls.forEach(function (el) { el.textContent = 'Live rate · 1 USD ≈ ' + usdRate + '₺ · 1 GBP ≈ ' + gbpRate + '₺'; });
        applyCurrency(currentCurrency);
      }
    })
    .catch(function () { /* keep fallback rates and note */ });
})();
