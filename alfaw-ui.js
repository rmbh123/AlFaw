"use strict";

// Ensure the removed bidding-guide entry never appears in any navigation bar.
// Keep the bidding guide content reachable from its existing non-navigation links.
(() => {
  const removeLegacyGuideNavLinks = () => {
    document.querySelectorAll('header a, nav a, [role="navigation"] a').forEach(link => {
      if (link.textContent.trim() === 'دليل المزايدة' || /(?:^|\/)bidding-guide\.html(?:[?#]|$)/.test(link.getAttribute('href') || '')) link.remove();
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeLegacyGuideNavLinks, { once: true });
  } else {
    removeLegacyGuideNavLinks();
  }
})();

/* Shared accessible menu and scroll reveals. Does not change auction, login,
   registration, verification or dashboard data flows. */
(() => {
  const header = document.querySelector('[data-site-header]');
  const toggle = header?.querySelector('.site-menu-toggle');
  const nav = header?.querySelector('.site-nav');

  if (header && toggle && nav) {
    const close = () => {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'فتح قائمة التنقل');
    };
    toggle.addEventListener('click', () => {
      const opened = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(opened));
      toggle.setAttribute('aria-label', opened ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل');
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const wasOpen = header.classList.contains('menu-open');
        close();
        if (wasOpen) toggle.focus();
      }
    });
    window.matchMedia('(min-width: 921px)').addEventListener('change', close);
  }

  // Keep the account action correct even on informational pages that do not
  // load the auction/account application script.
  const accountLink = header?.querySelector('#site-account-link');
  if (accountLink?.getAttribute('href') === 'login.html') {
    try {
      const session = JSON.parse(localStorage.getItem('alfaw_phase3_session') || 'null');
      if (session?.role) {
        const target = session.role === 'seller' ? 'seller-dashboard.html'
          : session.role === 'admin' ? 'admin-dashboard.html' : 'profile.html';
        const label = session.role === 'seller' ? 'لوحة البائع'
          : session.role === 'admin' ? 'لوحة المسؤول' : 'حسابي';
        accountLink.setAttribute('href', target);
        accountLink.textContent = label;
      }
    } catch (_) { /* Browser storage may be disabled. */ }
  }

  // The homepage has its own cinematic scroll timeline; do not interfere.
  if (document.body.classList.contains('home-page')) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;

  const revealTargets = [
    'main > section',
    'main > div > section',
    '.bidding-guide-hero',
    '.bidding-guide-step',
    '.bidding-guide-rules',
    '.browse-artifact-card',
    '.auction-card',
    '.seller-directory-card',
    '.seller-artifact-card',
    '.seller-review-card',
    '.verification-card',
    '.verification-status-card',
    '.profile-panel',
    '.dashboard-panel',
    '.admin-panel',
    '.manage-auctions-form-card',
    '.manage-artifact-form-card',
    '.login-form-card',
    '.register-form-card',
    '.profile-discover-card',
    '.login-explore-card',
    '.register-help-card',
    '.collection-verification'
  ];
  const cardSelectors = '.bidding-guide-step,.browse-artifact-card,.auction-card,.seller-directory-card,.seller-artifact-card,.seller-review-card,.verification-card,.profile-panel,.dashboard-panel,.admin-panel,.profile-discover-card,.login-explore-card,.register-help-card';
  const selector = revealTargets.join(',');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  function addReveals(scope = document) {
    scope.querySelectorAll(selector).forEach((element) => {
      if (element.classList.contains('alfaw-reveal') || element.hasAttribute('hidden')) return;
      // Avoid hiding the main layout when it contains long lists: animate its cards.
      if (element.classList.contains('browse-content') || element.classList.contains('auctions-main')) return;
      element.classList.add('alfaw-reveal');
      if (element.matches(cardSelectors)) {
        element.classList.add('alfaw-card-reveal');
        const siblings = Array.from(element.parentElement?.children || []).filter(node => node.matches?.(cardSelectors));
        const order = Math.max(0, siblings.indexOf(element));
        element.style.setProperty('--reveal-delay', `${Math.min(order % 4, 3) * 85}ms`);
      }
      // Content initially on screen should never flash or disappear on load.
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.90 && rect.bottom > 0) {
        element.classList.add('is-visible');
      } else {
        observer.observe(element);
      }
    });
  }
  addReveals();
  document.documentElement.classList.add('alfaw-motion-ready');

  // Cards added after searching/filtering should animate as well.
  let scheduled = false;
  const mutations = new MutationObserver(records => {
    if (!records.some(record => record.addedNodes.length)) return;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      addReveals();
    });
  });
  const main = document.querySelector('main');
  if (main) mutations.observe(main, { childList: true, subtree: true });
})();


/* Qamat-inspired guide: draw the timeline as visitors scroll; reveal each card. */
(() => {
  const guide = document.querySelector('.auctions-page .alfaw-guide');
  if (!guide) return;
  const timeline = guide.querySelector('.alfaw-guide-timeline');
  const progress = guide.querySelector('.alfaw-guide-track-progress');
  const rows = [...guide.querySelectorAll('.alfaw-guide-row')];
  if (!timeline || !progress || !rows.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    progress.style.height = '100%';
    return;
  }
  // Keep all cards visible when IntersectionObserver is unavailable.
  if (!('IntersectionObserver' in window)) return;
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -35px 0px' });
  rows.forEach(row => {
    if (row.getBoundingClientRect().top < window.innerHeight * .95) row.classList.add('is-visible');
    else reveal.observe(row);
  });
  guide.classList.add('alfaw-guide-motion');
  let pending = false;
  const updateProgress = () => {
    pending = false;
    const rect = timeline.getBoundingClientRect();
    const height = rect.height;
    if (!height) return;
    const drawn = Math.min(height, Math.max(0, window.innerHeight * .68 - rect.top));
    progress.style.height = `${drawn}px`;
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateProgress);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
})();

/* Backward compatibility: remove old cached seller-directory eyebrow labels. */
if (document.body.classList.contains('sellers-page')) {
  document.querySelectorAll('.sellers-section-heading .section-label').forEach(label => {
    if (label.textContent.includes('تعرّف على البائعين')) label.remove();
  });
}
