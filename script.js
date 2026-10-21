
"use strict";

// =========================================
// ALFAW — COMPLETE SHARED JAVASCRIPT
// =========================================

// =========================================
// GENERAL HELPERS
// =========================================

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function smooth(start, end, value) {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  const x = clamp(
    (value - start) / (end - start)
  );

  return x * x * (3 - 2 * x);
}

function normalizeArabic(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "");
}

// =========================================
// CINEMATIC 3D ELEMENTS
// =========================================

const cinema = document.querySelector(".cinema-scroll");

const scenes = Array.from(
  document.querySelectorAll(".cinema-scene")
);

const background =
  document.querySelector(".sky-img");

const buildingScene =
  document.querySelector(".rotating-building");

const buildingImage =
  document.querySelector(".building-image");

const namingDecoration =
  document.querySelector(".naming-decoration");

const universityEmblem =
  document.querySelector(".university-emblem");

const tradeVisual =
  document.querySelector(".trade-visual");

const purposeOrb =
  document.querySelector(".purpose-orb");

const scrollGuide =
  document.querySelector(".scroll-guide");

const scrollGuideProgress =
  document.querySelector(".scroll-guide-progress");

const chapterCurrent =
  document.querySelector(".chapter-current");

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

// =========================================
// SCENE CONFIGURATION
// =========================================

const sceneOrder = [
  "hero",
  "naming",
  "university",
  "trade",
  "purpose",
  "conclusion"
];

const sceneRanges = {
  hero:       [0.00, 0.16],
  naming:     [0.16, 0.33],
  university: [0.33, 0.50],
  trade:      [0.50, 0.67],
  purpose:    [0.67, 0.84],
  conclusion: [0.84, 1.00]
};

let scrollCurrent = 0;
let scrollTarget = 0;

let mouseX = 0;
let mouseY = 0;

let targetMouseX = 0;
let targetMouseY = 0;

let ticking = false;
let initialized = false;

// =========================================
// CINEMA SCROLL HELPERS
// =========================================

function getMaxCinemaScroll() {
  if (!cinema) return 0;

  return Math.max(
    0,
    cinema.offsetHeight - window.innerHeight
  );
}

function getCinemaScroll() {
  if (!cinema) return 0;

  const rect = cinema.getBoundingClientRect();

  return clamp(
    -rect.top,
    0,
    getMaxCinemaScroll()
  );
}

// =========================================
// SCENE VISIBILITY
// =========================================

function getSceneVisibility(name, progress) {
  const range = sceneRanges[name];

  if (!range) return 0;

  const [start, end] = range;
  const duration = end - start;

  const fade = Math.min(
    duration * 0.24,
    0.038
  );

  const entering = start === 0
    ? 1
    : smooth(start - fade, start + fade, progress);

  const leaving = end === 1
    ? 1
    : 1 - smooth(end - fade, end + fade, progress);

  return clamp(entering * leaving);
}

function renderScene(scene, visibility) {
  if (!scene) return;

  const amount = clamp(visibility);

  const depth = (1 - amount) * -140;
  const scale = 0.94 + amount * 0.06;

  scene.style.opacity = amount;

  scene.style.transform = `
    translate3d(0,0,${depth}px)
    scale(${scale})
  `;

  scene.style.visibility =
    amount > 0.005
      ? "visible"
      : "hidden";

  const interactive = amount > 0.9;

  scene.style.pointerEvents =
    interactive ? "auto" : "none";

  scene.setAttribute(
    "aria-hidden",
    interactive ? "false" : "true"
  );

  // Invisible scenes cannot receive focus.
  scene.inert = !interactive;
}

function getCurrentScene(progress) {
  for (let i = sceneOrder.length - 1; i >= 0; i--) {
    const start = sceneRanges[sceneOrder[i]][0];

    if (progress >= start) {
      return i + 1;
    }
  }

  return 1;
}

// =========================================
// MAIN 3D ANIMATION LOOP
// =========================================

function animateCinema() {
  ticking = false;

  if (!cinema) return;

  scrollTarget = getCinemaScroll();

  if (!initialized || reduceMotion.matches) {
    scrollCurrent = scrollTarget;
    initialized = true;
  } else {
    scrollCurrent = lerp(
      scrollCurrent,
      scrollTarget,
      0.12
    );
  }

  if (Math.abs(scrollCurrent - scrollTarget) < 0.1) {
    scrollCurrent = scrollTarget;
  }

  if (reduceMotion.matches) {
    mouseX = 0;
    mouseY = 0;
  } else {
    mouseX = lerp(mouseX, targetMouseX, 0.1);
    mouseY = lerp(mouseY, targetMouseY, 0.1);
  }

  const maxScroll = getMaxCinemaScroll();

  const progress = maxScroll > 0
    ? clamp(scrollCurrent / maxScroll)
    : 0;

  // =====================================
  // SCENE TRANSITIONS
  // =====================================

  scenes.forEach((scene) => {
    const name = scene.dataset.sceneId;

    const visibility = getSceneVisibility(
      name,
      progress
    );

    renderScene(scene, visibility);
  });

  // =====================================
  // BACKGROUND PARALLAX
  // =====================================

  if (background) {
    const zoom = 1.1 + progress * 0.12;

    background.style.transform = `
      translate3d(
        ${mouseX * -25}px,
        ${mouseY * -17}px,
        0
      )
      scale(${zoom})
    `;
  }

  // =====================================
  // HERITAGE BUILDING
  // FIXED IN CENTER, ROTATES WITH SCROLL
  // =====================================

  if (buildingScene && buildingImage) {
    const heroProgress = clamp(
      progress / sceneRanges.hero[1]
    );


    buildingScene.style.transform =
      "translate3d(-50%,-50%,0)";

    const rotateY = reduceMotion.matches
      ? 0
      : heroProgress * 55 + mouseX * 8;

    const rotateX = reduceMotion.matches
      ? 0
      : mouseY * -8;

    buildingImage.style.transform = `
      rotateY(${rotateY}deg)
      rotateX(${rotateX}deg)
      scale(1)
    `;
  }

  // =====================================
  // NAMING — 3D RINGS
  // =====================================

  if (namingDecoration) {
    const local = clamp(
      (progress - 0.16) / 0.17
    );

    const rotateY = reduceMotion.matches
      ? 0
      : -20 + local * 45 + mouseX * 8;

    const rotateX = reduceMotion.matches
      ? 0
      : mouseY * -8;

    namingDecoration.style.transform = `
      rotateY(${rotateY}deg)
      rotateX(${rotateX}deg)
    `;
  }

  // =====================================
  // UNIVERSITY — 1972
  // =====================================

  if (universityEmblem) {
    const local = clamp(
      (progress - 0.33) / 0.17
    );

    const rotateY = reduceMotion.matches
      ? 0
      : (1 - local) * -15 + mouseX * 9;

    universityEmblem.style.transform = `
      rotateY(${rotateY}deg)
      rotateX(${mouseY * -5}deg)
    `;
  }

  // =====================================
  // TRADE TRANSFORMATION
  // =====================================

  if (tradeVisual) {
    const local = clamp(
      (progress - 0.50) / 0.17
    );

    const rotateY = reduceMotion.matches
      ? 0
      : (1 - local) * 12 + mouseX * 5;

    tradeVisual.style.transform = `
      rotateY(${rotateY}deg)
      rotateX(${mouseY * -4}deg)
    `;
  }

  // =====================================
  // PURPOSE ORB
  // =====================================

  if (purposeOrb) {
    const local = clamp(
      (progress - 0.67) / 0.17
    );

    const rotateY = reduceMotion.matches
      ? 0
      : local * 40 + mouseX * 10;

    purposeOrb.style.transform = `
      rotateY(${rotateY}deg)
      rotateX(${mouseY * -8}deg)
    `;
  }

  // =====================================
  // PROGRESS INDICATORS
  // =====================================

  if (scrollGuideProgress) {
    scrollGuideProgress.style.width =
      `${progress * 100}%`;
  }

  if (scrollGuide) {
    scrollGuide.style.opacity =
      1 - smooth(0.90, 1, progress);
  }

  if (chapterCurrent) {
    chapterCurrent.textContent =
      String(getCurrentScene(progress)).padStart(2, "0");
  }

  // =====================================
  // CONTINUE SMOOTH MOTION
  // =====================================

  const scrollMoving =
    Math.abs(scrollCurrent - scrollTarget) > 0.1;

  const mouseMoving =
    Math.abs(mouseX - targetMouseX) > 0.001 ||
    Math.abs(mouseY - targetMouseY) > 0.001;

  if (
    scrollMoving ||
    (!reduceMotion.matches && mouseMoving)
  ) {
    requestTick();
  }
}

function requestTick() {
  if (!cinema || ticking) return;

  ticking = true;

  requestAnimationFrame(animateCinema);
}

// =========================================
// MOUSE PARALLAX + SCROLL EVENTS
// =========================================

if (cinema) {
  window.addEventListener(
    "pointermove",
    (event) => {
      if (reduceMotion.matches) return;

      targetMouseX =
        event.clientX / window.innerWidth - 0.5;

      targetMouseY =
        event.clientY / window.innerHeight - 0.5;

      requestTick();
    },
    { passive: true }
  );

  window.addEventListener(
    "scroll",
    requestTick,
    { passive: true }
  );

  window.addEventListener("resize", () => {
    initialized = false;
    requestTick();
  });

  reduceMotion.addEventListener?.("change", () => {
    initialized = false;
    requestTick();
  });
}

// =========================================
// SCENE NAVIGATION
// =========================================

function navigateToScene(name, behavior = "smooth") {
  if (!cinema) return;

  const range = sceneRanges[name];
  if (!range) return;

  const center = (range[0] + range[1]) / 2;

  const top =
    window.scrollY +
    cinema.getBoundingClientRect().top;

  window.scrollTo({
    top: top + getMaxCinemaScroll() * center,
    behavior
  });
}

document.querySelectorAll("[data-scene]").forEach(
  (link) => {
    link.addEventListener("click", (event) => {
      if (!cinema) return;

      event.preventDefault();

      navigateToScene(
        link.dataset.scene,
        reduceMotion.matches ? "auto" : "smooth"
      );
    });
  }
);

// Open a home scene from a URL hash.

if (cinema) {
  const initialScene =
    window.location.hash.slice(1);

  if (Object.prototype.hasOwnProperty.call(
    sceneRanges,
    initialScene
  )) {
    const openInitialScene = () => {
      navigateToScene(initialScene, "auto");
      initialized = false;
      requestTick();
    };

    if (document.readyState === "complete") {
      openInitialScene();
    } else {
      window.addEventListener(
        "load",
        openInitialScene,
        { once: true }
      );
    }
  }
}

// =========================================
// GENERAL PAGE BUTTONS
// =========================================

document.querySelectorAll("[data-go-to]").forEach(
  (button) => {
    button.addEventListener("click", () => {
      const destination = button.dataset.goTo;

      if (destination) {
        window.location.href = destination;
      }
    });
  }
);

// =========================================
// BROWSE PAGE
// =========================================

const browseGrid =
  document.querySelector("#browse-grid");

const searchForm =
  document.querySelector("#artifact-search");

const searchInput =
  document.querySelector("#artifact-search-input");

const categoryFilter =
  document.querySelector("#category-filter");

const verificationFilter =
  document.querySelector("#verification-filter");

const priceFilter =
  document.querySelector("#price-filter");

const sortFilter =
  document.querySelector("#sort-filter");

const clearFiltersButton =
  document.querySelector("#clear-filters");

const artifactCount =
  document.querySelector("#artifact-count");

const noArtifacts =
  document.querySelector("#no-artifacts");

let browsePageIndex = 1;
const browsePageSize = 6;

function formatResultsCount(count) {
  if (count === 0) return "لا توجد قطع أثرية";
  if (count === 1) return "قطعة أثرية واحدة";

  if (count === 2) return "قطعتان أثريتان";

  if (count >= 3 && count <= 10) {
    return `${count} قطع أثرية`;
  }

  return `${count} قطعة أثرية`;
}

// =========================================
// BROWSE SEARCH AND FILTERING
// =========================================

function filterArtifacts() {
  if (!browseGrid) return;

  const search = searchInput
    ? normalizeArabic(searchInput.value)
    : "";

  const category = categoryFilter
    ? categoryFilter.value
    : "all";

  const verification = verificationFilter
    ? verificationFilter.value
    : "all";

  const priceRange = priceFilter
    ? priceFilter.value
    : "all";

  let count = 0;

  browseGrid.querySelectorAll(
    ".browse-artifact-card"
  ).forEach((card) => {
    const name =
      normalizeArabic(card.dataset.name);

    const description =
      normalizeArabic(card.textContent);

    const price =
      Number(card.dataset.price);

    const matchesSearch =
      name.includes(search) ||
      description.includes(search);

    const matchesCategory =
      category === "all" ||
      card.dataset.category === category;

    const matchesVerification =
      verification === "all" ||
      card.dataset.verification === verification;

    let matchesPrice = true;

    if (priceRange === "under5000") {
      matchesPrice = price < 5000;
    } else if (priceRange === "5000to15000") {
      matchesPrice = price >= 5000 && price <= 15000;
    } else if (priceRange === "over15000") {
      matchesPrice = price > 15000;
    }

    const visible =
      matchesSearch &&
      matchesCategory &&
      matchesVerification &&
      matchesPrice;

    card.hidden = !visible;
    card.dataset.matches = visible ? 'true' : 'false';

    if (visible) count++;
  });

  if (artifactCount) {
    artifactCount.textContent =
      formatResultsCount(count);
  }

  if (noArtifacts) {
    noArtifacts.hidden = count !== 0;
  }
  const matches = [...browseGrid.querySelectorAll('.browse-artifact-card')].filter(card => card.dataset.matches === 'true');
  const pages = Math.max(1, Math.ceil(matches.length / browsePageSize));
  browsePageIndex = Math.min(browsePageIndex, pages);
  matches.forEach((card, index) => card.hidden = index < (browsePageIndex - 1) * browsePageSize || index >= browsePageIndex * browsePageSize);
  const nav=document.getElementById('alfaw-browse-pagination');
  if(nav){
    nav.hidden=matches.length<=browsePageSize;
    const label=nav.querySelector('[data-pagination-label]');if(label)label.textContent=`الصفحة ${browsePageIndex} من ${pages}`;
    const prev=nav.querySelector('[data-page-prev]');if(prev)prev.disabled=browsePageIndex===1;
    const next=nav.querySelector('[data-page-next]');if(next)next.disabled=browsePageIndex>=pages;
  }
}

// =========================================
// BROWSE SORTING
// =========================================

function sortArtifacts() {
  if (!browseGrid) return;

  const sort = sortFilter
    ? sortFilter.value
    : "default";

  const cards = Array.from(
    browseGrid.querySelectorAll(
      ".browse-artifact-card"
    )
  );

  if (sort === "price-low") {
    cards.sort((a, b) =>
      Number(a.dataset.price) -
      Number(b.dataset.price)
    );
  } else if (sort === "price-high") {
    cards.sort((a, b) =>
      Number(b.dataset.price) -
      Number(a.dataset.price)
    );
  } else if (sort === "name") {
    cards.sort((a, b) =>
      (a.dataset.name || "").localeCompare(
        b.dataset.name || "",
        "ar",
        { sensitivity: "base" }
      )
    );
  } else {
    cards.sort((a, b) =>
      Number(a.dataset.originalIndex) -
      Number(b.dataset.originalIndex)
    );
  }

  cards.forEach((card) => {
    browseGrid.appendChild(card);
  });

  filterArtifacts();
}

// =========================================
// BROWSE INITIALIZATION
// =========================================

