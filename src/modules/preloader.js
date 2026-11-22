import gsap from 'gsap';

export async function initPreloader(lenis, onComplete) {
  const isMobile = window.innerWidth <= 768;
  const totalFrames = isMobile ? 120 : 360;
  const frameDir = isMobile ? '/frames-mobile' : '/frames';

  const progressBar = document.querySelector('.preloader-progress-bar');
  const percentText = document.querySelector('.preloader-percent');
  const preloaderEl = document.getElementById('preloader');

  // Lock scroll during preloading
  if (lenis) {
    lenis.stop();
  }
  document.body.style.overflow = 'hidden';

  const loadedImages = new Array(totalFrames);
  let loadedCount = 0;

  function updateProgress() {
    loadedCount++;
    const percent = Math.min(100, Math.round((loadedCount / totalFrames) * 100));
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (percentText) percentText.textContent = `${percent}%`;
  }

  // Load first frame immediately
  await new Promise((resolve) => {
    const img0 = new Image();
    img0.onload = () => {
      loadedImages[0] = img0;
      updateProgress();
      resolve(img0);
    };
    img0.onerror = () => {
      updateProgress();
      resolve(null);
    };
    img0.src = `${frameDir}/frame_0001.webp`;
  });

  // Preload remaining frames in batches of 40 for optimal browser connection saturation
  const batchSize = 40;
  for (let i = 2; i <= totalFrames; i += batchSize) {
    const batchPromises = [];
    for (let j = i; j < i + batchSize && j <= totalFrames; j++) {
      const frameNum = String(j).padStart(4, '0');
      const src = `${frameDir}/frame_${frameNum}.webp`;

      const p = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedImages[j - 1] = img;
          updateProgress();
          resolve(img);
        };
        img.onerror = () => {
          updateProgress();
          resolve(null);
        };
        img.src = src;
      });
      batchPromises.push(p);
    }
    await Promise.all(batchPromises);
  }

  // Preload background images concurrently
  const criticalImages = [
    '/images/coral-reef.jpg',
    '/images/night-diving.jpg',
    '/images/ocean-spa.jpg',
    '/images/sea-dining.jpg',
    '/images/overwater-villa.jpg',
    '/images/beach-villa.jpg',
    '/images/cliff-villa.jpg',
    '/images/sunset-bg.jpg'
  ];

  await Promise.all(
    criticalImages.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    })
  );

  // Preload complete!
  if (progressBar) progressBar.style.width = '100%';
  if (percentText) percentText.textContent = '100%';

  if (preloaderEl) {
    preloaderEl.classList.add('loaded');
  }
  document.body.style.overflow = '';
  if (lenis) {
    lenis.start();
  }

  // Hero entrance animation
  gsap.fromTo(
    ['.hero-eyebrow', '.hero-title', '.scroll-dive-hint'],
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 1.0,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.1
    }
  );

  if (onComplete) {
    onComplete(loadedImages, totalFrames);
  }

  return { loadedImages, totalFrames };
}
