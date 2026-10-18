// Nav scroll — adds frosted glass background after 40px
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Mobile menu ──
// One piece of state ("is the menu open?") lives in a single place:
// the .menu-open class on the nav. CSS handles everything visual —
// the panel sliding in, the hamburger turning into an X, the bar
// going white. JS only flips the class.
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('menu-open');
  // keep screen readers in sync with what sighted users see
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close the menu when any link inside it is tapped. One listener on
// the parent catches clicks from every link — including links added
// later — instead of wiring up each one individually. This pattern
// is called event delegation.
navLinks.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ── CONVERSION TRACKING ──
// Pageviews tell you who showed up. These tell you who actually reached
// for the phone. Every CTA on this site ends in a tel:, a mailto:, or an
// outbound link to Spiro — so those three are the real conversions.
//
// One listener on `document` catches all of them. That's event delegation:
// instead of wiring up ~40 individual links across 8 pages (and having to
// remember to wire up every new one), we let the click bubble up to the
// document and inspect it there. Links added later are covered for free.
document.addEventListener('click', (e) => {
  // Most CTAs wrap an inline <svg> icon, so e.target is often the <svg> or
  // even a <path> inside it — not the <a>. closest() walks UP the tree from
  // whatever got clicked to find the nearest ancestor <a>. Without it, every
  // tap that landed on an icon would be silently missed.
  const link = e.target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href') || '';
  let name = null;
  let params = {};

  if (href.startsWith('tel:')) {
    name = 'phone_click';
  } else if (href.startsWith('mailto:')) {
    name = 'email_click';
  } else if (href.includes('portal.spiro.media')) {
    name = 'booking_click';
  }

  if (!name) return;

  params = {
    // Which page drove it — this is how you find out whether /commercial
    // converts better than /builders.
    page_path: window.location.pathname,
    // Where on the page — nav, hero, or the bottom CTA block. Tells you
    // whether people decide immediately or need the full pitch first.
    link_location: sectionOf(link),
    link_url: link.href
  };

  // gtag may not exist yet (script still loading, or blocked by an ad
  // blocker). Guarding means a failed analytics load can never break a
  // real phone call.
  if (typeof gtag === 'function') gtag('event', name, params);
});

// Walks up from a link to find the nearest <section>, <nav> or <footer>
// and returns something readable for the GA4 report.
function sectionOf(el) {
  const host = el.closest('nav, footer, section');
  if (!host) return 'unknown';
  if (host.tagName === 'NAV') return 'nav';
  if (host.tagName === 'FOOTER') return 'footer';
  return host.id || host.className.split(' ')[0] || 'section';
}

// ── Gallery carousels ──
// Each .gallery-grid[data-rows] becomes one CSS grid with that many
// rows, repeated past both page edges. The track slides left by exactly
// one repeat and loops, so the seam never shows.
//
// A photo marked .big spans 2x2. Its data-area="row col" is the top-left
// cell inside one repeat, and the other photos fill the gaps. For the
// repeat to have no holes, (photos + 3 * bigs) must divide evenly by
// the row count. When no sensible number of bigs works, add data-double:
// the repeat then uses every photo twice, and data-area-b places big
// tiles in the second pass.
const DRIFT_SPEED = 18; // px per second

const hideCopy = (el) => {
  el.setAttribute('aria-hidden', 'true');
  el.tabIndex = -1;
};

document.querySelectorAll('.gallery-grid[data-rows]').forEach((grid) => {
  const rowCount = Number(grid.dataset.rows);
  let set = [...grid.children];

  if ('double' in grid.dataset) {
    const secondPass = set.map((item) => {
      const twin = item.cloneNode(true);
      hideCopy(twin);
      const area = item.dataset.areaB;
      twin.classList.toggle('big', Boolean(area));
      if (area) twin.dataset.area = area;
      else delete twin.dataset.area;
      delete twin.dataset.areaB;
      return twin;
    });
    set = [...set, ...secondPass];
  }

  const bigs = set.filter((item) => item.classList.contains('big')).length;
  const setCols = (set.length + 3 * bigs) / rowCount;

  // Place a big tile in repeat number `copy` (0 = the real photos).
  const placeBig = (item, copy) => {
    const [row, col] = item.dataset.area.split(' ').map(Number);
    item.style.gridRow = `${row} / span 2`;
    item.style.gridColumn = `${col + copy * setCols} / span 2`;
  };

  const row = document.createElement('div');
  row.className = 'gallery-row';
  const track = document.createElement('div');
  track.className = 'gallery-track';
  track.style.setProperty('--rows', rowCount);
  set.forEach((item) => {
    if (item.dataset.area) placeBig(item, 0);
  });
  track.append(...set);
  row.append(track);
  grid.append(row);
  grid.classList.add('is-carousel');

  function layout() {
    // drop old copies, keep the real photos
    track.querySelectorAll('[data-copy]').forEach((c) => c.remove());

    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap) || 0;
    const setWidth = setCols * (parseFloat(style.gridAutoColumns) + gap);
    const rowWidth = row.clientWidth;
    // where the content column starts inside the full-bleed row
    const contentLeft = grid.getBoundingClientRect().left - row.getBoundingClientRect().left;

    // enough copies to cover the row through a full loop
    const copies = Math.ceil(rowWidth / setWidth) + 2;
    for (let c = 1; c < copies; c++) {
      set.forEach((item) => {
        const copy = item.cloneNode(true);
        copy.dataset.copy = '';
        hideCopy(copy);
        if (item.dataset.area) placeBig(copy, c);
        track.append(copy);
      });
    }

    // start with a real photo lined up on the content edge
    const from = (contentLeft % setWidth) - setWidth;
    track.style.setProperty('--from', `${from}px`);
    track.style.setProperty('--to', `${from - setWidth}px`);
    track.style.setProperty('--dur', `${setWidth / DRIFT_SPEED}s`);
  }

  layout();
  // Only re-layout when the width changes. Phones fire resize when the
  // address bar shows/hides on scroll, which would restart the drift.
  let lastWidth = window.innerWidth;
  let resizeFrame;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(layout);
  });
});