function setupBrowsePage() {
  if (!browseGrid) return;
  const pagination=document.createElement('nav');pagination.id='alfaw-browse-pagination';pagination.className='alfaw-pagination';
  pagination.setAttribute('aria-label','صفحات المقتنيات');pagination.innerHTML='<button type="button" data-page-prev>السابق</button><span data-pagination-label aria-live="polite"></span><button type="button" data-page-next>التالي</button>';
  browseGrid.insertAdjacentElement('afterend',pagination);
  pagination.querySelector('[data-page-prev]').addEventListener('click',()=>{browsePageIndex=Math.max(1,browsePageIndex-1);filterArtifacts()});
  pagination.querySelector('[data-page-next]').addEventListener('click',()=>{browsePageIndex++;filterArtifacts()});

  browseGrid.querySelectorAll(
    ".browse-artifact-card"
  ).forEach((card, index) => {
    card.dataset.originalIndex = index;
  });

  const params = new URLSearchParams(
    window.location.search
  );

  // Navigate from the "Verification" menu.

  // Opening browse.html from the navigation resets every filter.
  // Explicit verification links from verification.html still apply a selected status.
  if (searchInput) searchInput.value = "";
  if (categoryFilter) categoryFilter.value = "all";
  if (priceFilter) priceFilter.value = "all";
  if (sortFilter) sortFilter.value = "default";
  if (verificationFilter) {
    const requestedVerification = params.get("verification");
    verificationFilter.value = ["verified", "pending", "unverified"].includes(requestedVerification)
      ? requestedVerification : "all";
  }
  try { sessionStorage.removeItem("alfaw_browse_verification"); } catch (_) {}

  // A click on the artifacts navbar link must clear filters even when already
  // on browse.html (when browsers may retain the same page and its controls).
  const resetBrowseToDefault = () => {
    if (searchInput) searchInput.value = "";
    if (categoryFilter) categoryFilter.value = "all";
    if (verificationFilter) verificationFilter.value = "all";
    if (priceFilter) priceFilter.value = "all";
    if (sortFilter) sortFilter.value = "default";
    browsePageIndex = 1;
    try { sessionStorage.removeItem("alfaw_browse_verification"); } catch (_) {}
    sortArtifacts();
  };
  document.querySelectorAll('.site-nav a[href="browse.html"]').forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      if (location.search || location.hash) {
        history.replaceState(null, "", location.pathname);
      }
      resetBrowseToDefault();
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  });

  // Navigate from the "Auctions" menu.

  if (params.get("view") === "auctions") {
    const heading =
      document.querySelector(".results-heading h2");

    if (heading) {
      heading.textContent =
        "القطع المعروضة للمزادات";
    }
  }

  if (searchForm) {
    searchForm.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        browsePageIndex=1;
        filterArtifacts();
      }
    );
  }

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      () => { browsePageIndex=1; filterArtifacts(); }
    );
  }

  if (categoryFilter) {
    categoryFilter.addEventListener(
      "change",
      () => { browsePageIndex=1; filterArtifacts(); }
    );
  }

  if (verificationFilter) {
    verificationFilter.addEventListener(
      "change",
      () => {
        browsePageIndex=1;
        filterArtifacts();
      }
    );
  }

  if (priceFilter) {
    priceFilter.addEventListener(
      "change",
      () => { browsePageIndex=1; filterArtifacts(); }
    );
  }

  if (sortFilter) {
    sortFilter.addEventListener(
      "change",
      () => { browsePageIndex=1; sortArtifacts(); }
    );
  }

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener(
      "click",
      () => {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "all";

        if (verificationFilter) {
          verificationFilter.value = "all";
          try { sessionStorage.removeItem("alfaw_browse_verification"); } catch (_) {}
        }

        if (priceFilter) priceFilter.value = "all";
        if (sortFilter) sortFilter.value = "default";

        browsePageIndex=1;
        sortArtifacts();
      }
    );
  }

  filterArtifacts();
}

setupBrowsePage();

// =========================================
// SELLER DATA
// These are illustrative profiles.
// =========================================

const alfawSellers = {
  ahmed: {
    name: "أحمد الخالد",
    initials: "أخ",
    city: "الرياض",
    specialty: "العملات العربية القديمة والمسكوكات",
    rating: "4.9",
    items: 12,
    sales: 20,
    member: 2022,

    bio: "مهتم بجمع العملات العربية القديمة والمسكوكات التاريخية، ويسعى إلى مشاركة قصصها وتاريخها مع هواة الاقتناء.",

    about: "تتركز مجموعة أحمد الخالد على العملات التاريخية والمسكوكات التي تعكس تاريخ التبادل التجاري والحضارات في الجزيرة العربية. ويهتم بتقديم المعلومات المرتبطة بكل قطعة ومصدرها وحالة توثيقها.",

    artifacts: [
      {
        name: "عملة عربية قديمة",
        image: "coin.jpg",
        description: "عملة تاريخية ذات طابع عربي قديم.",
        price: "4,500 ريال"
      },
      {
        name: "عملة فضية إسلامية",
        image: "silver-coin.jpg",
        description: "قطعة من التراث النقدي الإسلامي.",
        price: "6,500 ريال"
      }
    ]
  },

  noura: {
    name: "نورة العتيبي",
    initials: "نع",
    city: "جدة",
    specialty: "المخطوطات والوثائق التاريخية",
    rating: "4.8",
    items: 8,
    sales: 14,
    member: 2023,

    bio: "مهتمة بالمخطوطات والوثائق القديمة، وتحرص على إبراز قيمتها التاريخية والثقافية.",

    about: "تختص مجموعة نورة العتيبي بالمخطوطات القديمة والوثائق التاريخية، مع الاهتمام بأساليب الكتابة والخطوط المستخدمة وأهمية حفظ التراث المكتوب.",

    artifacts: [
      {
        name: "مخطوطة تاريخية",
        image: "manuscript.jpg",
        description: "وثيقة تاريخية مكتوبة بخط اليد.",

        price: "12,000 ريال"
      }
    ]
  },

  mohammed: {
    name: "محمد القحطاني",
    initials: "مق",
    city: "الدمام",
    specialty: "الفخار والمقتنيات التراثية",
    rating: "4.7",
    items: 15,
    sales: 18,
    member: 2021,

    bio: "هاوٍ للمقتنيات التراثية والفخارية التي تعكس الحرف التقليدية وأساليب الحياة القديمة.",

    about: "تجمع مجموعة محمد القحطاني المقتنيات الفخارية والأدوات التراثية، ويهتم بتاريخ الحرف والصناعات التقليدية في مناطق المملكة.",

    artifacts: [
      {
        name: "قطعة فخارية تراثية",
        image: "pottery.jpg",
        description: "فخار بزخارف تقليدية.",
        price: "18,000 ريال"
      },
      {
        name: "خنجر عربي تراثي",
        image: "dagger.jpg",
        description: "مقتنى تراثي يعكس صناعة المعادن.",
        price: "9,500 ريال"
      }
    ]
  },

  sara: {
    name: "سارة الحربي",
    initials: "سح",
    city: "المدينة المنورة",
    specialty: "الحُلي والمجوهرات التاريخية",
    rating: "5.0",
    items: 6,
    sales: 10,
    member: 2024,

    bio: "مهتمة بالحُلي التقليدية والمجوهرات التاريخية وفنون الصياغة المرتبطة بالتراث المحلي.",

    about: "تضم مجموعة سارة الحربي مقتنيات من الحُلي التاريخية والتقليدية، وتهتم بالزخارف والتصاميم التي تعكس تراث صناعة المجوهرات.",

    artifacts: [
      {
        name: "حُلي ذهبية تاريخية",
        image: "jewelry.jpg",
        description: "قطعة حُلي ذات تصميم تراثي.",
        price: "22,000 ريال"
      }
    ]
  }
};

// =========================================
// SELLER DIRECTORY SEARCH
// =========================================

const sellerSearch =
  document.querySelector("#seller-search");

const sellersGrid =
  document.querySelector("#sellers-grid");

const sellersEmpty =
  document.querySelector("#sellers-empty");

function filterSellers() {
  if (!sellerSearch || !sellersGrid) return;

  const query = normalizeArabic(
    sellerSearch.value
  );

  let visibleCount = 0;

  sellersGrid.querySelectorAll(
    ".seller-directory-card"
  ).forEach((card) => {
    const content = normalizeArabic(
      card.textContent
    );

    const match = content.includes(query);

    card.hidden = !match;

    if (match) visibleCount++;
  });

  if (sellersEmpty) {
    sellersEmpty.hidden = visibleCount !== 0;
  }
}

if (sellerSearch && sellersGrid) {
  sellerSearch.addEventListener(
    "input",
    filterSellers
  );
}

// =========================================
// DYNAMIC SELLER DETAILS
// =========================================

function setSellerText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = String(value);
  }
}

function createSellerArtifact(artifact) {
  const card = document.createElement("article");
  card.className = "seller-detail-artifact";

  const image = document.createElement("img");
  image.src = artifact.image;
  image.alt = artifact.name;
  image.loading = "lazy";

  const content = document.createElement("div");
  content.className = "seller-detail-artifact-content";

  const title = document.createElement("h3");
  title.textContent = artifact.name;

  const description = document.createElement("p");
  description.textContent = artifact.description;

  const price = document.createElement("strong");
  price.textContent = artifact.price;

  const link = document.createElement("a");
  link.href = "browse.html";
  link.textContent = "استكشف القطع ←";

  content.append(
    title,
    description,
    price,
    link
  );

  card.append(
    image,
    content
  );

  return card;
}

function setupSellerDetail() {
  const detailPage =
    document.querySelector("#seller-detail");

  if (!detailPage) return;

  const params = new URLSearchParams(
    window.location.search
  );

  const sellerId =
    params.get("id") || "ahmed";

  const seller = Object.prototype.hasOwnProperty.call(
    alfawSellers,
    sellerId
  )
    ? alfawSellers[sellerId]
    : null;

  if (!seller) {
    // Unknown seller ID: return to the directory.
    window.location.replace("seller-profile.html");
    return;
  }

  document.title = `${seller.name} | ألفاو`;

  setSellerText(
    "#detail-avatar",
    seller.initials
  );

  setSellerText(
    "#detail-name",
    seller.name
  );

  setSellerText(
    "#detail-location",
    `${seller.city}، المملكة العربية السعودية`
  );

  setSellerText(
    "#detail-bio",
    seller.bio
  );

  setSellerText(
    "#detail-rating",
    seller.rating
  );

  setSellerText(
    "#detail-items",
    seller.items
  );

  setSellerText(
    "#detail-sales",
    seller.sales
  );

  setSellerText(
    "#detail-member",
    seller.member
  );

  setSellerText(
    "#detail-about",
    seller.about
  );

  const artifactsContainer =
    document.querySelector("#detail-artifacts");

  if (artifactsContainer) {
    artifactsContainer.replaceChildren();

    seller.artifacts.forEach((artifact) => {
      artifactsContainer.appendChild(
        createSellerArtifact(artifact)
      );
    });
  }
}

setupSellerDetail();

// =========================================
// START HOME CINEMATIC ANIMATION
// =========================================

if (cinema) {
  requestTick();
}



