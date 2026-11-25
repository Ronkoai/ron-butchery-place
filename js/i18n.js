/* Language switching for the Ron Ko site.
   - English is the default and is written directly in the HTML.
   - data/i18n/<lang>.json (bundled into js/i18n-data.js) holds ko / ja / zh / es.
   - ?lang=xx in the URL wins, then localStorage, then English.
   - Markup hooks:
       data-i18n="key"                 text content
       data-i18n-html="key"            inner HTML (keys containing <em>, <a> …)
       data-i18n-attr="alt:key,title:key"   attributes
       [data-lang-switch]              container the switcher is built into
   - Public API: window.RonI18n = { lang(), t(key, fallback), setLang(code), onChange(fn) } */
(function () {
  'use strict';

  var LANGS = [
    { code: 'en', label: 'English', short: 'EN', htmlLang: 'en' },
    { code: 'ko', label: '한국어', short: 'KO', htmlLang: 'ko' },
    { code: 'ja', label: '日本語', short: 'JA', htmlLang: 'ja' },
    { code: 'zh', label: '简体中文', short: 'ZH', htmlLang: 'zh-Hans' },
    { code: 'es', label: 'Español', short: 'ES', htmlLang: 'es' }
  ];
  var DEFAULT_LANG = 'en';
  var STORAGE_KEY = 'ronko.lang';
  var DICTS = window.RONKO_I18N || {};

  var current = DEFAULT_LANG;
  var listeners = [];
  var switcher = null;

  function byCode(code) {
    for (var i = 0; i < LANGS.length; i++) {
      if (LANGS[i].code === code) return LANGS[i];
    }
    return null;
  }

  function normalize(raw) {
    if (!raw) return null;
    var value = String(raw).trim().toLowerCase();
    if (value === 'zh' || value === 'zh-hans' || value === 'zh-cn' || value === 'zh-sg' || value === 'cn') return 'zh';
    if (value === 'ja' || value === 'jp') return 'ja';
    if (value === 'ko' || value === 'kr') return 'ko';
    if (value === 'es') return 'es';
    if (value === 'en' || value === 'eng') return 'en';
    return null;
  }

  function fromQuery() {
    var match = /[?&]lang=([^&#]*)/.exec(window.location.search || '');
    if (!match) return null;
    try {
      return normalize(decodeURIComponent(match[1].replace(/\+/g, ' ')));
    } catch (error) {
      return normalize(match[1]);
    }
  }

  function fromStorage() {
    try {
      return normalize(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function persist(code) {
    try {
      if (code === DEFAULT_LANG) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      /* private mode or storage disabled: the URL still carries the choice */
    }
  }

  function lookup(key) {
    var dict = DICTS[current];
    if (!dict) return null;
    var value = dict[key];
    return value == null ? null : value;
  }

  function t(key, fallback) {
    var value = lookup(key);
    if (value != null) return value;
    return fallback == null ? '' : fallback;
  }

  function applyTranslations() {
    var nodes = document.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-attr]');

    Array.prototype.forEach.call(nodes, function (el) {
      var textKey = el.getAttribute('data-i18n');
      if (textKey) {
        if (el.__i18nText === undefined) el.__i18nText = el.textContent;
        var textValue = lookup(textKey);
        el.textContent = textValue == null ? el.__i18nText : textValue;
      }

      var htmlKey = el.getAttribute('data-i18n-html');
      if (htmlKey) {
        if (el.__i18nHtml === undefined) el.__i18nHtml = el.innerHTML;
        var htmlValue = lookup(htmlKey);
        el.innerHTML = htmlValue == null ? el.__i18nHtml : htmlValue;
      }

      var attrSpec = el.getAttribute('data-i18n-attr');
      if (attrSpec) {
        if (!el.__i18nAttrs) el.__i18nAttrs = {};
        attrSpec.split(',').forEach(function (pair) {
          var index = pair.indexOf(':');
          if (index < 0) return;
          var attr = pair.slice(0, index).trim();
          var key = pair.slice(index + 1).trim();
          if (!attr || !key) return;
          if (el.__i18nAttrs[attr] === undefined) {
            var original = el.getAttribute(attr);
            el.__i18nAttrs[attr] = original == null ? '' : original;
          }
          var value = lookup(key);
          el.setAttribute(attr, value == null ? el.__i18nAttrs[attr] : value);
        });
      }
    });
  }

  function localizeLinks() {
    var links = document.querySelectorAll('a[href]');
    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute('href');
      if (!href || /^(?:[a-z]+:|\/\/|#|mailto:)/i.test(href)) return;
      var match = /^([^?#]*\.html)(?:\?[^#]*)?(#.*)?$/i.exec(href);
      if (!match) return;
      var next = match[1] + (current === DEFAULT_LANG ? '' : '?lang=' + current) + (match[2] || '');
      if (next !== href) link.setAttribute('href', next);
    });
  }

  function updateUrl() {
    if (!window.history || !window.history.replaceState) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    try {
      var url = new URL(window.location.href);
      if (current === DEFAULT_LANG) url.searchParams.delete('lang');
      else url.searchParams.set('lang', current);
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (error) {
      /* older browsers: the stored preference still applies */
    }
  }

  function updateSwitcher() {
    if (!switcher) return;
    var active = byCode(current) || LANGS[0];
    var codeEl = switcher.querySelector('[data-lang-current]');
    if (codeEl) codeEl.textContent = active.short;
    var button = switcher.querySelector('.lang-btn');
    if (button) {
      button.setAttribute('aria-label', t('common.langLabel', 'Language') + ': ' + active.label);
    }
    var options = switcher.querySelectorAll('[data-lang-option]');
    Array.prototype.forEach.call(options, function (option) {
      var selected = option.getAttribute('data-lang-option') === current;
      option.setAttribute('aria-checked', selected ? 'true' : 'false');
      var tick = option.querySelector('.lang-tick');
      if (tick) tick.style.visibility = selected ? 'visible' : 'hidden';
    });
  }

  function closeMenu() {
    if (!switcher) return;
    switcher.classList.remove('open');
    var button = switcher.querySelector('.lang-btn');
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    if (!switcher) return;
    switcher.classList.add('open');
    var button = switcher.querySelector('.lang-btn');
    if (button) button.setAttribute('aria-expanded', 'true');
  }

  function buildSwitcher() {
    var host = document.querySelector('[data-lang-switch]');
    if (!host || host.getAttribute('data-lang-ready') === 'true') return;
    host.setAttribute('data-lang-ready', 'true');
    host.innerHTML = '';
    host.className = 'lang';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'lang-btn';
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"></path></svg>' +
      '<span class="lang-code" data-lang-current>EN</span><span class="lang-caret" aria-hidden="true"></span>';

    var menu = document.createElement('ul');
    menu.className = 'lang-menu';
    menu.setAttribute('role', 'menu');

    LANGS.forEach(function (lang) {
      var item = document.createElement('li');
      item.setAttribute('role', 'none');
      var option = document.createElement('button');
      option.type = 'button';
      option.setAttribute('role', 'menuitemradio');
      option.setAttribute('data-lang-option', lang.code);
      option.setAttribute('aria-checked', 'false');
      option.lang = lang.htmlLang;
      option.innerHTML = '<span class="lang-name">' + lang.label + '</span>' +
        '<span class="lang-tick" aria-hidden="true">✓</span>';
      option.addEventListener('click', function () {
        setLanguage(lang.code);
        closeMenu();
        button.focus();
      });
      item.appendChild(option);
      menu.appendChild(item);
    });

    button.addEventListener('click', function (event) {
      event.preventDefault();
      if (host.classList.contains('open')) closeMenu();
      else openMenu();
    });

    host.appendChild(button);
    host.appendChild(menu);
    switcher = host;

    document.addEventListener('click', function (event) {
      if (!switcher || !switcher.classList.contains('open')) return;
      if (!switcher.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
  }

  function setLanguage(code, options) {
    var next = normalize(code) || DEFAULT_LANG;
    current = next;
    var lang = byCode(current) || LANGS[0];
    document.documentElement.lang = lang.htmlLang;

    var label = document.querySelector('[data-lang-label]');
    if (label) label.textContent = next === DEFAULT_LANG ? lang.short : lang.short + ' · ' + lang.label;

    applyTranslations();
    localizeLinks();
    updateSwitcher();
    if (!options || options.url !== false) updateUrl();

    listeners.forEach(function (fn) {
      try { fn(current); } catch (error) { /* one listener failing must not stop the page */ }
    });
  }

  function init() {
    var initial = fromQuery() || fromStorage() || DEFAULT_LANG;
    current = initial;
    buildSwitcher();
    var lang = byCode(current) || LANGS[0];
    document.documentElement.lang = lang.htmlLang;
    applyTranslations();
    localizeLinks();
    updateSwitcher();
    updateUrl();
  }

  window.RonI18n = {
    lang: function () { return current; },
    t: t,
    setLang: function (code) { setLanguage(code); },
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); }
  };

  init();
})();
