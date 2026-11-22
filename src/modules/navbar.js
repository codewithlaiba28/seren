import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initNavbar(lenis) {
  const header = document.querySelector('.site-header');
  const hamburger = document.querySelector('.hamburger-btn');
  const mobileMenu = document.querySelector('.mobile-menu-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-menu-overlay .nav-link');
  const progressBar = document.getElementById('scroll-progress-bar');
  if (!header) return;

  function setNavTheme(isLight) {
    if (isLight) {
      header.classList.remove('nav--on-dark');
      header.classList.add('nav--on-light');
    } else {
      header.classList.remove('nav--on-light');
      header.classList.add('nav--on-dark');
    }
  }

  // Initial state: dark background for hero
  setNavTheme(false);

  // Hide on scroll down, show on scroll up
  let lastScrollY = 0;
  let accumulatedUp = 0;

  function handleScroll(scrollY, direction) {
    // 1. Top progress bar
    if (progressBar) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
      progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    // 2. If mobile menu is open, never hide navbar
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      header.classList.remove('nav--hidden');
      header.classList.add('nav--visible');
      return;
    }

    // 3. Always visible at the top of the page
    if (scrollY < 80) {
      header.classList.remove('nav--hidden');
      header.classList.add('nav--visible');
      accumulatedUp = 0;
      lastScrollY = scrollY;
      return;
    }

    const delta = scrollY - lastScrollY;
    if (delta > 0) {
      // Scrolling DOWN
      accumulatedUp = 0;
      if (delta > 5) {
        header.classList.add('nav--hidden');
        header.classList.remove('nav--visible');
      }
    } else {
      // Scrolling UP
      accumulatedUp += Math.abs(delta);
      if (accumulatedUp > 8 || direction === -1) {
        header.classList.remove('nav--hidden');
        header.classList.add('nav--visible');
      }
    }

    lastScrollY = scrollY;
  }

  if (lenis) {
    lenis.on('scroll', ({ scroll, direction }) => {
      handleScroll(scroll, direction);
    });
  } else {
    window.addEventListener('scroll', () => {
      const scroll = window.scrollY;
      const dir = scroll > lastScrollY ? 1 : -1;
      handleScroll(scroll, dir);
    }, { passive: true });
  }

  // Adaptive theme trigger when entering Villas section
  ScrollTrigger.create({
    trigger: '#villas-section',
    start: 'top 80px',
    end: 'bottom 80px',
    onEnter: () => setNavTheme(true),
    onLeave: () => setNavTheme(false),
    onEnterBack: () => setNavTheme(true),
    onLeaveBack: () => setNavTheme(false)
  });

  // Mobile Hamburger Toggle
  if (hamburger && mobileMenu) {
    let isOpen = false;

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen = !isOpen;
      if (isOpen) {
        mobileMenu.classList.add('active');
        header.classList.remove('nav--hidden');
        header.classList.add('nav--visible');
        document.body.style.overflow = 'hidden';
        gsap.fromTo(
          mobileLinks,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.1 }
        );
      } else {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        isOpen = false;
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Active nav link tracking
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = [
    { el: document.querySelector('.sequence-wrapper'), id: 'escape' },
    { el: document.getElementById('villas-section'), id: 'villas' },
    { el: document.getElementById('booking-section'), id: 'booking' }
  ];

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 120;
    sections.forEach(({ el, id }) => {
      if (!el) return;
      const top = el.offsetTop;
      const height = el.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((l) => {
          if (l.getAttribute('data-path') === id) {
            l.classList.add('active');
          } else {
            l.classList.remove('active');
          }
        });
      }
    });
  }, { passive: true });
}