/* ================================================================
   ALFAW — ADDITIONS FOR THE NEW PAGES
   Original JavaScript above is deliberately unchanged.
   No new scroll / parallax handlers are registered for the index.
   Phase 3: browser-local interface state, not a secure backend.
================================================================ */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const escape = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => (Number(n)||0).toLocaleString('ar-SA')+' ر.س';
  const date = n => n && !isNaN(Date.parse(n)) ? new Date(n).toLocaleString('ar-SA') : 'غير محدد';
  const corruptedStorageKeys=new Set();
  const get = (name,fallback) => {let x;try{x=localStorage.getItem('alfaw_phase3_'+name)}catch(error){console.warn('تعذر قراءة التخزين:',name,error);window.addEventListener('DOMContentLoaded',()=>window.dispatchEvent(new CustomEvent('alfaw:storage-error',{detail:{name,read:true}})),{once:true});return fallback}if(x===null)return fallback;try{return JSON.parse(x)}catch(error){console.error('بيانات محلية تالفة:',name,error);corruptedStorageKeys.add(name);window.addEventListener('DOMContentLoaded',()=>window.dispatchEvent(new CustomEvent('alfaw:storage-corrupt',{detail:{name}})),{once:true});return fallback}};
  const put = (name,value) => {if(corruptedStorageKeys.has(name)){console.error('تم منع الكتابة فوق بيانات تالفة:',name);window.dispatchEvent(new CustomEvent('alfaw:storage-corrupt',{detail:{name}}));return false}try {localStorage.setItem('alfaw_phase3_'+name,JSON.stringify(value));return true}catch(error){console.warn('تعذر حفظ البيانات محليًا:',name,error);window.dispatchEvent(new CustomEvent('alfaw:storage-error',{detail:{name}}));return false}};
  const id = prefix => prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const text = (s,v) => {const el=$(s);if(el)el.textContent=String(v??'')};
  const value = (s,v) => {const el=$(s);if(el)el.value=v??''};
  const visible = (s,yes=true) => {const el=$(s);if(el)el.hidden=!yes};
  const feedback = (s,v) => {const el=$(s);if(el){el.textContent=v;el.hidden=!v}};
  window.addEventListener('alfaw:storage-error',event=>{if(document.querySelector('.alfaw-storage-warning'))return;const el=document.createElement('div');el.className='alfaw-toast alfaw-storage-warning';el.setAttribute('role','alert');el.textContent='تعذر حفظ البيانات في هذا المتصفح. تأكد من توفر مساحة التخزين ثم أعد المحاولة.';const close=document.createElement('button');close.type='button';close.textContent='إغلاق';close.addEventListener('click',()=>el.remove());el.append(close);document.body.append(el)});
  window.addEventListener('alfaw:storage-corrupt',()=>{if(document.querySelector('.alfaw-storage-corrupt'))return;const el=document.createElement('div');el.className='alfaw-toast alfaw-storage-corrupt';el.setAttribute('role','alert');el.textContent='بعض البيانات المحفوظة غير قابلة للقراءة. لم يتم حذفها؛ يرجى التواصل مع الدعم قبل متابعة التعديلات.';const close=document.createElement('button');close.type='button';close.textContent='إغلاق';close.addEventListener('click',()=>el.remove());el.append(close);document.body.append(el)});
  const params = new URLSearchParams(location.search);
  const categories={coins:'العملات التاريخية',pottery:'الفخار',manuscripts:'المخطوطات',jewelry:'الحلي والمجوهرات',weapons:'المقتنيات التقليدية',other:'مقتنيات أخرى'};
  const verifications={verified:'موثق (بيانات تجريبية)',unverified:'غير موثق',pending:'قيد المراجعة'};
  const startingSellers=[
    {id:'ahmed',name:'أحمد العتيبي',city:'الرياض',category:'coins',specialty:'العملات التاريخية',bio:'مهتم بالعملات التاريخية والمقتنيات التراثية.',joined:'2026-09-01'},
    {id:'noura',name:'نورة القحطاني',city:'الرياض',category:'pottery',specialty:'الفخار التراثي',bio:'مهتمة بالفخار والحرف التقليدية.',joined:'2026-09-05'},
    {id:'khalid',name:'خالد الحربي',city:'جدة',category:'manuscripts',specialty:'المخطوطات التاريخية',bio:'مهتم بالمخطوطات التراثية.',joined:'2026-09-08'},
    {id:'fahad',name:'فهد الدوسري',city:'الدمام',category:'weapons',specialty:'المقتنيات التقليدية',bio:'مهتم بالأدوات والحلي والمقتنيات التراثية.',joined:'2026-09-10'}
  ];
  const startingArtifacts=[
    ['artifact-001','عملة تاريخية','coins',8000,'coin.jpg','ahmed','unverified'],
    ['artifact-002','إناء فخاري تراثي','pottery',6500,'pottery.jpg','noura','pending'],
    ['artifact-003','مخطوطة تاريخية','manuscripts',25000,'manuscript.jpg','khalid','verified'],
    ['artifact-004','حلية تراثية','jewelry',15000,'jewelry.jpg','fahad','unverified'],
    ['artifact-005','خنجر تراثي','weapons',12000,'dagger.jpg','fahad','pending'],
    ['artifact-006','عملة فضية تاريخية','coins',9000,'silver-coin.jpg','ahmed','verified']
  ].map(([id,name,category,price,image,sellerId,verification])=>({id,name,category,price,image,sellerId,verification,period:'غير محددة',origin:'الجزيرة العربية',condition:'غير محددة',description:`مقتنى تراثي: ${name}.`,provenance:'لا تتوفر معلومات مفصلة عن المصدر.',verificationReference:verification==='verified'?'DEMO-HC-'+id.split('-')[1]:'',documents:[],created:'2026-10-01'}));
  const startingAuctions=[
    ['auction-001','artifact-005','fahad',12000,500],
    ['auction-002','artifact-006','ahmed',9000,250],
    ['auction-003','artifact-003','khalid',25000,1000],

    ['auction-004','artifact-001','ahmed',8000,250],
    ['auction-005','artifact-002','noura',6500,250],
    ['auction-006','artifact-004','fahad',15000,500]
  ].map(([id,artifactId,sellerId,startingPrice,increment],idx)=>{
    // Illustrative times relative to the first visit so every Sprint 1 screen
    // (live, upcoming and ended) can be demonstrated without a database.
    const hours = 3600000, now = Date.now();
    const periods = [[-2,3],[-96,-72],[-1,2],[-3,4],[24,50],[72,100]];
    // Auction numbering differs from display positions; group by artifact below.
    const byId = {'auction-001':[-96,-72],'auction-002':[-72,-48],
      'auction-003':[-1,2],'auction-004':[-2,3],
      'auction-005':[24,50],'auction-006':[72,100]};
    const [from,to] = byId[id];
    return {id,artifactId,sellerId,startingPrice,increment,
      start:new Date(now+from*hours).toISOString(),
      end:new Date(now+to*hours).toISOString(),
      bids:[],created:new Date(now-2*86400000).toISOString()};
  });
  let sellers=get('sellers',startingSellers),artifacts=get('artifacts',startingArtifacts),auctions=get('auctions',startingAuctions),users=get('users',[]),reviews=get('reviews',[]),notices=get('notices',[]),session=get('session',null);
  // Merge missing demo auctions into previously saved browser data without erasing bids.
  let addedDefaultAuctions = false;
  startingAuctions.forEach(defaultAuction => {
    if (!auctions.some(existing => existing.id === defaultAuction.id)) {
      auctions.push({ ...defaultAuction, bids: [] });
      addedDefaultAuctions = true;
    }
  });
  // Upgrade the original undated demo auctions, preserving participant-entered bids.
  let repairedDemoSchedule = false;
  auctions.forEach(a => {
    const template = startingAuctions.find(seed => seed.id === a.id);
    if (template && (!a.start || !a.end)) {
      a.start = template.start; a.end = template.end; repairedDemoSchedule = true;
    }
  });
  // Keep one seeded demonstration auction open for Phase 3 testing, even in browsers
  // that saved the original seed schedule days ago. Never alter user-created auctions.
  let refreshedDemoAuction = false;
  const demoLiveAuction = auctions.find(a => a.id === 'auction-004' && a.artifactId === 'artifact-001' && a.sellerId === 'ahmed');
  if (demoLiveAuction && (!Number.isFinite(Date.parse(demoLiveAuction.start)) || !Number.isFinite(Date.parse(demoLiveAuction.end)) || Date.parse(demoLiveAuction.end) <= Date.now())) {
    demoLiveAuction.start = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    demoLiveAuction.end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    refreshedDemoAuction = true;
  }
  if (addedDefaultAuctions || repairedDemoSchedule || refreshedDemoAuction || !localStorage.getItem('alfaw_phase3_auctions')) put('auctions', auctions);
  if(!localStorage.getItem('alfaw_phase3_artifacts')) put('artifacts',artifacts);
  if(!localStorage.getItem('alfaw_phase3_sellers')) put('sellers',sellers);
  const persist=()=>{put('sellers',sellers);put('artifacts',artifacts);put('auctions',auctions);put('users',users);put('reviews',reviews);put('notices',notices)};
  const artifact=id=>artifacts.find(x=>x.id===id),auction=id=>auctions.find(x=>x.id===id),seller=id=>sellers.find(x=>x.id===id);
  // Validate session role against the persisted demo user record on every page.
  if(session){const stored=users.find(x=>x.id===session.id);
    if(!stored||stored.role!==session.role||stored.sellerId!==session.sellerId){session=null;localStorage.removeItem('alfaw_phase3_session')}}
  const account=()=>users.find(x=>x.id===session?.id);
  const currentSeller=()=>session?.role==='seller'?seller(session.sellerId):null;
  const status=a=>{if(!a.start||!a.end)return 'upcoming';const now=Date.now();return now<Date.parse(a.start)?'upcoming':now>=Date.parse(a.end)?'ended':'active'};
  const statusName=a=>({upcoming:'قادم',active:'نشط',ended:'منتهٍ'}[status(a)]);
  const highest=a=>a.bids.length?Math.max(...a.bids.map(b=>Number(b.amount))):null;
  const minimum=a=>highest(a)===null?Number(a.startingPrice)+Number(a.increment):highest(a)+Number(a.increment);
  const compareBids=(x,y)=>Number(y.amount)-Number(x.amount)||(Date.parse(x.created)||0)-(Date.parse(y.created)||0)||String(x.id||'').localeCompare(String(y.id||''));
  const rankedBids=a=>[...(a.bids||[])].sort(compareBids).filter((b,i,list)=>list.findIndex(x=>x.uid===b.uid)===i);
  const auctionWinner=a=>{if(status(a)!=='ended')return null;const top=rankedBids(a)[0];return top&&(!a.reservePrice||Number(top.amount)>=Number(a.reservePrice))?top:null;};
  // Create one local winner notification for each completed auction, regardless of the page opened.
  const syncWinnerNotices=()=>{
    const pending=auctions.filter(a=>auctionWinner(a)&&!notices.some(n=>n.auctionId===a.id&&n.kind==='won'));
    if(!pending.length)return;
    const created=pending.map(a=>({
      id:id('notice'),uid:auctionWinner(a).uid,
      body:'تهانينا، فزت بالمزاد '+a.id,
      url:'auction-detail.html?id='+encodeURIComponent(a.id),
      auctionId:a.id,kind:'won',read:false,created:new Date().toISOString()
    }));
    notices.unshift(...created);
    if(!put('notices',notices)){notices.splice(0,created.length);return}
  };
  syncWinnerNotices();
  const sellerReviews=id=>reviews.filter(r=>r.sellerId===id);
  const rating=id=>{const r=sellerReviews(id);const avg=r.length?r.reduce((s,x)=>s+Number(x.rating),0)/r.length:null;return {count:r.length,avg,trust:avg===null?null:Math.round(avg/5*100)}};
  const requireRole=(role,content,warning)=>{const ok=session?.role===role && (role!=='seller'||!!currentSeller());visible(content,ok);visible(warning,!ok);return ok};
  const notice=(uid,body,url='profile.html')=>{
    notices.unshift({id:id('notice'),uid,body,url,read:false,created:new Date().toISOString()});if(!put('notices',notices)){notices.shift();return false}if(uid===session?.id)showToast(body,url);return true
  };
  const showToast=(message,url)=>{
    const box=document.createElement('div');box.className='alfaw-toast';box.setAttribute('role','status');
    const span=document.createElement('span');span.textContent=message;box.append(span);
    if(url){const link=document.createElement('a');link.href=url;link.textContent='عرض';box.append(link)}
    const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='إغلاق';
    dismiss.setAttribute('aria-label','إغلاق الإشعار');dismiss.addEventListener('click',()=>box.remove());box.append(dismiss);
    document.body.append(box);
    let timer=setTimeout(()=>box.remove(),4500);box.addEventListener('mouseenter',()=>clearTimeout(timer));box.addEventListener('mouseleave',()=>{clearTimeout(timer);timer=setTimeout(()=>box.remove(),2500)});box.addEventListener('focusin',()=>clearTimeout(timer));box.addEventListener('focusout',()=>{clearTimeout(timer);timer=setTimeout(()=>box.remove(),2500)});
  };
  const artworkCard=a=>`<article class="seller-artifact-card"><div class="seller-artifact-image"><img loading="lazy" src="${escape(a.image)}" alt="${escape(a.name)}"><span class="alfaw-trust-badge">★ ${rating(a.sellerId).trust===null?'لا توجد تقييمات':rating(a.sellerId).trust+'%'}</span></div><div class="seller-artifact-content"><span>${escape(categories[a.category]||'')}</span><h3>${escape(a.name)}</h3><p>${escape(a.description||'')}</p><strong>${money(a.price)}</strong><p><a href="artifact-detail.html?id=${encodeURIComponent(a.id)}">تفاصيل القطعة ←</a></p></div></article>`;
  const auctionCard=a=>{const item=artifact(a.artifactId);if(!item)return '';return `<article class="auction-card"><div class="auction-card-image"><img loading="lazy" src="${escape(item.image)}" alt="${escape(item.name)}"><span class="auction-status-badge">${statusName(a)}</span><span class="alfaw-trust-badge">★ ${rating(item.sellerId).trust===null?'لا توجد تقييمات':rating(item.sellerId).trust+'%'}</span></div><div class="auction-card-content"><small>${escape(a.id)}</small><h3>${escape(item.name)}</h3><p>${escape(item.description||'')}</p><div class="auction-pricing"><div><span>السعر الابتدائي</span><strong>${money(a.startingPrice)}</strong></div><div><span>أعلى عرض</span><strong>${highest(a)===null?'لا توجد مزايدات':money(highest(a))}</strong></div></div><div class="auction-card-timing"><span>${date(a.start)}</span><span>${date(a.end)}</span></div><a class="auction-details-button" href="auction-detail.html?id=${encodeURIComponent(a.id)}">تفاصيل المزاد ←</a></div></article>`};

  // FRONT-END-ONLY SPRINT 1: Local prototype credentials are for UX testing,
  // never for real accounts or security. Passwords are not stored in plaintext.
  const fingerprint=async(pass,salt)=>{
    const input=new TextEncoder().encode(salt+':'+pass);
    if(!crypto?.subtle) throw Error('افتحي النموذج من http://localhost لتجربة الحسابات.');
    const digest=await crypto.subtle.digest('SHA-256',input);
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  };
  window.addEventListener('storage',event=>{if(event.key==='alfaw_phase3_session'&&event.newValue===null&&session){location.href='login.html'}});
  const demoIdentity=[{id:'demo-admin',name:'مسؤول العرض',email:'admin@alfaw.demo',role:'admin',pass:'AlfawDemo!2026'},
    {id:'demo-buyer',name:'مشتري تجريبي',email:'buyer@alfaw.demo',role:'buyer',pass:'AlfawDemo!2026'},
    {id:'demo-seller',name:'بائع تجريبي',email:'seller@alfaw.demo',role:'seller',sellerId:'demo-shop',pass:'AlfawDemo!2026'}];
  if(!sellers.some(x=>x.id==='demo-shop')){sellers.push({id:'demo-shop',name:'متجر العرض التجريبي',city:'الرياض',category:'other',specialty:'مقتنيات تاريخية',bio:'حساب توضيحي لمرحلة Sprint 1',joined:new Date().toISOString()});put('sellers',sellers)}
  // Ensure the built-in demo seller has an owned artifact to exercise edit/delete.
  // Do not recreate it after the seller archives it.
  if(!artifacts.some(a=>a.id==='demo-seller-artifact-001')){
    const demoItem={id:'demo-seller-artifact-001',name:'قطعة تراثية تجريبية',description:'قطعة تراثية توضيحية لتجربة إضافة القطع وتعديلها وحذفها من لوحة البائع.',price:3500,category:'pottery',period:'غير محددة',origin:'المملكة العربية السعودية',condition:'جيدة',image:'pottery.jpg',sellerId:'demo-shop',verification:'unverified',verificationReference:'',documents:[],created:new Date().toISOString(),demo:true};
    // Only seed once per browser even after deletion.
    if(localStorage.getItem('alfaw_demo_seller_artifact_seeded')!=='true'){
      const next=[...artifacts,demoItem];
      if(put('artifacts',next)){
        artifacts=next;
        localStorage.setItem('alfaw_demo_seller_artifact_seeded','true');
      }
    }
  }
  const demoSeeds=demoIdentity.filter(x=>!users.some(u=>u.email===x.email));
  if(demoSeeds.length){demoSeeds.forEach(x=>users.push({id:x.id,name:x.name,email:x.email,role:x.role,sellerId:x.sellerId||null,city:'الرياض',phone:'',joined:new Date().toISOString(),demo:true}));put('users',users)}
  // Seed hashes once; the visible UI never grants Admin registration.
  Promise.all(demoIdentity.map(async x=>{const u=users.find(z=>z.email===x.email);
    if(u&&!u.passwordHash){u.passwordSalt='alfaw-sprint1-'+x.id;u.passwordHash=await fingerprint(x.pass,u.passwordSalt)}}))
      .then(()=>put('users',users)).catch(console.warn);
  if($('.register-page')){
    const hasPasswordSymbol=value=>/[^\p{L}\p{N}\s]/u.test(value);
    const updatePasswordRules=()=>{
      const password=$('#register-password')?.value||'';
      const confirmation=$('#register-confirm-password')?.value||'';
      const setRule=(selector,met)=>{
        const element=$(selector);
        if(!element)return;
        element.dataset.met=String(met);
        element.textContent=(met?'✓ ':'○ ')+element.textContent.replace(/^[✓○]\s*/, '');
      };
      setRule('#password-rule-length',password.length>=8&&password.length<=128);
      setRule('#password-rule-symbol',hasPasswordSymbol(password));
      setRule('#password-rule-match',confirmation.length>0&&password===confirmation);
    };
    ['#register-password','#register-confirm-password'].forEach(selector=>$(selector)?.addEventListener('input',updatePasswordRules));
    updatePasswordRules();

    const update=()=>{const yes=$('input[name="accountType"]:checked')?.value==='seller';visible('#register-seller-fields',yes);['#register-store-name','#register-seller-bio'].forEach(s=>{if($(s))$(s).disabled=!yes})};
    $$('input[name="accountType"]').forEach(x=>x.addEventListener('change',update));update();
    $('#register-form')?.addEventListener('submit',async e=>{
      e.preventDefault();
      const form=$('#register-form');
      const name=$('#register-full-name')?.value.trim()||'';
      const email=$('#register-email')?.value.trim().toLowerCase()||'';
      const phone=$('#register-phone')?.value.trim()||'';
      const city=$('#register-city')?.value||'';
      const pass=$('#register-password')?.value||'';
      const confirmPass=$('#register-confirm-password')?.value||'';
      const role=$('input[name="accountType"]:checked')?.value;
      const storeName=$('#register-store-name')?.value.trim()||'';
      const error=(selector,message)=>feedback(selector,message);
      const fields=['#full-name-error','#register-email-error','#register-phone-error','#register-city-error','#register-store-name-error','#register-password-error','#register-confirm-password-error','#register-terms-error'];
      fields.forEach(selector=>error(selector,''));
      error('#register-form-message','');
      let invalid=false;
      const check=(condition,selector,message)=>{if(condition){error(selector,message);invalid=true}};
      check(name.length<2,'#full-name-error','أدخلي الاسم الكامل (حرفان على الأقل).');
      check(!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,}$/i.test(email)||email.includes('..')||email.length>254,'#register-email-error','أدخلي بريدًا إلكترونيًا صحيحًا مثل name@example.com.');
      check(!/^05[0-9]{8}$/.test(phone),'#register-phone-error','رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.');
      check(!city,'#register-city-error','اختاري المدينة.');
      check(role!=='buyer'&&role!=='seller','#register-form-message','اختاري نوع الحساب.');
      check(role==='seller'&&storeName.length<3,'#register-store-name-error','اسم البائع أو المتجر مطلوب (3 أحرف على الأقل).');
      check(pass.length<8||pass.length>128,'#register-password-error','كلمة المرور يجب أن تكون بين 8 و128 حرفًا.');
      check(!hasPasswordSymbol(pass),'#register-password-error','يجب أن تحتوي كلمة المرور على رمز خاص مثل ! أو @ أو #.');
      check(pass!==confirmPass,'#register-confirm-password-error','كلمتا المرور غير متطابقتين.');
      check(!$('#register-terms')?.checked,'#register-terms-error','يجب الموافقة على الشروط.');
      check(users.some(x=>String(x.email||'').toLowerCase()===email),'#register-email-error','هذا البريد مسجل مسبقًا.');
      if(form&&!form.checkValidity()){form.reportValidity();invalid=true}
      if(invalid){error('#register-form-message','يرجى تصحيح الحقول المحددة قبل إنشاء الحساب.');return}
      const submit=$('#register-submit-button');
      if(submit)submit.disabled=true;
      try{
        const sid=role==='seller'?id('seller'):null;
        const newUser={id:id('user'),name,email,role,sellerId:sid,city,phone,joined:new Date().toISOString()};
        newUser.passwordSalt=id('salt');
        newUser.passwordHash=await fingerprint(pass,newUser.passwordSalt);
        const newSeller=sid?{id:sid,name:storeName,city,category:'other',specialty:'مقتنيات تاريخية',bio:$('#register-seller-bio')?.value.trim()||'',joined:new Date().toISOString()}:null;
        users.push(newUser);
        if(newSeller)sellers.push(newSeller);
        // Do not report success unless both local records are saved.
        // Roll back the new records on a failed write.
        const savedUsers=put('users',users);
        const savedSeller=!newSeller||put('sellers',sellers);
        if(!savedUsers||!savedSeller){
          users.pop();
          if(newSeller)sellers.pop();
          // Best-effort rollback if one local write succeeded.
          if(savedUsers)put('users',users);
          if(newSeller&&savedSeller)put('sellers',sellers);
          throw Error('Local registration storage failed');
        }
        error('#register-form-message','تم إنشاء حسابك بنجاح.');
        const oldSuccess=$('#alfaw-registration-success');
        if(oldSuccess)oldSuccess.remove();
        const success=document.createElement('div');
        success.id='alfaw-registration-success';
        success.className='alfaw-registration-success';
        success.setAttribute('role','alertdialog');
        success.setAttribute('aria-modal','true');
        success.setAttribute('aria-labelledby','alfaw-registration-success-heading');
        const panel=document.createElement('div');
        panel.className='alfaw-registration-success-panel';
        const heading=document.createElement('h2');
        heading.id='alfaw-registration-success-heading';
        heading.textContent='تم إنشاء حسابك بنجاح ✓';
        const description=document.createElement('p');
        description.textContent='حسابك جاهز الآن. يمكنك تسجيل الدخول بالبريد الإلكتروني وكلمة المرور اللذين سجلتِ بهما.';
        const action=document.createElement('a');
        action.href='login.html?registered=1';
        action.className='alfaw-registration-success-action';
        action.textContent='الانتقال لتسجيل الدخول ←';
        panel.append(heading,description,action);
        success.append(panel);
        document.body.append(success);
        action.focus();
      }catch(err){
        error('#register-form-message','تعذر إنشاء الحساب التجريبي. حاولي مرة أخرى.');
        if(submit)submit.disabled=false;
      }
    });
  }
  if($('.login-page')||$('.admin-login-page')){
    if($('.login-page')&&params.get('registered')==='1')feedback('#login-form-message','تم إنشاء حسابك بنجاح. سجّلي الدخول بالبريد وكلمة المرور اللذين اخترتهما.');
    $('#login-form')?.addEventListener('submit',async e=>{e.preventDefault();
      const email=$('#login-email')?.value.trim().toLowerCase(),pass=$('#login-password')?.value||'';
      const u=users.find(x=>x.email===email);
      const adminPortal=!!$('.admin-login-page');
      if(u && (adminPortal ? u.role!=='admin' : u.role==='admin')){feedback('#login-form-message',adminPortal?'هذه البوابة مخصصة للمسؤولين فقط.':'حساب المسؤول يتطلب الدخول عبر بوابة الإدارة المستقلة.');return}
      if(!u||!pass||!u.passwordHash){feedback('#login-form-message','البريد الإلكتروني أو كلمة المرور غير صحيحة.');return}
      try{if(await fingerprint(pass,u.passwordSalt)!==u.passwordHash){feedback('#login-form-message','البريد الإلكتروني أو كلمة المرور غير صحيحة.');return}}
      catch(err){feedback('#login-form-message',err.message);return}
      const nextSession={id:u.id,name:u.name,role:u.role,sellerId:u.sellerId};if(!put('session',nextSession)){feedback('#login-form-message','تعذر حفظ جلسة الدخول محليًا. حاولي مرة أخرى.');return}session=nextSession;
      location.href=u.role==='seller'?'seller-dashboard.html':u.role==='admin'?'admin-dashboard.html':'profile.html';
    });
  }
  $$('.toggle-password').forEach(btn=>btn.addEventListener('click',()=>{const field=document.getElementById(btn.dataset.passwordTarget||'');if(field)field.type=field.type==='password'?'text':'password'}));


  // INTEGRATE SELLER-CREATED ARTIFACTS INTO THE PUBLIC CATALOGUE (Sprint 1 local demo).
  if ($('.browse-page') && $('#browse-grid')) {
    const grid=$('#browse-grid');
    const listed=new Set($('.browse-artifact-card',grid).map(el=>{const href=el.querySelector('a[href*="artifact-detail"]')?.href;if(!href)return null;try{return new URL(href,location.href).searchParams.get('id')}catch{return null}}).filter(Boolean));
    artifacts.filter(a=>!a.archived&&!listed.has(a.id)).forEach(a=>{
      const item=document.createElement('article');item.className='browse-artifact-card';
      Object.assign(item.dataset,{name:a.name,category:a.category,verification:a.verification,price:String(a.price),originalIndex:String(grid.querySelectorAll('.browse-artifact-card').length)});
      const ac=auctions.find(z=>z.artifactId===a.id);const current=ac?highest(ac):null;
      item.innerHTML=`<div class="browse-artifact-image"><img src="${escape(a.image||'coin.jpg')}" loading="lazy" alt="${escape(a.name)}"><span class="pending-badge">${escape(verifications[a.verification]||'غير موثق')}</span></div>
      <div class="browse-card-content"><span class="artifact-category">${escape(categories[a.category]||'')}</span><h3>${escape(a.name)}</h3><p class="artifact-description">${escape(a.description)}</p><span class="price-label">${ac?'أعلى عرض':'السعر المبدئي'}</span><strong class="artifact-price">${money(current??a.price)}</strong>
      <p class="alfaw-card-meta">${ac?'الحالة: '+statusName(ac)+' · '+(ac.end?date(ac.end):'—'):'لا يوجد مزاد نشط لهذه القطعة'}</p><div class="artifact-card-footer"><span>${escape(a.id)}</span><a class="collection-card-button" href="artifact-detail.html?id=${encodeURIComponent(a.id)}">عرض التفاصيل ←</a></div></div>`;
      grid.appendChild(item);
    });
    // Make static example cards reflect the locally saved bid and verification state.
    $$('.browse-artifact-card',grid).forEach(card=>{const link=card.querySelector('a[href*="artifact-detail"]');const key=new URL(link?.href||location.href,location.href).searchParams.get('id');const a=artifact(key);if(!a)return;if(a.archived){card.remove();return}
      Object.assign(card.dataset,{name:a.name,category:a.category,verification:a.verification,price:String(a.price)});
      const cardImage=card.querySelector('.browse-artifact-image img');
      if(cardImage){cardImage.src=a.image||'coin.jpg';cardImage.alt=a.name}
      const cardTitle=card.querySelector('.browse-card-content h3');
      if(cardTitle)cardTitle.textContent=a.name;
      const cardDescription=card.querySelector('.artifact-description');
      if(cardDescription)cardDescription.textContent=a.description||'';
      const stamp=card.querySelector('.pending-badge');if(stamp)stamp.textContent=verifications[a.verification]||'غير موثق';
      const ac=auctions.find(z=>z.artifactId===a.id);const strong=card.querySelector('.artifact-price');if(ac&&strong)strong.textContent=money(highest(ac)??a.price);
      const r=rating(a.sellerId),container=card.querySelector('.browse-card-content');if(container){
        // Sprint 1: show auction context from local demo data, without a backend.
        const priceLabel=container.querySelector('.price-label');
        if(priceLabel)priceLabel.textContent=ac?'أعلى مزايدة':'السعر المبدئي';
        let auctionInfo=container.querySelector('.alfaw-browse-auction-info');
        if(!auctionInfo){auctionInfo=document.createElement('div');auctionInfo.className='alfaw-browse-auction-info';container.querySelector('.artifact-card-footer')?.before(auctionInfo)}
        if(ac){
          const remaining=Date.parse(ac.end)-Date.now();
          const timeText=status(ac)==='ended'?'انتهى المزاد':status(ac)==='upcoming'?'لم يبدأ بعد':remaining>0?Math.floor(remaining/86400000)+' يوم، '+Math.floor(remaining%86400000/3600000)+' ساعة، '+Math.floor(remaining%3600000/60000)+' دقيقة':'انتهى المزاد';
          auctionInfo.innerHTML='<span>حالة المزاد: <strong>'+escape(statusName(ac))+'</strong></span><span>الوقت المتبقي: <strong>'+escape(timeText)+'</strong></span>';
        } else auctionInfo.innerHTML='<span>لا يوجد مزاد مرتبط بهذه القطعة حاليًا</span>';

        let trust=container.querySelector('.alfaw-trust');if(!trust){trust=document.createElement('p');trust.className='alfaw-trust';container.querySelector('.artifact-card-footer')?.before(trust)}
        trust.textContent='موثوقية البائع: '+(r.trust===null?'لا توجد تقييمات':r.trust+'%');
      }
    });
    // Refresh the active deep-linked verification filter after saved artifact states load.
    const requestedStatus = new URLSearchParams(location.search).get('verification');
    const statusSelect = document.getElementById('verification-filter');
    if (statusSelect && ['verified','pending','unverified'].includes(requestedStatus)) {
      statusSelect.value = requestedStatus;
    }
    if(typeof sortArtifacts==='function')sortArtifacts();
  }

  // NEW PUBLIC SELLER DIRECTORY — older directory uses different selectors.
  if($('.sellers-page')&&$('#seller-search-input')){
    const render=()=>{const q=$('#seller-search-input')?.value.trim().toLowerCase()||'',cat=$('#seller-category-filter')?.value||'all',sort=$('#seller-sort-filter')?.value||'name';let list=sellers.filter(s=>(s.name+' '+s.city+' '+s.specialty).toLowerCase().includes(q)&&(cat==='all'||cat===s.category));list.sort((a,b)=>sort==='artifacts-high'?artifacts.filter(x=>x.sellerId===b.id&&!x.archived).length-artifacts.filter(x=>x.sellerId===a.id&&!x.archived).length:sort==='newest'?String(b.joined).localeCompare(a.joined):sort==='trust-high'?(rating(b.id).trust??-1)-(rating(a.id).trust??-1):a.name.localeCompare(b.name,'ar'));const grid=$('#sellers-grid');if(grid)grid.innerHTML=list.map(s=>{const r=rating(s.id);return `<article class="seller-card"><div class="seller-card-cover"></div><div class="seller-card-content"><div class="seller-card-avatar">${escape(s.name[0])}</div><h3>${escape(s.name)}</h3><p>${escape(s.city)} — ${escape(s.specialty)}</p><p>${escape(s.bio)}</p><div class="seller-card-stats"><div><span>Trust Score</span><strong>${r.trust===null?'لا توجد تقييمات':r.trust+'%'}</strong></div><div><span>القطع</span><strong>${artifacts.filter(x=>x.sellerId===s.id&&!x.archived).length}</strong></div><div><span>التقييمات</span><strong>${r.count}</strong></div></div><a class="seller-profile-button" href="seller-detail.html?id=${encodeURIComponent(s.id)}">عرض ملف البائع ←</a></div></article>`}).join('');visible('#sellers-empty-state',!list.length);text('#sellers-results-count',list.length+' بائعين')};
    ['#seller-search-input','#seller-category-filter','#seller-sort-filter'].forEach(s=>$(s)?.addEventListener('input',render));$('#seller-search-form')?.addEventListener('submit',e=>{e.preventDefault();render()});$('#clear-seller-filters')?.addEventListener('click',()=>{value('#seller-search-input','');value('#seller-category-filter','all');render()});render();
  }
  if($('.seller-detail-page')&&$('#seller-detail-name')){
    if(params.has('id')&&!seller(params.get('id'))){location.replace('seller-profile.html');return}const s=seller(params.get('id'))||sellers[0];if(s){const r=rating(s.id),items=artifacts.filter(a=>a.sellerId===s.id&&!a.archived),sales=auctions.filter(a=>a.sellerId===s.id);[['#seller-detail-name',s.name],['#seller-breadcrumb-name',s.name],['#seller-detail-avatar',s.name[0]],['#seller-detail-location',s.city],['#seller-detail-specialty',s.specialty],['#seller-detail-biography',s.bio],['#seller-about-description',s.bio],['#seller-about-specialty',s.specialty],['#seller-about-city',s.city],['#seller-about-category',s.specialty],['#seller-about-joined',date(s.joined)],['#seller-detail-artifact-count',items.length],['#seller-detail-auction-count',sales.length],['#seller-detail-review-count',r.count],['#seller-detail-trust-score',r.trust===null?'لا توجد تقييمات':r.trust+'%'],['#seller-trust-percentage',r.trust===null?'—':r.trust+'%'],['#seller-average-rating',r.avg===null?'—':r.avg.toFixed(1)],['#seller-review-total',r.count+' تقييمات']].forEach(([key,v])=>text(key,v));
      if($('#seller-artifacts-grid'))$('#seller-artifacts-grid').innerHTML=items.map(artworkCard).join('');visible('#seller-artifacts-empty',!items.length);
      if($('#seller-auctions-grid'))$('#seller-auctions-grid').innerHTML=sales.map(a=>{const item=artifact(a.artifactId);return item?`<article class="seller-auction-card"><div class="seller-auction-image"><img src="${escape(item.image)}" alt="${escape(item.name)}"></div><div class="seller-auction-content"><h3>${escape(item.name)}</h3><p>حالة المزاد: ${statusName(a)} — ${money(a.startingPrice)}</p><p>${status(a)==='active'?'المزايدة متاحة الآن للمشترين المسجلين. الحد الأدنى للعرض: '+money(minimum(a)):status(a)==='upcoming'?'المزايدة لم تبدأ بعد. يبدأ المزاد: '+date(a.start):'انتهى المزاد ولا يقبل مزايدات جديدة.'}</p><a href="auction-detail.html?id=${encodeURIComponent(a.id)}">${status(a)==='active'?'عرض المزاد والمزايدة ←':'عرض تفاصيل المزاد ←'}</a></div></article>`:''}).join('');visible('#seller-auctions-empty',!sales.length);
      if($('#seller-reviews-list'))$('#seller-reviews-list').innerHTML=r.count?sellerReviews(s.id).map(re=>`<article class="seller-review-card"><strong>${escape(re.buyerName)}</strong> <span>${'★'.repeat(re.rating)}</span><p>${escape(re.comment)}</p></article>`).join(''):'<div class="seller-review-empty">لا توجد تقييمات حتى الآن.</div>';
      for(let n=1;n<=5;n++){const count=sellerReviews(s.id).filter(re=>re.rating===n).length;text('#seller-rating-count-'+n,count);const bar=$('#seller-rating-bar-'+n);if(bar)bar.style.width=r.count?(count/r.count*100)+'%':'0%'}
    }
  }
  // NEW AUCTION CATALOGUE
  if($('.auctions-page')&&$('#auctions-grid')){
    const render=()=>{const term=$('#auction-search-input')?.value.toLowerCase()||'',filter=$('#auction-status-filter')?.value||'all',sort=$('#auction-sort-filter')?.value||'';let list=auctions.filter(a=>(a.id+' '+(artifact(a.artifactId)?.name||'')).toLowerCase().includes(term)&&(filter==='all'||status(a)===filter));list.sort((a,b)=>sort==='price-low'?a.startingPrice-b.startingPrice:sort==='price-high'?b.startingPrice-a.startingPrice:sort==='newest'?String(b.created).localeCompare(a.created):(a.end?Date.parse(a.end):Infinity)-(b.end?Date.parse(b.end):Infinity));$('#auctions-grid').innerHTML=list.map(auctionCard).join('');text('#auctions-results-count',list.length+' مزادات');text('#active-auctions-count',auctions.filter(a=>status(a)==='active').length);text('#upcoming-auctions-count',auctions.filter(a=>status(a)==='upcoming').length);text('#total-auctions-count',auctions.length);visible('#auctions-empty-state',!list.length)};
    ['#auction-search-input','#auction-status-filter','#auction-sort-filter'].forEach(s=>$(s)?.addEventListener('input',render));$('#auction-search-form')?.addEventListener('submit',e=>{e.preventDefault();render()});$('#clear-auction-filters')?.addEventListener('click',()=>{value('#auction-search-input','');value('#auction-status-filter','all');render()});render();
  }
  // ARTIFACT DETAIL — dynamically update only matching new IDs.
  if($('.artifact-detail-page')){
    if(params.has('id')&&(!artifact(params.get('id'))||artifact(params.get('id')).archived)){location.replace('browse.html');return}const a=params.has('id')?artifact(params.get('id')):artifacts.find(x=>!x.archived);if(a){const s=seller(a.sellerId),aAuction=auctions.find(x=>x.artifactId===a.id);[['#artifact-breadcrumb-name',a.name],['#artifact-detail-title',a.name],['#artifact-detail-category',categories[a.category]],['#artifact-detail-summary',a.description],['#artifact-detail-price',money(a.price)],['#artifact-period',a.period],['#artifact-origin',a.origin],['#artifact-condition',a.condition],['#artifact-full-description',a.description],['#artifact-provenance-description',a.provenance],['#artifact-detail-verification-status',verifications[a.verification]],['#artifact-verification-reference',a.verificationReference||'غير متوفر'],['#artifact-seller-name',s?.name],['#artifact-seller-display-name',s?.name],['#artifact-seller-avatar',s?.name[0]],['#artifact-seller-description',s?.bio],['#artifact-seller-trust',rating(a.sellerId).trust===null?'لا توجد تقييمات':rating(a.sellerId).trust+'%']].forEach(([key,v])=>text(key,v));const image=$('#artifact-main-photo');if(image){image.src=a.image;image.alt=a.name}const sellerLink=$('#artifact-seller-profile-link');if(sellerLink&&s)sellerLink.href='seller-detail.html?id='+encodeURIComponent(s.id);const auctionLink=$('#artifact-auction-link');if(auctionLink)auctionLink.href=aAuction?'auction-detail.html?id='+encodeURIComponent(aAuction.id):'auctions.html';const documentsHost=$('#artifact-document-list');
      if(documentsHost){
        documentsHost.replaceChildren();
        if(a.documents?.length){
          const heading=document.createElement('strong');heading.textContent='المستندات المتاحة للقطعة';documentsHost.append(heading);
          a.documents.forEach(d=>{
            const link=document.createElement('a');
            if(d.storageKey){
              link.href='#';
              link.addEventListener('click',async event=>{
                event.preventDefault();
                try{
                  const db=await new Promise((resolve,reject)=>{
                    const req=indexedDB.open('alfaw-document-files',1);
                    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
                  });
                  const file=await new Promise((resolve,reject)=>{
                    const tx=db.transaction('documents','readonly');
                    const req=tx.objectStore('documents').get(d.storageKey);
                    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
                  });
                  db.close();
                  if(!file){alert('هذا المستند غير متوفر في هذا المتصفح.');return}
                  const url=URL.createObjectURL(file);
                  const download=document.createElement('a');download.href=url;download.download=d.name||'document';
                  document.body.append(download);download.click();download.remove();
                  setTimeout(()=>URL.revokeObjectURL(url),60000);
                }catch(error){alert('تعذر فتح المستند المحفوظ في هذا المتصفح.')}
              });
            }else{link.href=d.url||'#'}
            link.target='_blank';
            link.rel='noopener noreferrer';
            link.textContent=d.name;
            documentsHost.append(link);
          });
        }else{
          const empty=document.createElement('p');
          empty.textContent='لا توجد مستندات متاحة لهذه القطعة.';
          documentsHost.append(empty);
        }
      }
      }
  }
  // Bid receipts are local, informational records — not payment invoices.
  const receiptMarkup=(auctionRecord,bid)=>{
    const item=artifact(auctionRecord.artifactId);
    return '<section class="alfaw-receipt" dir="rtl"><h2>إيصال مزايدة تجريبية — ألفاو</h2>'+
      '<p>رقم المزايدة: <strong>'+escape(bid.id)+'</strong></p>'+
      '<p>المزاد: '+escape(auctionRecord.id)+'</p>'+
      '<p>القطعة: '+escape(item?.name||auctionRecord.artifactId)+'</p>'+
      '<p>اسم المزايد: '+escape(bid.bidderName||'')+'</p>'+
      '<p>مبلغ العرض: <strong>'+money(bid.amount)+'</strong></p>'+
      '<p>التاريخ: '+escape(new Date(bid.created).toLocaleString('ar-SA'))+'</p>'+
      '<p class="alfaw-receipt-note">هذا إيصال تسجيل عرض تجريبي فقط، وليس فاتورة دفع أو إثبات فوز أو شراء.</p></section>';
  };
  const showBidReceipt=(auctionRecord,bid)=>{
    const overlay=document.createElement('div');overlay.className='alfaw-receipt-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','إيصال المزايدة');
    const content=document.createElement('div');content.className='alfaw-receipt-modal';
    content.innerHTML=receiptMarkup(auctionRecord,bid);
    const buttons=document.createElement('div');buttons.className='alfaw-receipt-actions';
    const print=document.createElement('button');print.type='button';print.textContent='طباعة الإيصال';print.addEventListener('click',()=>window.print());
    const close=document.createElement('button');close.type='button';close.textContent='إغلاق';close.addEventListener('click',()=>overlay.remove());
    buttons.append(print,close);content.append(buttons);overlay.append(content);
    overlay.addEventListener('click',event=>{if(event.target===overlay)overlay.remove()});
    document.body.append(overlay);close.focus();
  };
  const makeReceiptButton=(auctionRecord,bid)=>{
    const button=document.createElement('button');button.type='button';button.className='alfaw-receipt-button';
    button.textContent='اضغط هنا لعرض الفاتورة — '+money(bid.amount);
    button.addEventListener('click',()=>showBidReceipt(auctionRecord,bid));return button;
  };
  // AUCTION DETAIL — shared local bids. A non-scheduled auction cannot be bid on.
  if($('.auction-detail-page')){
    if(params.has('id')&&(!auction(params.get('id'))||!artifact(auction(params.get('id')).artifactId)||artifact(auction(params.get('id')).artifactId).archived)){location.replace('auctions.html');return}
    const a=params.has('id')?auction(params.get('id')):auctions.find(x=>artifact(x.artifactId)&&!artifact(x.artifactId).archived);
    if(!a){location.replace('auctions.html');return}
    const render=()=>{if(!a)return;const item=artifact(a.artifactId),s=seller(a.sellerId),st=status(a),max=highest(a);if(!item)return;[['#auction-detail-title',item.name],['#auction-breadcrumb-name',item.name],['#auction-detail-reference',a.id],['#auction-detail-status',statusName(a)],['#auction-timer-status',statusName(a)],['#auction-starting-price',money(a.startingPrice)],['#auction-highest-bid',max===null?'لا توجد مزايدات':money(max)],['#auction-min-increment',money(a.increment)],['#auction-next-minimum',money(minimum(a))],['#auction-artifact-description',item.description],['#auction-artifact-category',categories[item.category]],['#auction-artifact-origin',item.origin],['#auction-artifact-verification',verifications[item.verification]],['#auction-seller-name',s?.name],['#auction-seller-avatar',s?.name[0]],['#auction-seller-description',s?.bio],['#auction-bids-count',a.bids.length+' مزايدات']].forEach(([k,v])=>text(k,v));const img=$('#auction-artifact-image');if(img){img.src=item.image;img.alt=item.name}const thumbs=$('#auction-detail-thumbnails');if(thumbs){thumbs.querySelectorAll('img').forEach(image=>{image.src=item.image;image.alt=item.name})}const link=$('#auction-artifact-details-link');if(link)link.href='artifact-detail.html?id='+encodeURIComponent(item.id);const slink=$('#auction-seller-link');if(slink&&s)slink.href='seller-detail.html?id='+encodeURIComponent(s.id);value('#bid-auction-id',a.id);const eligible=st==='active'&&session?.role==='buyer';
      const bidMessage=$('#bid-form-message');
      if(bidMessage && !bidMessage.dataset.feedbackShown){
        bidMessage.textContent=st==='upcoming'?'المزاد لم يبدأ بعد. ستتاح المزايدة في موعد البداية.':st==='ended'?'انتهى هذا المزاد ولا يقبل عروضًا جديدة.':session?.role==='buyer'?'المزاد نشط الآن. يمكنك تقديم مزايدتك.':'المزاد نشط الآن. سجّلي الدخول بحساب مشتري للمشاركة.';
      }if($('#bid-amount')){$('#bid-amount').disabled=!eligible;$('#bid-amount').min=minimum(a)}if($('#submit-bid-button'))$('#submit-bid-button').disabled=!eligible;
      if($('#auction-bid-history-body'))$('#auction-bid-history-body').innerHTML=a.bids.length?[...a.bids].sort((x,y)=>Date.parse(y.created)-Date.parse(x.created)).map(b=>`<tr><td>${escape(b.bidderName)}</td><td>${money(b.amount)}</td><td>${date(b.created)}</td><td>${Number.isFinite(Date.parse(b.created))?new Date(b.created).toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}):'—'}</td></tr>`).join(''):'<tr><td colspan="4">لا توجد مزايدات.</td></tr>';
      const ranked=rankedBids(a);if($('#auction-ranking-list'))$('#auction-ranking-list').innerHTML=ranked.length?ranked.map((b,i)=>`<div class="auction-ranking-row"${b.uid===session?.id?' aria-current="true"':''}><strong>${i+1}</strong> ${escape(b.bidderName)}${b.uid===session?.id?' (أنت)':''} — ${money(b.amount)}</div>`).join(''):'لا توجد مزايدات بعد.';
      const winner=auctionWinner(a); text('#auction-result-heading',st!=='ended'?'لم ينتهِ المزاد بعد':winner?'انتهى المزاد':'لا يوجد عرض فائز');text('#auction-result-message',winner?'أعلى عرض: '+money(winner.amount):'لا توجد نتيجة فائزة بعد.');visible('#auction-review-section',!!(winner&&winner.uid===session?.id&&!reviews.some(r=>r.auctionId===a.id&&r.uid===session.id)));return winner};
    render();
    const displayMyReceipts=()=>{
      const area=$('#auction-my-receipts');if(!area)return;
      area.replaceChildren();
      if(!session?.id)return;
      const bids=(a.bids||[]).filter(b=>b.uid===session.id);
      if(bids.length){const heading=document.createElement('p');heading.textContent='إيصالات عروضك في هذا المزاد';area.append(heading);bids.forEach(b=>area.append(makeReceiptButton(a,b)))}
    };
    displayMyReceipts();
    $('#place-bid-form')?.addEventListener('submit',e=>{e.preventDefault();if(!a||status(a)!=='active'||session?.role!=='buyer'){feedback('#bid-form-message','المزايدة متاحة للمشتري في المزاد النشط فقط.');return}const amount=Number($('#bid-amount')?.value);if(!Number.isSafeInteger(amount)||amount<=0){feedback('#bid-form-message','أدخل مبلغ مزايدة صحيحًا ضمن نطاق الأعداد الآمنة.');return}if(!Number.isSafeInteger(minimum(a))){feedback('#bid-form-message','تعذر حساب الحد الأدنى للمزايدة. يرجى مراجعة بيانات المزاد.');return}if(amount<minimum(a)){feedback('#bid-form-message','الحد الأدنى المقبول للمزايدة: '+money(minimum(a)));return}const prev=[...a.bids].sort(compareBids)[0];a.bids.push({id:id('bid'),uid:session.id,bidderName:session.name,amount,created:new Date().toISOString()});if(!put('auctions',auctions)){a.bids.pop();feedback('#bid-form-message','تعذر حفظ المزايدة محليًا. تحققي من مساحة التخزين وحاولي مجددًا.');return}if(prev?.uid&&prev.uid!==session.id)notice(prev.uid,'تم تجاوز عرضك في المزاد '+a.id,'auction-detail.html?id='+a.id);render();displayMyReceipts();$('#bid-form-message').dataset.feedbackShown='true';feedback('#bid-form-message','تم تسجيل المزايدة التجريبية في هذا المتصفح. اضغطي زر عرض الفاتورة أسفل المزايدة للاطلاع على الإيصال.');showToast('تم تسجيل عرضك: '+money(amount),'auction-detail.html?id='+a.id);value('#bid-amount','')});
    $('#auction-review-form')?.addEventListener('submit',e=>{e.preventDefault();const winner=render(),score=Number($('#auction-review-rating')?.value);if(!winner||winner.uid!==session?.id||!$('#auction-receipt-confirmed')?.checked||!Number.isInteger(score)||score<1||score>5||reviews.some(r=>r.auctionId===a.id&&r.uid===session.id)){feedback('#auction-review-message','التقييم متاح للفائز مرة واحدة بعد تأكيد الاستلام واختيار تقييم بين 1 و5.');return}reviews.push({id:id('review'),auctionId:a.id,sellerId:a.sellerId,uid:session.id,buyerName:session.name,rating:score,comment:$('#auction-review-comment')?.value||'',created:new Date().toISOString()});if(!put('reviews',reviews)){reviews.pop();feedback('#auction-review-message','تعذر حفظ التقييم محليًا. حاولي مرة أخرى.');return}render();feedback('#auction-review-message','شكرًا، تم تسجيل تقييمك التجريبي.')} );
    const timer=()=>{if(!a||!a.start||!a.end)return;
      syncWinnerNotices();
      const st=status(a);text('#auction-timer-message',st==='active'?'الوقت المتبقي حتى انتهاء المزاد.':st==='upcoming'?'الوقت المتبقي حتى بدء المزاد.':'انتهى هذا المزاد.');
      const ms=Math.max(0,Date.parse(status(a)==='upcoming'?a.start:a.end)-Date.now()),seconds=Math.floor(ms/1000);text('#auction-days',Math.floor(seconds/86400));text('#auction-hours',Math.floor(seconds%86400/3600));text('#auction-minutes',Math.floor(seconds%3600/60));text('#auction-seconds',seconds%60);if(status(a)!==timer.previous){timer.previous=status(a);render()}};timer();setInterval(timer,1000);
  }
  // PERSONAL PROFILE
  if($('.profile-page')){
    const u=account();visible('#profile-guest-state',!u);visible('#profile-authenticated-content',!!u);
    if(u){[['#profile-display-name',u.name],['#profile-avatar',u.name[0]],['#profile-display-city',u.city],['#profile-account-role',({admin:'مسؤول',seller:'بائع',buyer:'مشتري'}[u.role]||'غير محدد')],['#profile-detail-role',({admin:'مسؤول',seller:'بائع',buyer:'مشتري'}[u.role]||'غير محدد')],['#profile-joined-date',date(u.joined)],['#profile-member-id',u.id]].forEach(([k,v])=>text(k,v));[['#profile-full-name',u.name],['#profile-email',u.email],['#profile-phone',u.phone],['#profile-city',u.city]].forEach(([k,v])=>value(k,v));visible('#profile-seller-shortcut',false);
      const isSellerProfile=u.role==='seller';
      const isBuyerProfile=u.role==='buyer';
      const isAdminProfile=u.role==='admin';
      // An administrator has a personal profile, not a buyer or seller workspace.
      $$('.buyer-profile-only').forEach(el=>{el.hidden=!isBuyerProfile});
      if(isAdminProfile){
        $$('.profile-explore-auctions-button').forEach(el=>{el.textContent='فتح لوحة المسؤول ←';el.href='admin-dashboard.html'});
        $$('.profile-tab').forEach(el=>{if(el.dataset.profileTab==='auctions'||el.dataset.profileTab==='invoices'||el.dataset.profileTab==='artifacts')el.hidden=true});
      }
      if(isSellerProfile){text('#profile-reviews-tab-label','تقييمات المشترين');const explore=$('.profile-explore-auctions-button');if(explore){explore.textContent='إدارة المزادات ←';explore.href='manage-auctions.html'}}
      if(isSellerProfile)$$('[data-seller-label]').forEach(el=>{el.textContent=el.dataset.sellerLabel});
      $$('.seller-profile-only').forEach(el=>{if(el.classList.contains('profile-tab'))el.hidden=!isSellerProfile});
      $$('.buyer-profile-only').forEach(el=>{el.hidden=!isBuyerProfile});
      if(isSellerProfile){
        const owned=artifacts.filter(item=>item.sellerId===u.sellerId&&!item.archived);
        const sellerAuctions=auctions.filter(a=>a.sellerId===u.sellerId);
        const sellerReviews=reviews.filter(r=>r.sellerId===u.sellerId);
        text('#profile-auctions-count',sellerAuctions.length);
        text('#profile-bids-count',sellerAuctions.reduce((n,a)=>n+(a.bids||[]).length,0));
        text('#profile-reviews-count',sellerReviews.length);
        text('#profile-wins-count',sellerAuctions.filter(a=>status(a)==='ended'&&auctionWinner(a)).length);
        const artifactArea=$('#profile-seller-artifacts-list');
        if(artifactArea){
          artifactArea.replaceChildren();
          if(!owned.length){const empty=document.createElement('p');empty.textContent='لا توجد مقتنيات مسجلة بعد.';artifactArea.append(empty)}
          owned.forEach(item=>{
            const card=document.createElement('article');card.className='alfaw-my-auction-card';
            const img=document.createElement('img');img.className='alfaw-my-auction-image';img.alt=item.name;img.loading='lazy';img.src=item.image||'pottery.jpg';
            const details=document.createElement('div');details.className='alfaw-my-auction-details';
            const title=document.createElement('h3');title.textContent=item.name;
            const state=document.createElement('p');state.textContent='حالة التوثيق: '+(verifications[item.verification]||'غير محددة');
            const price=document.createElement('p');price.textContent='السعر: '+money(item.price);
            const links=document.createElement('div');links.className='alfaw-my-auction-actions';
            const view=document.createElement('a');view.href='artifact-detail.html?id='+encodeURIComponent(item.id);view.textContent='عرض القطعة';
            const edit=document.createElement('a');edit.href='manage-artifact.html?id='+encodeURIComponent(item.id);edit.textContent='إدارة القطعة';
            links.append(view,edit);details.append(title,state,price,links);card.append(img,details);artifactArea.append(card);
          });
        }
      }if(isBuyerProfile){const bids=auctions.flatMap(a=>a.bids.filter(b=>b.uid===u.id));text('#profile-bids-count',bids.length);text('#profile-auctions-count',auctions.filter(a=>a.bids.some(b=>b.uid===u.id)).length);text('#profile-reviews-count',reviews.filter(r=>r.uid===u.id).length);text('#profile-wins-count',auctions.filter(a=>auctionWinner(a)?.uid===u.id).length);}
      const myAuctionList=$('#profile-my-auctions-list');
      if(myAuctionList){
        myAuctionList.replaceChildren();
        const joined=isSellerProfile?auctions.filter(a=>a.sellerId===u.sellerId):isBuyerProfile?auctions.filter(a=>(a.bids||[]).some(b=>b.uid===u.id)):[];
        if(!joined.length){const empty=document.createElement('p');empty.textContent=isSellerProfile?'لم تنشئي مزادات بعد.':'لا توجد مشاركات بعد.';myAuctionList.append(empty)}
        joined.forEach(a=>{
          const own=isSellerProfile?null:a.bids.filter(b=>b.uid===u.id).sort((x,y)=>Number(y.amount)-Number(x.amount))[0];
          const item=artifact(a.artifactId);
          const card=document.createElement('article');card.className='alfaw-my-auction-card';
          const image=document.createElement('img');image.className='alfaw-my-auction-image';image.alt=item?.name||'صورة القطعة الأثرية';image.loading='lazy';image.src=item?.image||'pottery.jpg';
          const details=document.createElement('div');details.className='alfaw-my-auction-details';
          const title=document.createElement('h3');title.textContent=item?.name||a.id;
          const state=document.createElement('p');state.className='alfaw-my-auction-status';state.textContent='حالة المزاد: '+statusName(a);
          const amount=document.createElement('p');amount.className='alfaw-my-auction-amount';amount.textContent=isSellerProfile?'أعلى عرض حالي: '+(highest(a)===null?'لا توجد عروض':money(highest(a)))+' · عدد العروض: '+(a.bids||[]).length:'أعلى مبلغ زايدتِ به: '+money(own.amount);
          const actions=document.createElement('div');actions.className='alfaw-my-auction-actions';
          const view=document.createElement('a');view.href='auction-detail.html?id='+encodeURIComponent(a.id);view.textContent='عرض المزاد ←';
          actions.append(view);if(isBuyerProfile)actions.append(makeReceiptButton(a,own));
          details.append(title,state,amount,actions);card.append(image,details);myAuctionList.append(card);
        });
      }
      const invoiceArea=$('#profile-invoices-list');
      if(invoiceArea){
        invoiceArea.replaceChildren();
        const mine=auctions.flatMap(auctionRecord=>(auctionRecord.bids||[]).filter(b=>b.uid===u.id).map(b=>({auctionRecord,b})));
        mine.sort((x,y)=>Date.parse(y.b.created)-Date.parse(x.b.created));
        if(!mine.length){const empty=document.createElement('p');empty.textContent='لا توجد فواتير مزايدات تجريبية بعد.';invoiceArea.append(empty)}
        mine.forEach(({auctionRecord,b})=>invoiceArea.append(makeReceiptButton(auctionRecord,b)));
      }
      if(isSellerProfile){
        const reviewsArea=$('#profile-reviews-list');
        const mySellerReviews=reviews.filter(r=>r.sellerId===u.sellerId);
        const summary=rating(u.sellerId);
        if(reviewsArea){
          reviewsArea.replaceChildren();
          reviewsArea.classList.add('alfaw-seller-reviews-layout');
          const summaryRow=document.createElement('div');summaryRow.className='alfaw-seller-rating-stats';
          const makeStat=(title,value)=>{const card=document.createElement('div');card.className='alfaw-seller-rating-stat';const label=document.createElement('span');label.textContent=title;const number=document.createElement('strong');number.textContent=value;card.append(label,number);return card};
          summaryRow.append(makeStat('متوسط تقييم المشترين',summary.avg===null?'—':summary.avg.toFixed(1)+' / 5'),makeStat('Trust Score',summary.trust===null?'غير متاح':summary.trust+'%'),makeStat('عدد التقييمات',String(summary.count)));
          reviewsArea.append(summaryRow);
          if(!mySellerReviews.length){const empty=document.createElement('div');empty.className='alfaw-seller-reviews-empty';const mark=document.createElement('span');mark.className='alfaw-seller-reviews-empty-icon';mark.setAttribute('aria-hidden','true');mark.textContent='☆';const heading=document.createElement('h3');heading.textContent='لا توجد تقييمات بعد';const description=document.createElement('p');description.textContent='ستظهر هنا تقييمات المشترين بعد اكتمال المزادات المؤهلة للتقييم.';empty.append(mark,heading,description);reviewsArea.append(empty)}
          mySellerReviews.forEach(r=>{const card=document.createElement('article');card.className='alfaw-seller-review-card';const title=document.createElement('strong');title.textContent=(r.buyerName||'مشتري')+' — '+Number(r.rating)+'/5';const note=document.createElement('p');note.textContent=r.comment||'دون تعليق';card.append(title,note);reviewsArea.append(card)});
        }
      }
      const myNotices=notices.filter(n=>n.uid===u.id);text('#profile-unread-count',myNotices.filter(n=>!n.read).length);if($('#profile-notifications-list'))$('#profile-notifications-list').innerHTML=myNotices.map(n=>`<p>${escape(n.body)} <a href="${escape(n.url)}">عرض</a></p>`).join('')||'<p>لا توجد إشعارات.</p>';
      $('#profile-mark-all-read')?.addEventListener('click',()=>{const previous=myNotices.map(n=>n.read);myNotices.forEach(n=>n.read=true);if(!put('notices',notices)){myNotices.forEach((n,i)=>n.read=previous[i]);feedback('#profile-form-message','تعذر حفظ حالة الإشعارات. حاولي مجددًا.');return}location.reload()});
      $('#profile-edit-form')?.addEventListener('submit',e=>{
        e.preventDefault();
        const name=$('#profile-full-name')?.value.trim()||'';
        const email=$('#profile-email')?.value.trim().toLowerCase()||'';
        const phone=$('#profile-phone')?.value.trim()||'';
        const city=$('#profile-city')?.value||'';
        const validName=name.length>=3&&name.length<=100;
        const validEmail=/^[A-Z0-9.!#$%&'*+/=?^_\x60{|}~-]+@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,}$/i.test(email)&&!email.includes('..')&&email.length<=254;
        const uniqueEmail=!users.some(x=>x.id!==u.id&&String(x.email||'').toLowerCase()===email);
        if(!validName||!validEmail||!uniqueEmail||!/^05[0-9]{8}$/.test(phone)||!city){
          feedback('#profile-form-message','تحققي من الاسم (3 أحرف على الأقل) والبريد غير المكرر ورقم الجوال (05 ثم 8 أرقام) والمدينة.');
          return;
        }
        const before={name:u.name,email:u.email,phone:u.phone,city:u.city};
        const oldSessionName=session.name;
        Object.assign(u,{name,email,phone,city});
        if(!put('users',users)){
          Object.assign(u,before);
          feedback('#profile-form-message','تعذر حفظ بيانات الحساب محليًا. حاولي مجددًا.');
          return;
        }
        session.name=name;
        if(!put('session',session)){
          session.name=oldSessionName;
          Object.assign(u,before);
          const restored=put('users',users);
          feedback('#profile-form-message',restored?'تعذر تحديث الجلسة. لم يتم حفظ التعديل؛ حاولي مجددًا.':'تعذر تحديث الجلسة واستعادة بيانات الحساب السابقة. يرجى إعادة تحميل الصفحة والتحقق من بياناتك قبل المحاولة مجددًا.');
          return;
        }
        text('#profile-display-name',name);
        text('#profile-avatar',name[0]);
        text('#profile-display-city',city);
        feedback('#profile-form-message',before.email!==email?'تم حفظ التعديلات. بريد تسجيل الدخول الجديد: '+email+' — استخدمي هذا البريد مع كلمة المرور نفسها عند دخولك القادم.':'تم حفظ بيانات الحساب محليًا.');
      });
    }
    $('.profile-tab').forEach(btn=>btn.addEventListener('click',()=>{const target=btn.dataset.profileTab;$('.profile-tab').forEach(b=>b.classList.toggle('active',b===btn));$$('.profile-panel').forEach(panel=>{panel.hidden=panel.dataset.profilePanel!==target})}));
    // Sprint 1: make the overview shortcut and cancel action functional.
    $('#profile-edit-shortcut')?.addEventListener('click',()=>{
      const tab=$('.profile-tab[data-profile-tab="personal"]');tab?.click();
      $('#profile-edit-form')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      $('#profile-full-name')?.focus({preventScroll:true});
    });
    $('#profile-cancel-button')?.addEventListener('click',()=>{
      $('#profile-edit-form')?.reset();
      if(u){value('#profile-full-name',u.name||'');value('#profile-email',u.email||'');value('#profile-phone',u.phone||'');value('#profile-city',u.city||'')}
      const msg=$('#profile-form-message');if(msg){msg.textContent='تم إلغاء التعديلات غير المحفوظة.';msg.hidden=false}
    });

  }
  // Consistent sign-out for all roles, including seller and admin dashboards.
  document.querySelectorAll('[data-alfaw-logout],#profile-logout-button').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault();
      session=null;
      try {
        localStorage.removeItem('alfaw_phase3_session');
        sessionStorage.removeItem('alfaw_phase3_session');
      } catch (error) {
        console.error('Unable to clear the demo session on logout',error);
      }
      // Replace history so the previous authenticated page cannot be revisited via Back.
      window.location.replace('login.html');
    });
  });
  // A back/forward cache restore must recheck the session before showing private content.
  window.addEventListener('pageshow',event=>{
    if(event.persisted && ($('.profile-page')||$('.seller-dashboard-page')||$('.admin-dashboard-page'))){
      location.reload();
    }
  });
  // Sprint 0 bidding guide: dismiss and reopen in place.
  if($('.auctions-page')){
    const toggle=$('#alfaw-guide-toggle'),body=$('#alfaw-guide-body');
    if(location.hash==='#alfaw-guide-toggle'&&body&&toggle){body.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.textContent='إخفاء شرح الدليل';requestAnimationFrame(()=>toggle.scrollIntoView({block:'center'}));}
    toggle?.addEventListener('click',()=>{
      if(!body)return;
      const expanded=toggle.getAttribute('aria-expanded')==='true';
      body.hidden=expanded;
      toggle.setAttribute('aria-expanded',String(!expanded));
      toggle.textContent=expanded?'إظهار شرح الدليل':'إخفاء شرح الدليل';
    });
  }
  // SELLER DASHBOARD
  const drawSellerDashboard=()=>{
    if(!$('.seller-dashboard-page')||!requireRole('seller','#seller-dashboard-content','#seller-dashboard-access-message'))return;
    const s=currentSeller(),owned=artifacts.filter(a=>a.sellerId===s.id&&!a.archived),mine=auctions.filter(a=>a.sellerId===s.id),r=rating(s.id);text('#dashboard-seller-name',s.name);text('#dashboard-total-artifacts',owned.length);text('#dashboard-active-auctions',mine.filter(a=>status(a)==='active').length);text('#dashboard-completed-auctions',mine.filter(a=>status(a)==='ended').length);text('#dashboard-trust-score',r.trust===null?'لا توجد تقييمات':r.trust+'%');text('#dashboard-review-trust',r.trust===null?'—':r.trust+'%');text('#dashboard-average-rating',r.avg===null?'—':r.avg.toFixed(1));text('#dashboard-reviews-count',r.count);if($('#dashboard-public-profile-link'))$('#dashboard-public-profile-link').href='seller-detail.html?id='+s.id;
    const term=$('#dashboard-artifact-search')?.value.toLowerCase()||'',state=$('#dashboard-artifact-status-filter')?.value||'all';const artifactState=a=>{const linked=auctions.filter(x=>x.artifactId===a.id);return linked.some(x=>auctionWinner(x))?'sold':linked.some(x=>status(x)!=='ended')?'in-auction':'available'};const filtered=owned.filter(a=>a.name.toLowerCase().includes(term)&&(state==='all'||artifactState(a)===state));
    if($('#dashboard-artifacts-table-body'))$('#dashboard-artifacts-table-body').innerHTML=filtered.map(a=>`<tr><td>${escape(a.name)}</td><td>${escape(categories[a.category])}</td><td>${escape(verifications[a.verification])}</td><td>${money(a.price)}</td><td>${({sold:'مكتملة البيع','in-auction':'ضمن مزاد',available:'متاحة'})[artifactState(a)]}</td><td><a class="alfaw-seller-action-link" href="manage-artifact.html?id=${encodeURIComponent(a.id)}">تعديل</a> <button class="alfaw-seller-delete-button" type="button" aria-label="حذف ${escape(a.name)}" data-delete-artifact="${escape(a.id)}" ${auctions.some(x=>x.artifactId===a.id&&status(x)!=='ended')?'disabled title="لا يمكن حذف قطعة مرتبطة بمزاد نشط أو قادم"':''}>حذف</button></td></tr>`).join('')||'<tr><td colspan="6">لا توجد قطع مطابقة.</td></tr>';
    if($('#dashboard-auctions-table-body'))$('#dashboard-auctions-table-body').innerHTML=mine.map(a=>`<tr><td>${escape(a.id)}</td><td>${escape(artifact(a.artifactId)?.name||'')}</td><td>${money(a.startingPrice)}</td><td>${highest(a)===null?'لا توجد عروض':money(highest(a))}</td><td>${statusName(a)}</td><td><a href="auction-detail.html?id=${encodeURIComponent(a.id)}">تفاصيل</a></td></tr>`).join('')||'<tr><td colspan="6">لا توجد مزادات.</td></tr>';
    if($('#dashboard-reviews-list'))$('#dashboard-reviews-list').innerHTML=sellerReviews(s.id).map(re=>`<p>${escape(re.buyerName)} ${'★'.repeat(re.rating)} — ${escape(re.comment)}</p>`).join('')||'<p>لا توجد تقييمات حتى الآن.</p>';
  };
  if($('.seller-dashboard-page')){
    ['#dashboard-artifact-search','#dashboard-artifact-status-filter'].forEach(s=>$(s)?.addEventListener('input',drawSellerDashboard));
    const performArtifactDeletion=key=>{const row=artifact(key);if(!row||row.sellerId!==currentSeller()?.id)return;if(auctions.some(a=>a.artifactId===key&&status(a)!=='ended')){feedback('#dashboard-artifacts-message','لا يمكن حذف قطعة مرتبطة بمزاد نشط أو قادم.');return}row.archived=true;if(!put('artifacts',artifacts)){row.archived=false;feedback('#dashboard-artifacts-message','تعذر حذف القطعة محليًا.');return}feedback('#dashboard-artifacts-message','تمت إزالة القطعة من القوائم النشطة.');drawSellerDashboard()};$('#dashboard-artifacts-table-body')?.addEventListener('click',e=>{const btn=e.target.closest('[data-delete-artifact]');if(!btn)return;const key=btn.dataset.deleteArtifact;if(artifact(key)?.sellerId!==currentSeller()?.id)return;if(auctions.some(a=>a.artifactId===key&&status(a)!=='ended')){feedback('#dashboard-artifacts-message','لا يمكن حذف هذه القطعة لأنها مرتبطة بمزاد نشط أو قادم.');return}const dialog=$('#dashboard-delete-dialog');if(dialog&&typeof dialog.showModal==='function'){const description=$('#dashboard-delete-description');if(description)description.textContent='هل تريد إزالة «'+artifact(key).name+'» من القوائم النشطة؟';const ok=$('#dashboard-confirm-delete'),cancel=$('#dashboard-cancel-delete');const freshOk=ok.cloneNode(true),freshCancel=cancel.cloneNode(true);ok.replaceWith(freshOk);cancel.replaceWith(freshCancel);freshCancel.addEventListener('click',()=>dialog.close());freshOk.addEventListener('click',()=>{dialog.close();performArtifactDeletion(key)});dialog.showModal();return}if(!confirm('هل تريد إزالة هذه القطعة من القوائم النشطة؟'))return;performArtifactDeletion(key)});drawSellerDashboard();
  }
  // ADD / EDIT ARTIFACT
  if($('.manage-artifact-page')&&requireRole('seller','#manage-artifact-content','#manage-artifact-access-message')){
    const old=params.get('id')?artifact(params.get('id')):null;const unauthorized=params.has('id')&&(!old||old.archived||old.sellerId!==currentSeller().id);
    if(unauthorized){feedback('#manage-artifact-form-message','لا يمكن تعديل قطعة لا تملكها.');$('#manage-artifact-form')?.setAttribute('hidden','');}
    else{
      if(old){text('#manage-artifact-title','تعديل قطعة أثرية');[['#artifact-name',old.name],['#artifact-category',old.category],['#artifact-period',old.period],['#artifact-origin',old.origin],['#artifact-condition',old.condition],['#artifact-description',old.description],['#artifact-provenance',old.provenance],['#artifact-condition-notes',old.conditionNotes],['#artifact-starting-price',old.price],['#artifact-verification-reference',old.verificationReference]].forEach(([k,v])=>value(k,v));const radio=$(`input[name="verificationStatus"][value="${old.verification}"]`);if(radio)radio.checked=true;if($('#artifact-images'))$('#artifact-images').required=false}
      const updateVerification=()=>{const yes=$('input[name="verificationStatus"]:checked')?.value==='verified';visible('#manage-verification-reference',yes);if($('#artifact-verification-reference')){$('#artifact-verification-reference').disabled=!yes;$('#artifact-verification-reference').required=yes}};
      $$('input[name="verificationStatus"]').forEach(r=>r.addEventListener('change',updateVerification));updateVerification();
      const preview=()=>{text('#artifact-live-preview-name',$('#artifact-name')?.value||'اسم القطعة');text('#artifact-live-preview-category',categories[$('#artifact-category')?.value]||'فئة القطعة');text('#artifact-live-preview-description',$('#artifact-description')?.value||'وصف القطعة');text('#artifact-live-preview-price',money($('#artifact-starting-price')?.value));text('#artifact-live-preview-verification',verifications[$('input[name="verificationStatus"]:checked')?.value]||'غير موثق')};
      $$('#manage-artifact-form input,#manage-artifact-form select,#manage-artifact-form textarea').forEach(el=>el.addEventListener('input',preview));preview();
      // Preview selection without uploading. Restrict memory use to one thumbnail.
      const allowedImage=['image/jpeg','image/png','image/webp'];
      const allowedDoc=['application/pdf','image/jpeg','image/png','image/webp'];
      let previewURL=null;
      const fileLabel=(file)=>file.name+' ('+(file.size/1024/1024).toFixed(2)+' MB)';
      $('#artifact-images')?.addEventListener('change',e=>{
        const area=$('#artifact-images-preview');if(!area)return;
        if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null}
        area.replaceChildren();const files=[...e.target.files];
        if(!files.length)return;
        const invalid=files.filter(file=>!allowedImage.includes(file.type)||file.size>1024*1024);
        if(invalid.length){area.textContent='صيغة الصور المسموحة JPG أو PNG أو WEBP، بحد تجريبي 1 MB لكل صورة.';return}
        const first=files[0];const img=document.createElement('img');img.alt='معاينة '+first.name;previewURL=URL.createObjectURL(first);img.src=previewURL;img.onload=()=>{if(previewURL===img.src){URL.revokeObjectURL(previewURL);previewURL=null}};
        area.append(img);
        const note=document.createElement('p');note.textContent='معاينة: '+fileLabel(first)+(files.length>1?' — سيتم حفظ الصورة الأولى فقط في النسخة التجريبية.':'');area.append(note);
      });
      $('#artifact-documents')?.addEventListener('change',e=>{
        const area=$('#artifact-documents-preview');if(!area)return;area.replaceChildren();
        const files=[...e.target.files];if(!files.length)return;
        const bad=files.filter(file=>!allowedDoc.includes(file.type)||file.size>50*1024*1024);
        if(bad.length){area.textContent='المستندات المسموحة PDF أو JPG أو PNG أو WEBP، بحد أقصى 50 MB لكل ملف.';return}
        const list=document.createElement('ul');list.className='alfaw-upload-doc-list';
        files.forEach(file=>{const li=document.createElement('li');li.textContent=fileLabel(file);list.append(li)});
        area.append(list);
      });
      $('#manage-artifact-form')?.addEventListener('submit',async e=>{e.preventDefault();const name=$('#artifact-name')?.value.trim()||'',description=$('#artifact-description')?.value.trim()||'',price=Number($('#artifact-starting-price')?.value),cat=$('#artifact-category')?.value,period=$('#artifact-period')?.value.trim(),origin=$('#artifact-origin')?.value.trim(),condition=$('#artifact-condition')?.value,v=$('input[name="verificationStatus"]:checked')?.value||'unverified',ref=$('#artifact-verification-reference')?.value.trim()||'';
        if(name.length<3||description.length<20||!cat||!period||!origin||!condition||!Number.isFinite(price)||price<=0||(v==='verified'&&!ref)){feedback('#manage-artifact-form-message','يرجى إكمال الحقول المطلوبة.');return}
        const upload=$('#artifact-images')?.files[0];if(!old&&!upload){feedback('#manage-artifact-form-message','اختاري صورة للقطعة.');return}
        // Browser-local Sprint 1 preview. Avoid sending a false signal of real archival storage.
        const readAsDataURL=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
        const compress=async file=>{const src=await readAsDataURL(file);const img=new Image();img.src=src;await img.decode();
          const scale=Math.min(1,1200/img.width,900/img.height),canvas=document.createElement('canvas');
          canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
          canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
          return canvas.toDataURL('image/jpeg',.78)};
        const photoFiles=[...($('#artifact-images')?.files||[])],docFiles=[...($('#artifact-documents')?.files||[])];
        if(photoFiles.some(f=>!allowedImage.includes(f.type))||docFiles.some(f=>!['application/pdf','image/png','image/jpeg','image/webp'].includes(f.type))){feedback('#manage-artifact-form-message','الصور والمستندات يجب أن تكون بصيغة صورة أو PDF.');return}
        if(photoFiles.some(f=>f.size>1024*1024)){feedback('#manage-artifact-form-message','الحد التجريبي للصور 1 ميغابايت لكل صورة.');return}
        if(docFiles.some(f=>f.size>50*1024*1024)){feedback('#manage-artifact-form-message','الحد الأقصى للمستند الواحد 50 ميغابايت.');return}
        const data={id:old?.id||id('artifact'),name,description,price,category:cat,period,origin,condition,verification:v,verificationReference:v==='verified'?ref:'',provenance:$('#artifact-provenance')?.value.trim()||'',conditionNotes:$('#artifact-condition-notes')?.value.trim()||'',sellerId:currentSeller().id,image:old?.image||'',documents:old?.documents||[],created:old?.created||new Date().toISOString()};
        try{
          if(photoFiles.length)data.image=await compress(photoFiles[0]);
          // Store large attachments as Blob values in IndexedDB, not in localStorage.
          // Files are still local to this browser; this is not cloud storage.
          if(docFiles.length){
            const db=await new Promise((resolve,reject)=>{
              const req=indexedDB.open('alfaw-document-files',1);
              req.onupgradeneeded=()=>req.result.createObjectStore('documents');
              req.onsuccess=()=>resolve(req.result);
              req.onerror=()=>reject(req.error);
            });
            try{
              const saved=[];
              for(const file of docFiles){
                const key=id('document');
                await new Promise((resolve,reject)=>{
                  const tx=db.transaction('documents','readwrite');
                  tx.objectStore('documents').put(file,key);
                  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
                });
                saved.push({name:file.name,type:file.type,storageKey:key});
              }
              data.documents=saved;
            }finally{db.close()}
          }
          const existing=old?artifacts.findIndex(x=>x.id===old.id):-1;
          const previous=existing>=0?artifacts[existing]:null;
          if(existing>=0)artifacts[existing]=data;else artifacts.push(data);
          if(!put('artifacts',artifacts)){
            // Roll back in-memory changes if browser storage is full.
            if(existing>=0)artifacts[existing]=previous;else artifacts.pop();
            feedback('#manage-artifact-form-message','تعذر حفظ الملفات محليًا، جرّبي ملفًا أصغر.');
            return;
          }
          persist();feedback('#manage-artifact-form-message','تم حفظ بيانات القطعة والصورة للتجربة في هذا المتصفح فقط.');setTimeout(()=>location.href='seller-dashboard.html',950);
        }catch(err){feedback('#manage-artifact-form-message','تعذر قراءة الملفات المرفوعة. جرّبي صورة أصغر.');}
      });
    }
  }
  // CREATE / MANAGE AUCTIONS
  const drawManageAuctions=()=>{
    if(!$('.manage-auctions-page')||!requireRole('seller','#manage-auctions-content','#manage-auctions-access-message'))return;
    const s=currentSeller(),mine=auctions.filter(a=>a.sellerId===s.id);text('#manage-auctions-total',mine.length);['active','upcoming','ended'].forEach(k=>text('#manage-auctions-'+k,mine.filter(a=>status(a)===k).length));const select=$('#auction-artifact-select');if(select){const previous=select.value;Array.from(select.options).filter(option=>option.value).forEach(option=>option.remove());artifacts.filter(a=>a.sellerId===s.id&&!a.archived&&!auctions.some(x=>String(x.artifactId)===String(a.id))).forEach(a=>select.add(new Option(a.name,a.id)));if(Array.from(select.options).some(option=>option.value===previous))select.value=previous;else select.value=''}const term=$('#manage-auctions-search')?.value.toLowerCase()||'',filter=$('#manage-auctions-status-filter')?.value||'all',list=mine.filter(a=>(a.id+' '+(artifact(a.artifactId)?.name||'')).toLowerCase().includes(term)&&(filter==='all'||status(a)===filter));if($('#manage-auctions-table-body'))$('#manage-auctions-table-body').innerHTML=list.map(a=>`<tr><td>${escape(a.id)}</td><td>${escape(artifact(a.artifactId)?.name||'')}</td><td>${money(a.startingPrice)}</td><td>${highest(a)===null?'لا توجد عروض':money(highest(a))}</td><td>${date(a.start)}</td><td>${date(a.end)}</td><td>${statusName(a)}</td><td><a href="auction-detail.html?id=${encodeURIComponent(a.id)}">عرض</a> ${status(a)==='upcoming'&&!a.bids.length?`<button data-delete-auction="${escape(a.id)}">حذف</button>`:''}</td></tr>`).join('')||'<tr><td colspan="8">لا توجد مزادات.</td></tr>';
  };
  if($('.manage-auctions-page')){
    $('#auction-artifact-select')?.addEventListener('change',()=>{const a=artifact($('#auction-artifact-select').value);visible('#selected-auction-artifact',!!a);if(a){value('#auction-starting-price-input',a.price);text('#auction-preview-artifact',a.name);text('#selected-auction-artifact-name',a.name);text('#selected-auction-artifact-category',categories[a.category]);if($('#selected-auction-artifact-image'))$('#selected-auction-artifact-image').src=a.image}});
    [['#auction-starting-price-input','#auction-preview-starting-price',true],['#auction-min-increment-input','#auction-preview-increment',true],['#auction-start-date','#auction-preview-start',false],['#auction-end-date','#auction-preview-end',false]].forEach(([from,to,isMoney])=>$(from)?.addEventListener('input',()=>text(to,isMoney?money($(from).value):date($(from).value))));
    $('#manage-auction-form')?.addEventListener('submit',e=>{e.preventDefault();const s=currentSeller();if(!s)return;const key=$('#auction-artifact-select')?.value,a=artifact(key),start=$('#auction-start-date')?.value,end=$('#auction-end-date')?.value,startingPrice=Number($('#auction-starting-price-input')?.value),increment=Number($('#auction-min-increment-input')?.value),reserveInput=$('#auction-reserve-price-input')?.value,reservePrice=reserveInput?Number(reserveInput):null;if(!a||a.archived||a.sellerId!==s.id||auctions.some(x=>String(x.artifactId)===String(key))||!Number.isSafeInteger(startingPrice)||startingPrice<=0||!Number.isSafeInteger(increment)||increment<=0||(reservePrice!==null&&!Number.isSafeInteger(reservePrice))||!start||!end||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||Date.parse(start)<=Date.now()||Date.parse(end)<=Date.parse(start)||(reservePrice!==null&&reservePrice<startingPrice)){let message='راجِع اختيار القطعة والسعر وموعد البداية والنهاية.';if(auctions.some(x=>String(x.artifactId)===String(key)))message='هذه القطعة مرتبطة بمزاد بالفعل. لا يمكن إنشاء مزاد آخر للقطعة نفسها.';else if(!key)message='اختر قطعة أثرية أولًا.';else if(!start||!end)message='حدد تاريخ ووقت بداية المزاد ونهايته.';else if(!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end)))message='تاريخ أو وقت المزاد غير صالح.';else if(Date.parse(start)<=Date.now())message='يجب أن تكون بداية المزاد في المستقبل. اختر وقتًا لاحقًا من الوقت الحالي.';else if(Date.parse(end)<=Date.parse(start))message='يجب أن تكون نهاية المزاد بعد بدايته.';else if(!Number.isSafeInteger(startingPrice)||startingPrice<=0||!Number.isSafeInteger(increment)||increment<=0)message='أدخل سعر بداية وزيادة مزايدة صحيحين أكبر من صفر.';else if(reservePrice!==null&&(!Number.isSafeInteger(reservePrice)||reservePrice<=0))message='أدخل سعرًا احتياطيًا صحيحًا ضمن النطاق المسموح.';else if(reservePrice!==null&&reservePrice<startingPrice)message='السعر الاحتياطي يجب ألا يقل عن سعر البداية.';feedback('#manage-auction-form-message',message);return}auctions.push({id:id('auction'),artifactId:key,sellerId:s.id,startingPrice,increment,reservePrice,start,end,notes:$('#auction-notes')?.value||'',bids:[],created:new Date().toISOString()});if(!put('auctions',auctions)){auctions.pop();feedback('#manage-auction-form-message','تعذر حفظ المزاد محليًا، تأكدي من توفر مساحة التخزين وحاولي مرة أخرى.');return}feedback('#manage-auction-form-message','تم حفظ المزاد في المتصفح.');setTimeout(()=>location.reload(),700)});
    ['#manage-auctions-search','#manage-auctions-status-filter'].forEach(s=>$(s)?.addEventListener('input',drawManageAuctions));
    $('#manage-auctions-table-body')?.addEventListener('click',e=>{const btn=e.target.closest('[data-delete-auction]');if(!btn)return;const a=auction(btn.dataset.deleteAuction);if(!a||a.sellerId!==currentSeller()?.id||status(a)!=='upcoming'||a.bids.length)return;if(!confirm('هل تريد حذف المزاد؟'))return;const originalAuctions=auctions;auctions=auctions.filter(x=>x.id!==a.id);if(!put('auctions',auctions)){auctions=originalAuctions;feedback('#manage-auctions-list-message','تعذر حذف المزاد من التخزين المحلي.');return}location.reload()});drawManageAuctions();
  }
  // ADMIN MONITORING — read-only, as specified in the approved Product Backlog.
  const drawAdmin=()=>{
    if(!$('.admin-dashboard-page')||!requireRole('admin','#admin-dashboard-content','#admin-dashboard-access-message'))return;
    text('#admin-total-users',users.length);text('#admin-total-artifacts',artifacts.length);text('#admin-total-auctions',auctions.length);text('#admin-total-bids',auctions.reduce((sum,a)=>sum+a.bids.length,0));['active','upcoming','ended'].forEach(k=>text('#admin-'+k+'-auctions',auctions.filter(a=>status(a)===k).length));['verified','unverified','pending'].forEach(k=>text('#admin-'+k+'-artifacts',artifacts.filter(a=>a.verification===k).length));['buyer','seller','admin'].forEach(k=>text('#admin-'+({buyer:'buyers',seller:'sellers',admin:'admins'}[k])+'-count',users.filter(u=>u.role===k).length));
    const q=$('#admin-users-search')?.value.toLowerCase()||'',role=$('#admin-users-role-filter')?.value||'all',filteredUsers=users.filter(u=>(u.name+' '+u.email).toLowerCase().includes(q)&&(role==='all'||u.role===role));if($('#admin-users-table-body'))$('#admin-users-table-body').innerHTML=filteredUsers.map(u=>`<tr><td>${escape(u.id)}</td><td>${escape(u.name)}</td><td>${escape(u.email)}</td><td>${escape(u.role)}</td><td>${escape(u.city)}</td><td>${date(u.joined)}</td><td><button type="button" class="alfaw-admin-view" data-view-user="${escape(u.id)}">عرض</button> </td></tr>`).join('')||'<tr><td colspan="7">لا توجد نتائج.</td></tr>';
    const aq=$('#admin-artifacts-search')?.value.toLowerCase()||'',vf=$('#admin-artifacts-verification-filter')?.value||'all',filteredArtifacts=artifacts.filter(a=>(a.name+' '+a.id).toLowerCase().includes(aq)&&(vf==='all'||a.verification===vf));if($('#admin-artifacts-table-body'))$('#admin-artifacts-table-body').innerHTML=filteredArtifacts.map(a=>`<tr><td>${escape(a.id)}</td><td>${escape(a.name)}</td><td>${escape(categories[a.category])}</td><td>${escape(seller(a.sellerId)?.name||'')}</td><td>${escape(verifications[a.verification])}</td><td>${money(a.price)}</td><td><a href="artifact-detail.html?id=${encodeURIComponent(a.id)}">عرض</a></td></tr>`).join('')||'<tr><td colspan="7">لا توجد نتائج.</td></tr>';
    const z=$('#admin-auctions-search')?.value.toLowerCase()||'',f=$('#admin-auctions-status-filter')?.value||'all',filteredAuctions=auctions.filter(a=>(a.id+' '+(artifact(a.artifactId)?.name||'')).toLowerCase().includes(z)&&(f==='all'||status(a)===f));if($('#admin-auctions-table-body'))$('#admin-auctions-table-body').innerHTML=filteredAuctions.map(a=>`<tr><td>${escape(a.id)}</td><td>${escape(artifact(a.artifactId)?.name||'')}</td><td>${escape(seller(a.sellerId)?.name||'')}</td><td>${money(a.startingPrice)}</td><td>${highest(a)===null?'لا توجد عروض':money(highest(a))}</td><td>${date(a.start)}</td><td>${date(a.end)}</td><td>${statusName(a)}</td><td><a href="auction-detail.html?id=${encodeURIComponent(a.id)}">عرض</a> </td></tr>`).join('')||'<tr><td colspan="9">لا توجد نتائج.</td></tr>';
    const bq=$('#admin-bids-search')?.value.toLowerCase()||'',af=$('#admin-bids-auction-filter')?.value||'all',allBids=auctions.flatMap(a=>a.bids.map(b=>({...b,auctionId:a.id}))).filter(b=>(b.auctionId+' '+b.bidderName).toLowerCase().includes(bq)&&(af==='all'||af===b.auctionId));if($('#admin-bids-table-body'))$('#admin-bids-table-body').innerHTML=allBids.map(b=>`<tr><td>${escape(b.id)}</td><td>${escape(b.auctionId)}</td><td>${escape(artifact(auction(b.auctionId)?.artifactId)?.name||'')}</td><td>${escape(b.bidderName)}</td><td>${money(b.amount)}</td><td>${date(b.created)}</td><td><a href="auction-detail.html?id=${b.auctionId}">عرض</a></td></tr>`).join('')||'<tr><td colspan="7">لا توجد عروض.</td></tr>';
  };
  if($('.admin-dashboard-page')){
    $('#admin-users-table-body')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-view-user]');if(!btn||session?.role!=='admin')return;
      const u=users.find(z=>z.id===btn.dataset.viewUser);if(!u)return;
      let panel=$('#alfaw-admin-user-details');if(!panel){panel=document.createElement('section');panel.id='alfaw-admin-user-details';panel.className='alfaw-admin-details';
        $('#admin-users-table-body').closest('table')?.insertAdjacentElement('afterend',panel)}
      panel.replaceChildren();const heading=document.createElement('h3');heading.textContent='تفاصيل المستخدم (عرض فقط)';panel.append(heading);
      for(const [label,value] of [['الاسم',u.name],['البريد',u.email],['الدور',u.role],['المدينة',u.city],['تاريخ التسجيل',date(u.joined)]]){
        const row=document.createElement('p');row.textContent=label+': '+(value||'—');panel.append(row)}
    });
    ['#admin-users-search','#admin-users-role-filter','#admin-artifacts-search','#admin-artifacts-verification-filter','#admin-auctions-search','#admin-auctions-status-filter','#admin-bids-search','#admin-bids-auction-filter'].forEach(s=>$(s)?.addEventListener('input',drawAdmin));drawAdmin()}
})();

