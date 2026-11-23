import gsap from 'gsap';

export async function initPreloader(lenis, onInitialReady) {
  const isMobile = window.innerWidth <= 768;
  const totalFrames = isMobile ? 120 : 360;
  const frameDir = isMobile ? '/frames-mobile' : '/frames';

  const progressBar = document.querySelector('.preloader-progress-bar');
  const percentText = document.querySelector('.preloader-percent');
  const preloaderEl = document.getElementById('preloader');

  // Lock scroll only during critical initial batch loading
  if (lenis) {
    lenis.stop();
  }
  document.body.style.overflow = 'hidden';

  const loadedFrames = new Array(totalFrames);
  const pendingFetches = new Map();

  // Helper to decode frame via off-thread createImageBitmap
  function loadFrame(index) {
    if (index < 0 || index >= totalFrames) return Promise.resolve(null);
    if (loadedFrames[index]) return Promise.resolve(loadedFrames[index]);
    if (pendingFetches.has(index)) return pendingFetches.get(index);

    const frameNum = String(index + 1).padStart(4, '0');
    const src = `${frameDir}/frame_${frameNum}.webp`;

    const promise = (async () => {
      try {
        if ('createImageBitmap' in window) {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const bitmap = await createImageBitmap(blob);
          loadedFrames[index] = bitmap;
          pendingFetches.delete(index);
          return bitmap;
        }
      } catch (e) {
        // Fallback to Image
      }

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedFrames[index] = img;
          pendingFetches.delete(index);
          resolve(img);
        };
        img.onerror = () => {
          pendingFetches.delete(index);
          resolve(null);
        };
        img.src = src;
      });
    })();

    pendingFetches.set(index, promise);
    return promise;
  }

  // 1. Critical Initial Batch: 1 frame for instant Hero & LCP
  const INITIAL_BATCH = isMobile ? 1 : 2;
  const initialPromises = [];
  for (let i = 0; i < INITIAL_BATCH && i < totalFrames; i++) {
    initialPromises.push(
      loadFrame(i).then(() => {
        const pct = Math.min(100, Math.round(((i + 1) / INITIAL_BATCH) * 100));
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (percentText) percentText.textContent = `${pct}%`;
        if (preloaderEl) preloaderEl.setAttribute('aria-valuenow', pct);
      })
    );
  }

  await Promise.all(initialPromises);

  // Initial batch ready! Dismiss preloader immediately
  if (progressBar) progressBar.style.width = '100%';
  if (percentText) percentText.textContent = '100%';
  if (preloaderEl) {
    preloaderEl.classList.add('loaded');
    preloaderEl.setAttribute('aria-valuenow', '100');
  }

  document.body.style.overflow = '';
  if (lenis) {
    lenis.start();
  }

  // Hero entrance animation
  gsap.fromTo(
    ['.hero-eyebrow', '.hero-title', '.scroll-dive-hint'],
    { opacity: 0, y: 25 },
    {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.05
    }
  );

  // Frame controller providing JIT buffering, memory management, and idle loading
  const frameController = {
    loadFrame,
    ensureRange(start, end) {
      const s = Math.max(0, start);
      const e = Math.min(totalFrames - 1, end);
      for (let i = s; i <= e; i++) {
        if (!loadedFrames[i] && !pendingFetches.has(i)) {
          loadFrame(i);
        }
      }
    },
    releaseFar(currentIndex, maxDistance = 25) {
      if (!isMobile) return;
      for (let i = 0; i < totalFrames; i++) {
        if (loadedFrames[i] && Math.abs(i - currentIndex) > maxDistance) {
          if (typeof loadedFrames[i].close === 'function') {
            try {
              loadedFrames[i].close();
            } catch (e) {}
          }
          loadedFrames[i] = null;
        }
      }
    }
  };

  // Notify sequence controller that initial batch is ready
  if (onInitialReady) {
    onInitialReady(loadedFrames, totalFrames, frameController);
  }

  // 2. Idle Background Loading: only starts on first user scroll/interaction OR after 3.5s quiet window
  let backgroundStarted = false;
  function startBackgroundLoader() {
    if (backgroundStarted) return;
    backgroundStarted = true;

    // Clean up interaction triggers
    window.removeEventListener('scroll', startBackgroundLoader);
    window.removeEventListener('wheel', startBackgroundLoader);
    window.removeEventListener('touchstart', startBackgroundLoader);
    window.removeEventListener('keydown', startBackgroundLoader);

    let nextIdleIdx = INITIAL_BATCH;

    function processIdle(deadline) {
      // Decode only when the browser has genuine spare idle time (> 10ms)
      while (deadline.timeRemaining() > 10 && nextIdleIdx < totalFrames) {
        if (!loadedFrames[nextIdleIdx] && !pendingFetches.has(nextIdleIdx)) {
          loadFrame(nextIdleIdx);
          nextIdleIdx++;
          break; // Fetch 1 frame per slice to avoid network congestion
        }
        nextIdleIdx++;
      }

      if (nextIdleIdx < totalFrames) {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(processIdle);
        } else {
          setTimeout(processIdle, 50);
        }
      }
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(processIdle);
    } else {
      setTimeout(processIdle, 50);
    }
  }

  window.addEventListener('scroll', startBackgroundLoader, { once: true, passive: true });
  window.addEventListener('wheel', startBackgroundLoader, { once: true, passive: true });
  window.addEventListener('touchstart', startBackgroundLoader, { once: true, passive: true });
  window.addEventListener('keydown', startBackgroundLoader, { once: true, passive: true });
  window.addEventListener('pointerdown', startBackgroundLoader, { once: true, passive: true });
  setTimeout(startBackgroundLoader, 8000);

  return { loadedFrames, totalFrames, frameController };
}
