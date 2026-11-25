/* Photo collections rendered from data/gallery.json — no dependencies.
   Add a photo = drop the file in images/archive/... , run scripts/make_thumbs.py,
   and add one object to the JSON.

   Containers
     [data-gallery="recent"]   cards for the home page  (tag: recent)
     [data-gallery="archive"]  full masonry grid        (filtered by [data-filters])
   Filters
     [data-filters] > button.chip[data-filter="all|trips|craft|travel"]
     [data-filter-count]       shows how many photographs the filter holds
*/
(function () {
  'use strict';

  var DATA_URL = 'data/gallery.json';
  var items = [];
  var activeFilter = 'all';
  var archiveItems = [];
  var archiveIndex = 0;

  /* ---------- data ---------- */

  function parseTags(raw) {
    var list = Array.isArray(raw) ? raw : String(raw == null ? '' : raw).split(',');
    return list.map(function (tag) {
      return String(tag).trim().toLowerCase();
    }).filter(Boolean);
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || !raw.src) return null;
    var tags = parseTags(raw.tags);
    if (raw.recent === true) tags.push('recent');
    return {
      src: String(raw.src),
      thumb: raw.thumb ? String(raw.thumb) : '',
      full: raw.full ? String(raw.full) : String(raw.src),
      date: raw.date ? String(raw.date) : '',
      title: raw.title ? String(raw.title) : '',
      place: raw.place ? String(raw.place) : '',
      alt: raw.alt ? String(raw.alt) : (raw.title ? String(raw.title) : ''),
      tags: tags,
      width: raw.width ? String(raw.width) : '',
      height: raw.height ? String(raw.height) : ''
    };
  }

  function dateLabel(value) {
    var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
    if (!m) return value;
    return m[3] ? m[1] + '.' + m[2] + '.' + m[3] : m[1] + '.' + m[2];
  }

  function byDateDesc(a, b) {
    if (a.date && b.date) return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  }

  function matches(item, key) {
    if (!key || key === 'all') return true;
    if (key === 'recent') return item.tags.indexOf('recent') !== -1;
    return item.tags.indexOf(key) !== -1;
  }

  /* ---------- lightbox ---------- */

  var lb = null;
  var lbImg = null;
  var lbCaption = null;
  var lbSet = [];
  var lbIndex = 0;
  var lbReturn = null;

  function makeButton(className, label, glyph, onClick) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute('aria-label', label);
    btn.textContent = glyph;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function buildLightbox() {
    if (lb) return;
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');

    lbImg = document.createElement('img');
    lbImg.className = 'lightbox-img';
    lbImg.alt = '';

    lbCaption = document.createElement('p');
    lbCaption.className = 'lightbox-caption';

    lb.appendChild(makeButton('lightbox-close', 'Close photo viewer', '\u00d7', closeLightbox));
    lb.appendChild(makeButton('lightbox-prev', 'Previous photo', '\u2039', function () { step(-1); }));
    lb.appendChild(lbImg);
    lb.appendChild(makeButton('lightbox-next', 'Next photo', '\u203a', function () { step(1); }));
    lb.appendChild(lbCaption);

    lb.addEventListener('click', function (event) {
      if (event.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', onKeydown);
    document.body.appendChild(lb);
  }

  function onKeydown(event) {
    if (!lb || lb.hidden) return;
    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      step(-1);
    } else if (event.key === 'ArrowRight') {
      step(1);
    } else if (event.key === 'Tab') {
      trapFocus(event);
    }
  }

  function trapFocus(event) {
    var buttons = lb.querySelectorAll('button:not([hidden])');
    if (!buttons.length) return;
    var first = buttons[0];
    var last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showCurrent() {
    var item = lbSet[lbIndex];
    if (!item) return;
    lbImg.src = item.full;
    lbImg.alt = item.alt;
    var bits = [dateLabel(item.date), item.title, item.place].filter(Boolean);
    var counter = lbSet.length > 1 ? (lbIndex + 1) + ' / ' + lbSet.length : '';
    lbCaption.textContent = bits.concat(counter ? [counter] : []).join('  \u00b7  ');
    var many = lbSet.length > 1;
    lb.querySelector('.lightbox-prev').hidden = !many;
    lb.querySelector('.lightbox-next').hidden = !many;
    lb.setAttribute('aria-label', item.title ? 'Photo viewer: ' + item.title : 'Photo viewer');
  }

  function step(delta) {
    if (lbSet.length < 2) return;
    lbIndex = (lbIndex + delta + lbSet.length) % lbSet.length;
    showCurrent();
  }

  function openLightbox(set, index, trigger) {
    buildLightbox();
    lbSet = set;
    lbIndex = index;
    lbReturn = trigger || document.activeElement;
    showCurrent();
    lb.hidden = false;
    document.body.classList.add('lightbox-open');
    var close = lb.querySelector('.lightbox-close');
    if (close) close.focus();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    lbImg.removeAttribute('src');
    lbImg.alt = '';
    document.body.classList.remove('lightbox-open');
    if (lbReturn && typeof lbReturn.focus === 'function') lbReturn.focus();
  }

  /* ---------- rendering ---------- */

  function photoFigure(item, set, index) {
    var figure = document.createElement('figure');
    figure.className = 'photo';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-open';
    button.setAttribute('aria-label', item.title ? 'Open photo: ' + item.title : 'Open photo');

    var img = document.createElement('img');
    img.src = item.thumb || item.src;
    img.alt = item.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    if (item.width) img.width = item.width;
    if (item.height) img.height = item.height;

    button.appendChild(img);
    button.addEventListener('click', function () {
      openLightbox(set, index, button);
    });

    var caption = document.createElement('figcaption');
    caption.className = 'photo-caption';
    if (item.date) {
      var date = document.createElement('span');
      date.className = 'date';
      date.textContent = dateLabel(item.date);
      caption.appendChild(date);
    }
    if (item.title) {
      var title = document.createElement('span');
      title.className = 'title';
      title.textContent = item.title;
      caption.appendChild(title);
    }
    if (item.place) {
      var place = document.createElement('span');
      place.className = 'place';
      place.textContent = item.place;
      caption.appendChild(place);
    }

    figure.appendChild(button);
    if (caption.textContent) figure.appendChild(caption);
    return figure;
  }

  function recentCard(item) {
    var card = document.createElement('article');
    card.className = 'recent-card';

    var media = document.createElement('div');
    media.className = 'recent-media';
    var img = document.createElement('img');
    img.src = item.thumb || item.src;
    img.alt = item.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    if (item.width) img.width = item.width;
    if (item.height) img.height = item.height;
    media.appendChild(img);

    var body = document.createElement('div');
    body.className = 'recent-body';
    if (item.date) {
      var date = document.createElement('span');
      date.className = 'recent-date';
      date.textContent = dateLabel(item.date);
      body.appendChild(date);
    }
    if (item.title) {
      var title = document.createElement('h3');
      title.textContent = item.title;
      body.appendChild(title);
    }
    if (item.place) {
      var place = document.createElement('span');
      place.className = 'recent-place';
      place.textContent = item.place;
      body.appendChild(place);
    }

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function fillContainer(container, selected, isRecent) {
    if (!selected.length) {
      if (container.hasAttribute('data-fallback') || container.querySelector('.gallery-empty')) return;
      var message = container.getAttribute('data-empty');
      if (!message) return;
      var note = document.createElement('p');
      note.className = 'gallery-empty';
      note.textContent = message;
      container.appendChild(note);
      return;
    }

    container.innerHTML = '';
    selected.forEach(function (item, index) {
      container.appendChild(isRecent ? recentCard(item) : photoFigure(item, selected, index));
    });
  }

  function renderArchive() {
    var container = document.querySelector('[data-gallery="archive"]');
    if (!container) return;
    archiveItems = items.filter(function (item) {
      return matches(item, activeFilter);
    }).sort(byDateDesc);
    fillContainer(container, archiveItems, false);

    var count = document.querySelector('[data-filter-count]');
    if (count) {
      count.textContent = archiveItems.length + (archiveItems.length === 1 ? ' photograph' : ' photographs');
    }
  }

  function wireFilters() {
    var bar = document.querySelector('[data-filters]');
    if (!bar) return;
    var chips = bar.querySelectorAll('.chip');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        activeFilter = chip.getAttribute('data-filter') || 'all';
        Array.prototype.forEach.call(chips, function (other) {
          other.setAttribute('aria-pressed', other === chip ? 'true' : 'false');
        });
        renderArchive();
      });
    });
  }

  function renderAll() {
    var containers = document.querySelectorAll('[data-gallery]');
    Array.prototype.forEach.call(containers, function (container) {
      var key = String(container.getAttribute('data-gallery') || '').trim().toLowerCase();
      if (key === 'archive') {
        renderArchive();
        return;
      }
      var selected = key ? items.filter(function (item) {
        return matches(item, key);
      }).sort(byDateDesc) : [];
      fillContainer(container, selected, key === 'recent');
    });
  }

  /* ---------- init ---------- */

  function init() {
    if (!document.querySelector('[data-gallery]')) return;
    wireFilters();

    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var raw = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
        items = raw.map(normalize).filter(Boolean);
        renderAll();
      })
      .catch(function () {
        /* Missing or unreadable data file: keep the fallbacks and empty states. */
        items = [];
        renderAll();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