/* =============================================================
   ALFAW — BROWSE / DETAIL COMPATIBILITY ENHANCEMENTS
   Does not replace or register animation handlers for index.html.
============================================================= */
(() => {
  'use strict';
  // The existing browse filters, sorting and dynamic artifact detail
  // controllers remain the single source of truth in this file.
  // Mark loaded images as complete for assistive technologies.
  const pages = document.querySelector('.browse-page, .artifact-detail-page');
  if (!pages) return;
  document.querySelectorAll('.browse-artifact-image img, .artifact-main-image img')
    .forEach(img => {
      if (!img.loading) img.loading = 'lazy';
      if (!img.alt.trim()) img.alt = 'صورة مقتنى تراثي';
    });

  // Smooth anchor behavior must honor the device reduce-motion preference.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const targetId = link.getAttribute('href').slice(1);
      const target = targetId && document.getElementById(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});
      history.replaceState(null,'','#'+encodeURIComponent(targetId));
    });
  });
})();

/* =====================================================================
   SPRINT 1 CATALOGUE — one browser-local data source for all auction pages
   No database or server calls are performed in this sprint.
===================================================================== */
(() => {
  'use strict';
  const root=document.getElementById('auction-grid');
  if(!root || !document.body.classList.contains('auctions-page'))return;
  const cache=name=>{try{return JSON.parse(localStorage.getItem('alfaw_phase3_'+name)||'[]')}catch{return []}};
  const getAuctions=()=>cache('auctions');const getArtifacts=()=>cache('artifacts');
  const normalize=x=>String(x??'').toLowerCase().replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ـ/g,'').trim();
  const escape=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const currency=x=>Number(x).toLocaleString('ar-SA')+' ريال';
  const nameState=x=>x==='active'?'مباشر الآن':x==='upcoming'?'قادم':'منتهٍ';
  const getStatus=a=>!a.start||!a.end?'upcoming':Date.now()<Date.parse(a.start)?'upcoming':Date.now()>=Date.parse(a.end)?'ended':'active';
  const countdown=end=>{const sec=Math.max(0,Math.floor((Date.parse(end)-Date.now())/1000));
    if(!sec)return 'انتهى الموعد';const days=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60);
    return (days?days+' يوم و':'')+h+' ساعة و'+m+' دقيقة';};
  const date=x=>x?new Date(x).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'غير محدد';
  const allCards=[...root.querySelectorAll('.auction-card')];
  const lookupCard=card=>{const key=card.querySelector('a.auction-card-button')?.getAttribute('href')||'';return new URL(key,location.href).searchParams.get('id')};
  const base=new Map(allCards.map(card=>[lookupCard(card),card]));
  const input=document.getElementById('auction-search-input'),state=document.getElementById('auction-status-filter'),sort=document.getElementById('auction-sort-filter');
  const reset=document.getElementById('auction-reset-button');
  const count=document.getElementById('auction-count');
  function makeCard(a,item){const card=document.createElement('article');card.className='auction-card';
    card.innerHTML=`<div class="auction-card-image"><img src="${escape(item.image||'coin.jpg')}" loading="lazy" alt="${escape(item.name)}"><span class="auction-badge"></span></div><div class="auction-card-content"><span class="auction-card-category"></span><h3>${escape(item.name)}</h3><p>${escape(item.description||'')}</p><div class="auction-meta"><div><span>أعلى عرض</span><strong></strong></div><div><span class="auction-time-label">وقت المزاد</span><strong class="auction-time-value"></strong></div></div><div class="auction-card-actions"><a class="auction-card-button" href="auction-detail.html?id=${encodeURIComponent(a.id)}">عرض المزاد</a></div></div>`;
    return card;
  }
  function render(){
    const items=getArtifacts(), list=getAuctions();const q=normalize(input?.value),f=state?.value||'all',order=sort?.value||'ending-soon';
    const rows=list.map(a=>({a,item:items.find(x=>x.id===a.artifactId)})).filter(x=>x.item&&!x.item.archived);
    rows.sort((x,y)=>{
      const price=z=>z.a.bids?.length?Math.max(...z.a.bids.map(b=>Number(b.amount))):Number(z.a.startingPrice);
      if(order==='highest-bid')return price(y)-price(x);
      if(order==='lowest-bid')return price(x)-price(y);
      if(order==='name')return x.item.name.localeCompare(y.item.name,'ar');
      return (Date.parse(x.a.end)||Infinity)-(Date.parse(y.a.end)||Infinity);
    });
    let visible=0;rows.forEach(({a,item})=>{
      let card=base.get(a.id);if(!card){card=makeCard(a,item);base.set(a.id,card)}
      const st=getStatus(a),link=card.querySelector('.auction-card-button');
      Object.assign(card.dataset,{name:item.name,status:st,price:String(a.bids?.length?Math.max(...a.bids.map(b=>Number(b.amount))):a.startingPrice)});
      const badge=card.querySelector('.auction-badge');if(badge){badge.textContent=nameState(st);badge.className='auction-badge '+(st==='active'?'live':st==='upcoming'?'upcoming':'closed')}
      const code=card.querySelector('.auction-card-category');if(code)code.textContent='مزاد رقم '+a.id.toUpperCase().replace('AUCTION-','AUC-');
      const heading=card.querySelector('h3');if(heading)heading.textContent=item.name;
      const img=card.querySelector('img');if(img){img.src=item.image||'coin.jpg';img.alt=item.name}
      const summary=card.querySelector('.auction-card-content > p');if(summary)summary.textContent=item.description;
      const high=card.querySelector('.auction-meta strong');if(high)high.textContent=a.bids?.length?currency(Math.max(...a.bids.map(b=>Number(b.amount)))):'لم تبدأ المزايدات';
      const timing=card.querySelectorAll('.auction-meta strong');if(timing.length>1)timing[1].textContent=st==='ended'?date(a.end):st==='active'?countdown(a.end):date(a.start);
      const rev=cache('reviews').filter(r=>r.sellerId===a.sellerId);const trustValue=rev.length?Math.round(rev.reduce((t,r)=>t+Number(r.rating),0)/rev.length/5*100)+'%':'لا توجد تقييمات';
      const area=card.querySelector('.auction-card-content'),actions=card.querySelector('.auction-card-actions');if(area){
        let trust=area.querySelector('.alfaw-trust');if(!trust){trust=document.createElement('p');trust.className='alfaw-trust';actions?.before(trust)}
        trust.textContent='موثوقية البائع: '+trustValue;
      }
      const label=card.querySelectorAll('.auction-meta span');if(label.length>1)label[1].textContent=st==='ended'?'انتهى في':st==='active'?'الوقت المتبقي':'يبدأ في';
      if(link){link.href='auction-detail.html?id='+encodeURIComponent(a.id);link.textContent=st==='active'?'تفاصيل المزاد والمزايدة':st==='upcoming'?'استعراض التفاصيل':'عرض نتيجة المزاد'}
      const statusAlias=st==='active'?'live':st==='ended'?'closed':st;
      card.hidden=!(normalize(item.name+' '+a.id+' '+item.description).includes(q)&&(f==='all'||f===st||f===statusAlias));
      if(!card.hidden)visible++;root.appendChild(card);
    });
    for(const [id,card] of base){if(!list.some(a=>a.id===id))card.remove()}
    if(count)count.textContent=visible+' مزادات';
    let empty=document.getElementById('auction-static-empty-state');if(!empty){empty=document.createElement('p');empty.id='auction-static-empty-state';empty.className='no-artifacts';root.after(empty)}
    empty.textContent='لا توجد مزادات تطابق البحث. جرّب تعديل خيارات التصفية.';empty.hidden=visible>0;
    const t=(id,number)=>{const n=document.getElementById(id);if(n)n.textContent=String(number)};
    t('active-auctions-count',list.filter(a=>getStatus(a)==='active').length);
    t('upcoming-auctions-count',list.filter(a=>getStatus(a)==='upcoming').length);
    t('total-auctions-count',list.length);
  }
  document.getElementById('auction-search-form')?.addEventListener('submit',e=>{e.preventDefault();render()});
  input?.addEventListener('input',render);state?.addEventListener('change',render);sort?.addEventListener('change',render);
  reset?.addEventListener('click',()=>{if(input)input.value='';if(state)state.value='all';if(sort)sort.value='ending-soon';render()});
  render();setInterval(render,15000);
})();

// Header session indicator. Actual authentication and multi-user state require a backend.
(() => {
  const session=(()=>{
    try {
      const value=JSON.parse(localStorage.getItem('alfaw_phase3_session')||'null');
      const users=JSON.parse(localStorage.getItem('alfaw_phase3_users')||'[]');
      if(!value||!Array.isArray(users))return null;
      const user=users.find(u=>u.id===value.id);
      return user&&user.role===value.role&&user.sellerId===value.sellerId
        ? value : null;
    } catch { return null; }
  })();
  if(!session)return;
  document.querySelectorAll('.site-nav a[href="login.html"],.header-actions a[href="login.html"]').forEach(link=>{
    link.href='profile.html';
    link.textContent='حسابي';
  });
})();
