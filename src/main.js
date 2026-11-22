import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initPreloader } from './modules/preloader.js';
import { initScrollSequence } from './modules/scrollSequence.js';
import { initBubblesCanvas } from './modules/bubbles.js';
import { initUnderwaterThree } from './modules/underwaterThree.js';
import { initVillasSection } from './modules/villas.js';
import { initWaterRipple } from './modules/waterRipple.js';
import { initNavbar } from './modules/navbar.js';

gsap.registerPlugin(ScrollTrigger);

// 1. Initialize Lenis Smooth Scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.5,
  infinite: false
});

// Synchronize Lenis and GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

// Subsystem visual loop
let bubblesInstance = null;
let underwaterThreeInstance = null;

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
  if (bubblesInstance) bubblesInstance.render();
  if (underwaterThreeInstance) underwaterThreeInstance.render(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// Keyboard handling to ensure user cannot skip sequence using PageDown / Space / End
window.addEventListener('keydown', (e) => {
  const seqWrapper = document.querySelector('.sequence-wrapper');
  if (!seqWrapper) return;
  const pinSpacer = seqWrapper.closest('.pin-spacer') || seqWrapper;
  const seqTop = pinSpacer.offsetTop;
  const seqHeight = pinSpacer.offsetHeight;
  const seqBottom = seqTop + seqHeight;

  if (window.scrollY < seqBottom - window.innerHeight) {
    if (e.key === 'End') {
      e.preventDefault();
      // Scroll to end of sequence gradually, not skipping
      lenis.scrollTo(seqBottom - window.innerHeight, { duration: 4 });
    } else if (e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      lenis.scrollTo(window.scrollY + window.innerHeight * 0.8, { duration: 0.8 });
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      lenis.scrollTo(Math.max(0, window.scrollY - window.innerHeight * 0.8), { duration: 0.8 });
    }
  }
});

// DOMContentLoaded lifecycle
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Adaptive Navbar (hide on scroll down, show on scroll up)
  initNavbar(lenis);

  // Initialize visual canvas systems
  bubblesInstance = initBubblesCanvas();
  underwaterThreeInstance = initUnderwaterThree();

  // Preloader preloads all video frames & background images
  await initPreloader(lenis, (loadedFrames, totalFrames) => {
    // Initialize in strict DOM order for clean ScrollTrigger pin spacing
    initScrollSequence(loadedFrames, totalFrames, bubblesInstance, underwaterThreeInstance);
    initVillasSection();
    initWaterRipple();

    // Refresh ScrollTrigger once everything is populated
    ScrollTrigger.refresh();
  });
});
