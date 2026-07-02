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
