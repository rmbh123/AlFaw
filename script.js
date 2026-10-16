
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

    if (visible) count++;
  });

  if (artifactCount) {
    artifactCount.textContent =
      formatResultsCount(count);
  }

  if (noArtifacts) {
    noArtifacts.hidden = count !== 0;
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

  browseGrid.querySelectorAll(
    ".browse-artifact-card"
  ).forEach((card, index) => {
    card.dataset.originalIndex = index;
  });

  const params = new URLSearchParams(
    window.location.search
  );

  // Navigate from the "Verification" menu.

  if (
    verificationFilter &&
    params.get("verification") === "verified"
  ) {
    verificationFilter.value = "verified";
  }

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
        filterArtifacts();
      }
    );
  }

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      filterArtifacts
    );
  }

  if (categoryFilter) {
    categoryFilter.addEventListener(
      "change",
      filterArtifacts
    );
  }

  if (verificationFilter) {
    verificationFilter.addEventListener(
      "change",
      filterArtifacts
    );
  }

  if (priceFilter) {
    priceFilter.addEventListener(
      "change",
      filterArtifacts
    );
  }

  if (sortFilter) {
    sortFilter.addEventListener(
      "change",
      sortArtifacts
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
        }

        if (priceFilter) priceFilter.value = "all";
        if (sortFilter) sortFilter.value = "default";

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
