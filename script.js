/* ============================================================
   BEAUTY ALL DAY SALONS — shared site script.
   Mobile menu, scroll reveal, "now" marker on the day strip,
   graceful handling of missing logos/photos, lightbox.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- mobile menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('siteNav');

  if (toggle && nav) {
    const setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- sticky "Book" bar (phones): show only after the page's own Book button scrolls away ---------- */
  const stickyBook = document.querySelector('.sticky-book');
  const firstBook = document.querySelector('.page-actions .btn-primary');
  if (stickyBook) {
    if (firstBook && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        stickyBook.classList.toggle('is-visible', !entries[0].isIntersecting);
      }, { rootMargin: '-64px 0px 0px 0px' }).observe(firstBook);
    } else {
      stickyBook.classList.add('is-visible');
    }
  }

  /* ---------- day strip: where "now" sits in the booking window ---------- */
  document.querySelectorAll('.daystrip').forEach(function (strip) {
    const start = parseFloat(strip.dataset.start || '7');
    const end = parseFloat(strip.dataset.end || '18');
    const marker = strip.querySelector('.daystrip-now');
    if (!marker) return;
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const fraction = (hours - start) / (end - start);
    if (fraction >= 0 && fraction <= 1) {
      marker.style.left = (fraction * 100).toFixed(1) + '%';
      marker.hidden = false;
    }
  });

  /* ---------- salon logos: fall back to a monogram if the file is missing ---------- */
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    const useMonogram = function () {
      const plate = img.parentElement;
      if (plate) plate.classList.add('no-img');
      img.remove();
    };
    if (img.complete && img.naturalWidth === 0) useMonogram();
    else img.addEventListener('error', useMonogram);
  });

  /* ---------- gallery: hide photos that don't exist yet ---------- */
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const emptyState = document.getElementById('galleryEmpty');

  if (galleryItems.length) {
    const refresh = function () {
      const left = galleryItems.filter(function (i) { return !i.hidden; }).length;
      if (emptyState) emptyState.hidden = left > 0;
    };
    galleryItems.forEach(function (item) {
      const img = item.querySelector('img');
      if (!img) return;
      const drop = function () { item.hidden = true; refresh(); };
      if (img.complete && img.naturalWidth === 0) drop();
      else img.addEventListener('error', drop);
    });
    refresh();
  }

  /* ---------- lightbox ---------- */
  const triggers = Array.from(document.querySelectorAll('img[data-lightbox]'));
  if (!triggers.length) return;

  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.innerHTML =
    '<span class="lb-count"></span>' +
    '<button class="lb-btn lb-close" aria-label="Close">&times;</button>' +
    '<button class="lb-btn lb-prev" aria-label="Previous image">&#8249;</button>' +
    '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-caption"></figcaption></figure>' +
    '<button class="lb-btn lb-next" aria-label="Next image">&#8250;</button>';
  document.body.appendChild(lb);

  const imgEl = lb.querySelector('.lb-img');
  const capEl = lb.querySelector('.lb-caption');
  const countEl = lb.querySelector('.lb-count');
  const prevBtn = lb.querySelector('.lb-prev');
  const nextBtn = lb.querySelector('.lb-next');
  let set = [], index = 0, lastFocus = null;

  const visibleSet = function (name) {
    return triggers.filter(function (t) { return t.dataset.lightbox === name && t.offsetParent !== null; });
  };

  const render = function () {
    const t = set[index];
    imgEl.src = t.currentSrc || t.src;
    imgEl.alt = t.alt || '';
    capEl.textContent = t.alt || '';
    countEl.textContent = set.length > 1 ? (index + 1) + ' / ' + set.length : '';
    prevBtn.style.display = nextBtn.style.display = set.length < 2 ? 'none' : '';
  };

  const open = function (t) {
    lastFocus = document.activeElement;
    set = visibleSet(t.dataset.lightbox);
    index = Math.max(0, set.indexOf(t));
    render();
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  };

  const close = function () {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    imgEl.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  };

  const step = function (dir) {
    if (set.length < 2) return;
    index = (index + dir + set.length) % set.length;
    render();
  };

  triggers.forEach(function (t) {
    t.setAttribute('tabindex', '0');
    t.setAttribute('role', 'button');
    t.addEventListener('click', function () { open(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(t); }
    });
  });

  lb.querySelector('.lb-close').addEventListener('click', close);
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-figure')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  let startX = null;
  lb.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    startX = null;
  }, { passive: true });
});
