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
