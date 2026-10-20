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
  if (accountLink) {
    try {
      const session = JSON.parse(localStorage.getItem('alfaw_phase3_session') || 'null');
      if (session?.role) {
        const target = session.role === 'admin' ? 'admin-dashboard.html' : 'profile.html';
        accountLink.setAttribute('href', target);
        accountLink.textContent = session.role === 'admin' ? 'لوحة المسؤول' : 'حسابي';
        if(session.role === 'seller' && header && !header.querySelector('#seller-navbar-dashboard')){
          const link = document.createElement('a');
          link.id = 'seller-navbar-dashboard';
          link.href = 'seller-dashboard.html';
          link.className = 'seller-navbar-dashboard';
          link.textContent = 'لوحة البائع';
          const navigation = header.querySelector('#site-navigation');
          if(navigation){
            navigation.append(link);
            if(location.pathname.endsWith('/seller-dashboard.html'))link.setAttribute('aria-current','page');
          }
        }
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


/* ALFAW MOTION SUITE — progressive enhancement; no layout/interaction changes. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motionAllowed = () => !reduce.matches;
  const itemSelector = '.browse-artifact-card, .seller-artifact-card, .seller-auction-card, .auction-card, .seller-card, .verification-status-card, .login-explore-card, .register-help-card';
  const items = [...document.querySelectorAll(itemSelector)];
  items.forEach(card => card.classList.add('alfaw-motion-card'));

  // Gentle border tracing and gallery illumination, only on pointing devices.
  if (finePointer) {
    items.forEach(card => {
      card.addEventListener('pointermove', event => {
        if (!motionAllowed()) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--alfaw-pointer-x', ((event.clientX-rect.left)/rect.width*100).toFixed(1)+'%');
        card.style.setProperty('--alfaw-pointer-y', ((event.clientY-rect.top)/rect.height*100).toFixed(1)+'%');
      }, {passive:true});
    });
  }

  // Subtle entrance sequence. No hide-until-observed state: content remains
  // legible if observers fail or the user prefers reduced movement.
  if ('IntersectionObserver' in window && motionAllowed()) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('alfaw-motion-seen');
        obs.unobserve(entry.target);
      });
    }, {threshold:0.08, rootMargin:'0px 0px -20px 0px'});
    document.querySelectorAll('body:not(.home-page) main :is(.seller-section-heading,.sellers-results-heading,.results-heading,.verification-status-card,.browse-artifact-card,.seller-card,.auction-card,.seller-artifact-card,.seller-auction-card,.login-explore-card,.register-help-card)').forEach((el, index) => {
      el.classList.add('alfaw-motion-reveal');
      el.style.setProperty('--alfaw-motion-delay',(index%4*65)+'ms');
      observer.observe(el);
    });
  }

  // Heritage headline mask accent, not a typing animation or replacement text.
  document.querySelectorAll('body:not(.home-page) main :is(.collection-hero h1,.auctions-hero h1,.verification-hero h1,.sellers-hero h1,.sellers-section-heading h2,.seller-section-heading h2,.login-form-heading h2,.register-form-heading h2)').forEach(el => {
    el.classList.add('alfaw-motion-heading');
  });

  // A one-time emblem highlight, avoiding continuous distracting motion.
  document.querySelectorAll('.site-logo-mark').forEach(el => el.classList.add('alfaw-motion-emblem'));

  // Animate only authentic auction value changes (never invent bid updates).
  const priceSelector = '.auction-current-bid, .auction-highest-bid, [id="auction-current-bid"], [id="auction-highest-bid"]';
  document.querySelectorAll(priceSelector).forEach(el => {
    let previous = el.textContent.trim();
    let initialized = false;
    const observer = new MutationObserver(() => {
      const next = el.textContent.trim();
      if (next === previous) return;
      previous = next;
      if (!initialized) { initialized = true; return; }
      if (!motionAllowed()) return;
      el.classList.remove('alfaw-bid-changed');
      void el.offsetWidth;
      el.classList.add('alfaw-bid-changed');
    });
    observer.observe(el,{subtree:true,characterData:true,childList:true});
  });
})();


/* Six cinematic experiences for AlFaw — isolated and reversible. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 767px)');
  const lowPower = matchMedia('(prefers-reduced-data: reduce)').matches || navigator.connection?.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const allowHeavy = () => !reduced.matches && !mobile.matches && !lowPower;
  const okay = () => !reduced.matches;
  const browse = document.body.classList.contains('browse-page');
  const detail = document.body.classList.contains('artifact-detail-page');
  const safe = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  // 1. Card → detail cinematic flight; normal navigation remains the fallback.
  if (browse) {
    document.addEventListener('click', event => {
      const link = event.target.closest('.browse-artifact-card a[href*="artifact-detail.html"]');
      if (!link || !allowHeavy() || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button || link.target === '_blank') return;
      const card = link.closest('.browse-artifact-card');
      const img = card?.querySelector('.browse-artifact-image img');
      if (!img || !img.complete || !img.naturalWidth) return;
      event.preventDefault();
      const rect = img.getBoundingClientRect();
      const fly = img.cloneNode(true);
      fly.className = 'alfaw-flying-artifact';
      Object.assign(fly.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',objectFit:'contain',zIndex:'3000',pointerEvents:'none'});
      document.body.append(fly);
      const finish = () => { window.location.href = link.href; };
      try { sessionStorage.setItem('alfaw-detail-flight','1'); } catch (_) {}
      const animation = fly.animate([
        {transform:'translate(0,0) scale(1)',opacity:1,borderRadius:'12px'},
        {transform:'translate('+(innerWidth/2-(rect.left+rect.width/2))+'px,'+(innerHeight/2-(rect.top+rect.height/2))+'px) scale('+(mobile.matches?1:1.22)+')',opacity:.15,borderRadius:'24px'}
      ],{duration:490,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
      animation.onfinish=finish;
      setTimeout(finish,650);
    });
  }

  // 2 & 4. Perspective carousel and subtle scroll-driven parallax of the
  // actual catalogue images. No fabricated artefacts or extra assets.
  if (browse) {
    const cards = [...document.querySelectorAll('#browse-grid .browse-artifact-card')].slice(0,6);
    if (cards.length >= 3 && !lowPower) {
      const stage = document.createElement('section');
      stage.className = 'alfaw-3d-showcase';
      stage.setAttribute('aria-label','معرض مقتنيات ألفاو التفاعلي');
      stage.innerHTML = '<div class="alfaw-3d-heading"><span>من كنوز ألفاو</span><h2>اكتشف المقتنيات من زاوية أخرى</h2><p>استعرض مختارات من القطع التاريخية بحركة مستوحاة من قاعات العرض المتحفية.</p></div><div class="alfaw-3d-stage" aria-live="polite"></div><div class="alfaw-3d-controls"><button type="button" data-go="next" aria-label="القطعة التالية">السابق ←</button><button type="button" data-go="previous" aria-label="القطعة السابقة">→ التالي</button></div>';
      const display = stage.querySelector('.alfaw-3d-stage');
      const entries = cards.map(card=>{
        const img=card.querySelector('img'); const title=card.querySelector('h3');const a=card.querySelector('a[href*="artifact-detail.html"]');
        return {src:img?.getAttribute('src')||'',title:title?.textContent.trim()||'مقتنى تاريخي',href:a?.getAttribute('href')||'browse.html'};
      });
      let active=0;
      const render=()=>{
        display.innerHTML='';
        entries.forEach((item,i)=>{
          const offset=(i-active+entries.length)%entries.length;
          const signed=offset>entries.length/2?offset-entries.length:offset;
          if(Math.abs(signed)>2)return;
          const a=document.createElement('a');a.href=item.href;a.className='alfaw-3d-item';
          a.style.setProperty('--offset',String(signed));
          a.style.setProperty('--abs-offset',String(Math.abs(signed)));
          a.style.zIndex=String(6-Math.abs(signed));
          a.setAttribute('aria-label','عرض تفاصيل '+item.title);
          a.innerHTML='<img loading="lazy" src="'+safe(item.src)+'" alt="'+safe(item.title)+'"><strong>'+safe(item.title)+'</strong>';
          if(signed!==0)a.tabIndex=-1;
          display.append(a);
        });
      };
      stage.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>{
        active=(active+(button.dataset.go==='next'?1:-1)+entries.length)%entries.length;render();
      }));
      render();
      const target=document.querySelector('.browse-search-section');
      if(target)target.before(stage);
      if(allowHeavy()){
        let ticking=false;
        const parallax=()=>{
          ticking=false;
          const rect=stage.getBoundingClientRect();
          if(rect.bottom<0||rect.top>innerHeight)return;
          const movement=Math.max(-18,Math.min(18,(innerHeight/2-(rect.top+rect.height/2))*0.035));
          stage.style.setProperty('--alfaw-parallax',movement.toFixed(1)+'px');
        };
        addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(parallax)}},{passive:true});
        parallax();
      }
    }
  }

  // 3. A soft circular reveal of the primary artifact image on arrival.
  if(detail) {
    const image=document.getElementById('artifact-main-photo');
    if(image && allowHeavy()) {
      const start=()=>{image.classList.add('alfaw-mask-opening');};
      if(image.complete)requestAnimationFrame(start);
      else image.addEventListener('load',start,{once:true});
    }
  }

  // 5. Animate complete Arabic headlines as a single piece, preserving ligatures.
  if(allowHeavy()) {
    document.querySelectorAll('.alfaw-3d-heading h2, .artifact-information-section h2, .verification-section h2').forEach(el=>{
      el.classList.add('alfaw-whole-title');
    });
  }

  // 6. An educational journey, explicitly described as general stages,
  // not an unverifiable provenance history for the particular artifact.
  if(detail) {
    const anchor=document.querySelector('.artifact-information-section');
    if(anchor) {
      const section=document.createElement('section');
      section.className='alfaw-journey';
      section.setAttribute('aria-label','رحلة المقتنى في المنصة');
      section.innerHTML='<div class="alfaw-journey-heading"><span>رحلة المقتنى</span><h2>من الحكاية إلى المزاد</h2><p>مراحل توضيحية لاستكشاف المعلومات وعرض المقتنيات على منصة ألفاو، وليست سجلًا تاريخيًا موثقًا لهذه القطعة.</p></div><div class="alfaw-journey-track"><div class="alfaw-journey-progress"></div><div class="alfaw-journey-stop"><b>01</b><h3>استكشاف</h3><p>تعرّف على القطعة وحكايتها.</p></div><div class="alfaw-journey-stop"><b>02</b><h3>مراجعة المعلومات</h3><p>اطّلع على البيانات وحالة التوثيق.</p></div><div class="alfaw-journey-stop"><b>03</b><h3>العرض</h3><p>استكشف القطعة ضمن المقتنيات.</p></div><div class="alfaw-journey-stop"><b>04</b><h3>المزاد</h3><p>تابع المزادات عندما تتوفر.</p></div></div>';
      anchor.after(section);
      const draw=()=>{
        const rect=section.getBoundingClientRect();
        const progress=Math.min(100,Math.max(0,(innerHeight*.75-rect.top)/(rect.height||1)*100));
        section.style.setProperty('--alfaw-journey-progress',progress.toFixed(1)+'%');
      };
      if(okay()){
        let queued=false;
        const update=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;draw();});};
        addEventListener('scroll',update,{passive:true});addEventListener('resize',update);draw();
      } else section.style.setProperty('--alfaw-journey-progress','100%');
    }
  }
})();


// Highlight the seller dashboard section currently in view.
// Account for the sticky header and preserve link-based navigation.
(() => {
  if (!document.body.classList.contains('seller-dashboard-page')) return;
  const links = [...document.querySelectorAll('.dashboard-side-nav a[href^="#dashboard-"]')];
  const sections = links.map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(item => item.section);
  if (!sections.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const headerHeight = document.querySelector('[data-site-header]')?.getBoundingClientRect().height || 0;
    const threshold = headerHeight + 110;
    let selected = sections[0];
    for (const item of sections) {
      if (item.section.getBoundingClientRect().top <= threshold) selected = item;
    }
    for (const item of sections) {
      const active = item === selected;
      item.link.classList.toggle('active', active);
      if (active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  };
  const schedule = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  document.addEventListener('DOMContentLoaded', schedule);
  schedule();
})();
