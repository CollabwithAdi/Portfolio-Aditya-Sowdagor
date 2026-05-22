const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.querySelectorAll('.nav__link');
const header = document.getElementById('header');
const footerYear = document.getElementById('footer-year');
const sections = document.querySelectorAll('section[id]');
const revealElements = document.querySelectorAll('.reveal');
const achievementFilters = document.querySelectorAll('.achievement-filter');
const achievementCards = document.querySelectorAll('.achievement-card');
const achievementSlider = document.querySelector('.achievement-slider');
const achievementPrev = document.querySelector('.achievement-prev');
const achievementNext = document.querySelector('.achievement-next');
const sectionStates = new Map();

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('show-menu');
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navMenu?.classList.remove('show-menu');
  });
});

function handleScrollHeader() {
  if (!header) {
    return;
  }

  header.classList.toggle('scroll-header', window.scrollY >= 50);
}

function setActiveLink() {
  // determine which section is nearest to the viewport center
  const viewportMiddle = window.innerHeight / 2;
  let closest = { section: null, distance: Infinity };

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionMiddle = rect.top + rect.height / 2;
    const distance = Math.abs(sectionMiddle - viewportMiddle);
    if (distance < closest.distance) {
      closest = { section, distance };
    }
  });

  if (closest.section) {
    const id = closest.section.getAttribute('id');
    navLinks.forEach((link) => link.classList.remove('active-link'));
    const matching = document.querySelector(`.nav__link[href*="#${id}"]`) || document.querySelector(`.nav__link[href*=${id}]`);
    matching?.classList.add('active-link');
  }
}

// Copy email button removed from markup; no longer needed.

if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}

achievementFilters.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    achievementFilters.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');

    achievementCards.forEach((card) => {
      const categories = card.dataset.category || '';
      const shouldShow = filter === 'all' || categories.includes(filter);

      card.classList.toggle('is-hidden', !shouldShow);
    });
  });
});

if (achievementSlider) {
  const maxScrollLeft = () => achievementSlider.scrollWidth - achievementSlider.clientWidth;
  const scrollSpeed = 32; // pixels per second for continuous motion
  let rafId = null;
  let lastTimestamp = null;

  const step = (timestamp) => {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const delta = Math.min(timestamp - lastTimestamp, 32);
    lastTimestamp = timestamp;
    const max = maxScrollLeft();

    if (max > 0) {
      let next = achievementSlider.scrollLeft + (scrollSpeed * delta) / 1000;
      if (next >= max) {
        next -= max;
      }
      achievementSlider.scrollLeft = next;
    }

    rafId = window.requestAnimationFrame(step);
  };

  rafId = window.requestAnimationFrame(step);

  // Allow manual drag without pausing auto motion
  let isDown = false;
  let startX;
  let scrollLeft;

  achievementSlider.addEventListener('pointerdown', (e) => {
    isDown = true;
    achievementSlider.classList.add('is-dragging');
    startX = e.pageX - achievementSlider.offsetLeft;
    scrollLeft = achievementSlider.scrollLeft;
  });

  achievementSlider.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const x = e.pageX - achievementSlider.offsetLeft;
    const walk = (x - startX) * 1; //scroll-fast
    achievementSlider.scrollLeft = scrollLeft - walk;
  });

  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => {
    achievementSlider.addEventListener(ev, () => {
      isDown = false;
      achievementSlider.classList.remove('is-dragging');
    });
  });

  startAutoSlide();
}

if ('IntersectionObserver' in window) {
  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 6, 5) * 90}ms`;
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      // update sectionStates only for sections that are actually intersecting
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          sectionStates.set(entry.target.id, entry.intersectionRatio);
        } else {
          // remove entries that are no longer visible
          sectionStates.delete(entry.target.id);
          entry.target.classList.remove('is-active-section');
        }
      });

      // pick the section with the largest intersectionRatio among visible sections
      let best = { id: null, ratio: 0 };
      for (const [id, ratio] of sectionStates.entries()) {
        if (ratio > best.ratio) {
          best = { id, ratio };
        }
      }

      if (best.id) {
        const activeSection = document.getElementById(best.id);
        // clear any previous active-section flags
        document.querySelectorAll('.is-active-section').forEach((el) => el.classList.remove('is-active-section'));
        activeSection?.classList.add('is-active-section');

        // update navbar active link
        navLinks.forEach((link) => link.classList.remove('active-link'));
        const matching = document.querySelector(`.nav__link[href*="#${best.id}"]`) || document.querySelector(`.nav__link[href*=${best.id}]`);
        matching?.classList.add('active-link');
      }
    },
    { threshold: [0.25, 0.5, 0.75, 1], rootMargin: '-10% 0px -40% 0px' }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observerInstance.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

window.addEventListener('scroll', handleScrollHeader);
window.addEventListener('load', () => {
  handleScrollHeader();
  // call the fallback once on load to set an initial state
  setActiveLink();
});
