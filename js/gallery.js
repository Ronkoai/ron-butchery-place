/* Photo collections rendered from data/gallery.json — no dependencies.
   Add a photo = drop the file in images/archive/... and add one object to the JSON. */
(function () {
  'use strict';

  var DATA_URL = 'data/gallery.json';

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

  /* ---------- lightbox ---------- */

  var lb = null;
  var lbImg = null;
  var lbCaption = null;
  var lbItems = [];
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
    var buttons = lb.querySelectorAll('button');
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
    var item = lbItems[lbIndex];
    if (!item) return;
    lbImg.src = item.full;
    lbImg.alt = item.alt;
    var bits = [dateLabel(item.date), item.title, item.place].filter(Boolean);
    lbCaption.textContent = bits.join(' \u00b7 ');
    var many = lbItems.length > 1;
    lb.querySelector('.lightbox-prev').hidden = !many;
    lb.querySelector('.lightbox-next').hidden = !many;
    lb.setAttribute('aria-label', item.title ? 'Photo viewer: ' + item.title : 'Photo viewer');
  }

  function step(delta) {
    if (lbItems.length < 2) return;
    lbIndex = (lbIndex + delta + lbItems.length) % lbItems.length;
    showCurrent();
  }

  function openLightbox(items, index, trigger) {
    buildLightbox();
    lbItems = items;
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

  function photoFigure(item, items, index) {
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
      openLightbox(items, index, button);
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

  function fillContainer(container, items) {
    var isRecent = String(container.getAttribute('data-gallery') || '').toLowerCase() === 'recent';

    if (!items.length) {
      /* Static fallback cards stay as they are. */
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
    items.forEach(function (item, index) {
      container.appendChild(isRecent ? recentCard(item) : photoFigure(item, items, index));
    });
  }

  function matches(item, selector) {
    if (selector === 'recent') return item.tags.indexOf('recent') !== -1;
    var wanted = parseTags(selector);
    return item.tags.some(function (tag) {
      return wanted.indexOf(tag) !== -1;
    });
  }

  function renderAll(items) {
    var containers = document.querySelectorAll('[data-gallery]');
    Array.prototype.forEach.call(containers, function (container) {
      var selector = String(container.getAttribute('data-gallery') || '').trim().toLowerCase();
      var selected = selector ? items.filter(function (item) {
        return matches(item, selector);
      }).sort(byDateDesc) : [];
      fillContainer(container, selected);
    });
  }

  /* ---------- init ---------- */

  function init() {
    if (!document.querySelector('[data-gallery]')) return;

    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var raw = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
        renderAll(raw.map(normalize).filter(Boolean));
      })
      .catch(function () {
        /* Missing or unreadable data file: keep the fallbacks and empty states. */
        renderAll([]);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
