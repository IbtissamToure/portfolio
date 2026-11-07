/* Portfolio behaviour: language switching, navigation, and the Digital Lab visuals.
   English text lives in index.html, so the page still reads without JavaScript.
   Arabic text lives in translations.js, keyed by each element's data-i18n value. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var STORAGE_KEY = 'portfolio-lang';
  var LOGO_CHARACTER = '𝐄'; // U+1D404 MATHEMATICAL BOLD CAPITAL E
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var toArray = function (list) { return Array.prototype.slice.call(list); };
  var languageListeners = [];

  /* ---------- Language ---------- */
  var textNodes = toArray(doc.querySelectorAll('[data-i18n]'));
  var ariaNodes = toArray(doc.querySelectorAll('[data-i18n-aria]'));
  var metaDescription = doc.querySelector('meta[name="description"]');
  var langButtons = toArray(doc.querySelectorAll('[data-set-lang]'));

  // Keep the English originals so switching back needs no second copy of the text.
  textNodes.forEach(function (el) { el.__en = el.innerHTML; });
  ariaNodes.forEach(function (el) { el.__enAria = el.getAttribute('aria-label'); });
  var enTitle = doc.title;
  var enDescription = metaDescription.getAttribute('content');

  function setLanguage(lang, persist) {
    var ar = window.PORTFOLIO_AR || {};
    var isArabic = lang === 'ar';

    root.lang = isArabic ? 'ar' : 'en';
    root.dir = isArabic ? 'rtl' : 'ltr';

    textNodes.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.innerHTML = isArabic && ar[key] ? ar[key] : el.__en;
    });
    ariaNodes.forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', isArabic && ar[key] ? ar[key] : el.__enAria);
    });
    doc.title = isArabic && ar['meta.title'] ? ar['meta.title'] : enTitle;
    metaDescription.setAttribute('content', isArabic && ar['meta.description'] ? ar['meta.description'] : enDescription);

    langButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-set-lang') === root.lang));
    });

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, root.lang); } catch (e) { /* storage unavailable */ }
    }
    languageListeners.forEach(function (fn) { fn(); });
  }

  var savedLang = 'en';
  try { savedLang = localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'; } catch (e) { /* storage unavailable */ }
  setLanguage(savedLang, false);

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { setLanguage(btn.getAttribute('data-set-lang'), true); });
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = doc.querySelector('.menu-btn');
  var siteNav = doc.getElementById('site-nav');

  function setMenu(open) {
    siteNav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  siteNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ---------- Active section in the navigation ---------- */
  var navLinks = toArray(siteNav.querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    doc.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });

    // The hero has no navigation entry, so clear the marker when it is in view.
    var heroSpy = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
    }, { rootMargin: '-45% 0px -54% 0px' });
    heroSpy.observe(doc.querySelector('.hero'));
  }

  /* ---------- Scroll reveal ---------- */
  var revealItems = doc.querySelectorAll('[data-reveal]');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(function (el) { revealer.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Career line: the logo's spine fills as you scroll ---------- */
  var journey = doc.querySelector('.journey');
  if (journey && !reduceMotion.matches) {
    var journeyTicking = false;
    var updateJourney = function () {
      journeyTicking = false;
      var box = journey.getBoundingClientRect();
      var progress = (window.innerHeight * 0.62 - box.top) / box.height;
      journey.style.setProperty('--progress', Math.max(0, Math.min(1, progress)).toFixed(3));
    };
    window.addEventListener('scroll', function () {
      if (!journeyTicking) { journeyTicking = true; requestAnimationFrame(updateJourney); }
    }, { passive: true });
    updateJourney();
  }

  /* ---------- Skills: place the 𝐄 hub where the first two clusters meet ---------- */
  var eco = doc.querySelector('.eco');
  var ecoHub = doc.querySelector('.eco-hub');
  function placeHub() {
    if (!eco || !ecoHub) return;
    var wide = eco.querySelector('.skill-row.wide');
    var gap = parseFloat(getComputedStyle(eco).rowGap) || 0;
    ecoHub.style.setProperty('--hub-y', (wide.offsetTop - gap / 2) + 'px');
  }
  languageListeners.push(placeHub);
  window.addEventListener('resize', placeHub, { passive: true });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(placeHub);
  placeHub();

  /* ---------- Linked highlight: headline words and pillar cards ---------- */
  var linked = toArray(doc.querySelectorAll('[data-stage]'));
  function highlight(stage) {
    linked.forEach(function (node) { node.classList.toggle('is-active', node.getAttribute('data-stage') === stage); });
  }
  linked.forEach(function (node) {
    node.addEventListener('pointerenter', function () { highlight(node.getAttribute('data-stage')); });
    node.addEventListener('pointerleave', function () { highlight(null); });
  });

  /* ---------- Cursor light, card spotlight, hero depth (mouse and trackpad only) ---------- */
  var pointer = { x: -1000, y: -1000, active: false };
  var heroEl = doc.querySelector('.hero');

  if (finePointer.matches && !reduceMotion.matches) {
    var glow = doc.querySelector('.cursor-glow');
    var heroSpot = doc.querySelector('.hero-spot');
    var depth = doc.querySelector('.identity-depth');
    var glowX = 0, glowY = 0, spotX = 0, spotY = 0, cursorFrame = 0;

    var paintCursor = function () {
      glowX += (pointer.x - glowX) * 0.22;
      glowY += (pointer.y - glowY) * 0.22;
      glow.style.transform = 'translate3d(' + glowX.toFixed(1) + 'px,' + glowY.toFixed(1) + 'px,0)';

      var heroBox = heroEl.getBoundingClientRect();
      if (heroBox.bottom > 0) {
        var localX = pointer.x - heroBox.left, localY = pointer.y - heroBox.top;
        spotX += (localX - spotX) * 0.08;
        spotY += (localY - spotY) * 0.08;
        heroSpot.style.transform = 'translate3d(' + spotX.toFixed(1) + 'px,' + spotY.toFixed(1) + 'px,0)';
        if (depth) {
          var dx = (localX / heroBox.width - 0.5) * -12, dy = (localY / heroBox.height - 0.5) * -10;
          depth.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
        }
      }
      var settled = Math.abs(pointer.x - glowX) < 0.5 && Math.abs(pointer.y - glowY) < 0.5;
      cursorFrame = settled ? 0 : requestAnimationFrame(paintCursor);
    };

    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.active) {
        pointer.active = true;
        glowX = e.clientX; glowY = e.clientY;
        glow.classList.add('is-on');
        heroSpot.classList.add('is-on');
      }
      if (!cursorFrame) cursorFrame = requestAnimationFrame(paintCursor);

      var card = e.target.closest ? e.target.closest('.spot') : null;
      if (card) {
        var box = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - box.left) + 'px');
        card.style.setProperty('--my', (e.clientY - box.top) + 'px');
      }
    }, { passive: true });
    doc.addEventListener('mouseleave', function () {
      pointer.active = false;
      glow.classList.remove('is-on');
      heroSpot.classList.remove('is-on');
    });
  }

  /* ---------- Hero network: nodes trace the real 𝐄 glyph and connect outward ---------- */
  var canvas = doc.getElementById('hero-network');
  var markEl = doc.querySelector('.hero-mark');
  if (canvas && canvas.getContext && markEl) startNetwork();

  function startNetwork() {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var coarse = !finePointer.matches;
    var width = 0, height = 0;
    var nodes = [];
    var visible = true, frame = 0, lastDraw = 0;
    var FRAME_MS = coarse ? 42 : 24;

    var seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

    // Reads the logo's shape by drawing the same character at the same place, off screen.
    function sampleGlyph(limit) {
      var heroBox = heroEl.getBoundingClientRect();
      var box = markEl.getBoundingClientRect();
      var size = parseFloat(getComputedStyle(markEl).fontSize);
      var w = Math.ceil(box.width), h = Math.ceil(box.height);
      if (!w || !h) return [];
      var off = doc.createElement('canvas');
      off.width = w; off.height = h;
      var oc = off.getContext('2d', { willReadFrequently: true });
      oc.font = size + 'px "E Mark"';
      oc.textBaseline = 'alphabetic';
      var m = oc.measureText(LOGO_CHARACTER);
      var ascent = m.fontBoundingBoxAscent || size * 0.762;
      var descent = m.fontBoundingBoxDescent || size * 0.238;
      var baseline = (size - (ascent + descent)) / 2 + ascent;
      oc.fillText(LOGO_CHARACTER, 0, baseline);
      var data = oc.getImageData(0, 0, w, h).data;
      var inside = function (x, y) {
        return x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 128;
      };
      var edges = [];
      var step = Math.max(2, Math.round(size / 150));
      for (var y = 0; y < h; y += step) {
        for (var x = 0; x < w; x += step) {
          if (inside(x, y) && (!inside(x - step, y) || !inside(x + step, y) || !inside(x, y - step) || !inside(x, y + step))) {
            edges.push({ x: x, y: y });
          }
        }
      }
      // Keep evenly spaced edge points so the outline stays legible.
      var spacing = size / 15, chosen = [];
      for (var i = 0; i < edges.length; i++) {
        var p = edges[Math.floor(rand() * edges.length)];
        var clear = chosen.every(function (q) { return (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) > spacing * spacing; });
        if (clear) chosen.push(p);
        if (chosen.length >= limit) break;
      }
      var ox = box.left - heroBox.left, oy = box.top - heroBox.top;
      return chosen.map(function (p) { return { x: p.x + ox, y: p.y + oy }; });
    }

    function build() {
      var box = heroEl.getBoundingClientRect();
      width = box.width; height = box.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed = 7;
      nodes = [];
      var glyphPoints = sampleGlyph(coarse ? 34 : 58);
      glyphPoints.forEach(function (p) {
        nodes.push({ glyph: true, ax: p.x, ay: p.y, x: p.x, y: p.y, phase: rand() * 6.28, speed: 0.4 + rand() * 0.5, amp: 1.5 + rand() * 2.5 });
      });
      var free = Math.round(Math.min(coarse ? 26 : 64, width * height / 19000));
      for (var i = 0; i < free; i++) {
        nodes.push({ glyph: false, x: rand() * width, y: rand() * height, vx: (rand() - 0.5) * 0.28, vy: (rand() - 0.5) * 0.28 });
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      var t = time * 0.001;
      var heroBox = heroEl.getBoundingClientRect();
      var px = pointer.active ? pointer.x - heroBox.left : -9999;
      var py = pointer.active ? pointer.y - heroBox.top : -9999;
      var n, i, j;

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (n.glyph) {
          n.x = n.ax + Math.sin(t * n.speed + n.phase) * n.amp;
          n.y = n.ay + Math.cos(t * n.speed * 0.8 + n.phase) * n.amp;
        } else {
          n.x += n.vx; n.y += n.vy;
          if (n.x < -20) n.x = width + 20; else if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20; else if (n.y > height + 20) n.y = -20;
          var cx = n.x - px, cy = n.y - py, cd = cx * cx + cy * cy;
          if (cd < 22500 && cd > 1) { var push = (22500 - cd) / 22500 * 0.9; var len = Math.sqrt(cd); n.x += cx / len * push; n.y += cy / len * push; }
        }
      }

      ctx.lineWidth = 0.8;
      for (i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var bothGlyph = a.glyph && b.glyph;
          var reach = bothGlyph ? 52 : 118;
          var dx = a.x - b.x, dy = a.y - b.y;
          if (Math.abs(dx) > reach || Math.abs(dy) > reach) continue;
          var d2 = dx * dx + dy * dy;
          if (d2 > reach * reach) continue;
          var strength = 1 - Math.sqrt(d2) / reach;
          ctx.strokeStyle = bothGlyph ? 'rgba(255,255,255,' + (0.55 * strength).toFixed(3) + ')' : 'rgba(29,78,216,' + (0.3 * strength).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        var mx = a.x - px, my = a.y - py, md2 = mx * mx + my * my;
        if (md2 < 28900) {
          ctx.strokeStyle = 'rgba(8,145,178,' + (0.65 * (1 - Math.sqrt(md2) / 170)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(px, py); ctx.stroke();
        }
      }

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        ctx.fillStyle = n.glyph ? 'rgba(255,255,255,.95)' : 'rgba(29,78,216,.62)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.glyph ? 1.7 : 1.9, 0, 6.2832); ctx.fill();
      }
    }

    function loop(time) {
      frame = requestAnimationFrame(loop);
      if (time - lastDraw < FRAME_MS) return;
      lastDraw = time;
      draw(time);
    }
    function play() { if (!frame && visible && !doc.hidden && !reduceMotion.matches) frame = requestAnimationFrame(loop); }
    function pause() { if (frame) { cancelAnimationFrame(frame); frame = 0; } }
    function refresh() {
      build();
      draw(performance.now());
    }

    var fontReady = doc.fonts && doc.fonts.load ? doc.fonts.load('40px "E Mark"', LOGO_CHARACTER) : Promise.resolve();
    fontReady.catch(function () {}).then(function () {
      refresh();
      play();

      var resizeTimer = 0;
      if ('ResizeObserver' in window) {
        new ResizeObserver(function () {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(refresh, 160);
        }).observe(heroEl);
      }
      languageListeners.push(function () { requestAnimationFrame(refresh); });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) play(); else pause();
        }).observe(heroEl);
      }
      doc.addEventListener('visibilitychange', function () { if (doc.hidden) pause(); else play(); });
    });
  }
})();
