import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollSequence(loadedFrames, totalFrames, bubbles, underwaterThree, frameController) {
  const canvas = document.getElementById('sequence-canvas');
  const poster = document.getElementById('sequence-poster');
  if (!canvas || !loadedFrames) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  const container = document.querySelector('.sequence-pinned-viewport');
  const colorOverlay = document.getElementById('color-grade-overlay');
  const splashOverlay = document.getElementById('splash-flash-overlay');

  // DOM Elements for overlays
  const heroOverlay = document.getElementById('overlay-hero');
  const scrollDiveHint = document.querySelector('.scroll-dive-hint');
  const underwaterOverlay = document.getElementById('overlay-underwater');
  const experiencesTrack = document.querySelector('.experiences-track');
  const experienceCardImgs = document.querySelectorAll('.experience-card .card-img');
  const sunsetOverlay = document.getElementById('overlay-sunset');
  const timePill = document.querySelector('.sunset-time-pill');
  const sunsetHeading = document.querySelector('.sunset-heading');

  // Lightweight, zero-dependency word splitter for sunset heading
  let splitWords = [];
  if (sunsetHeading) {
    const rawText = sunsetHeading.innerText.trim();
    sunsetHeading.innerHTML = rawText
      .split(/\s+/)
      .map((w) => `<span class="word">${w}</span>`)
      .join(' ');
    splitWords = Array.from(sunsetHeading.querySelectorAll('.word'));
    gsap.set(splitWords, { opacity: 0, y: 25 });
  }

  // Canvas size management with DPR capped at 2
  let dpr = 1;
  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    needsRedraw = true;
  }

  let currentFrameIndex = -1;
  let targetFrameIndex = 0;
  let needsRedraw = true;
  let rAFScheduled = false;

  function renderFrame(index) {
    const clampedIndex = Math.max(0, Math.min(totalFrames - 1, index));
    
    // Find closest loaded frame if requested frame is still decoding
    let frameToDraw = clampedIndex;
    while (frameToDraw > 0 && !loadedFrames[frameToDraw]) {
      frameToDraw--;
    }

    const img = loadedFrames[frameToDraw];
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgW = img.width;
    const imgH = img.height;
    const imgRatio = imgW / imgH;
    const canvasRatio = cw / ch;

    let rw, rh, ox, oy;
    if (canvasRatio > imgRatio) {
      rw = cw;
      rh = cw / imgRatio;
      ox = 0;
      oy = (ch - rh) / 2;
    } else {
      rw = ch * imgRatio;
      rh = ch;
      ox = (cw - rw) / 2;
      oy = 0;
    }

    ctx.drawImage(img, ox, oy, rw, rh);
    currentFrameIndex = clampedIndex;

    // Hide initial poster once first canvas frame is drawn
    if (poster && poster.style.opacity !== '0') {
      poster.style.opacity = '0';
      poster.style.pointerEvents = 'none';
    }
  }

  function scheduleDraw(target) {
    targetFrameIndex = target;
    if (targetFrameIndex !== currentFrameIndex) {
      needsRedraw = true;
    }
    if (!rAFScheduled) {
      rAFScheduled = true;
      requestAnimationFrame(() => {
        rAFScheduled = false;
        if (needsRedraw) {
          renderFrame(targetFrameIndex);
          needsRedraw = false;
        }
      });
    }
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    scheduleDraw(currentFrameIndex >= 0 ? currentFrameIndex : 0);
  }, { passive: true });

  resizeCanvas();
  // Draw first frame immediately
  renderFrame(0);

  let hasShaken = false;

  // Horizontal track width calculation
  function getTrackDistance() {
    if (!experiencesTrack) return 0;
    const trackWidth = experiencesTrack.scrollWidth;
    const windowWidth = window.innerWidth;
    return Math.max(0, trackWidth - windowWidth + (window.innerWidth <= 768 ? 48 : 128));
  }

  // Master ScrollTrigger for the 900vh Pinned Sequence
  const sequenceTrigger = ScrollTrigger.create({
    trigger: '.sequence-wrapper',
    start: 'top top',
    end: '+=800%', // 900vh total scrub distance
    pin: true,
    anticipatePin: 1,
    scrub: 0.5,
    onUpdate: (self) => {
      const progress = self.progress;

      // 1. Scrub frames strictly via rAF on change with JIT buffering
      const targetFrame = Math.round(progress * (totalFrames - 1));
      if (frameController) {
        const isMobile = window.innerWidth <= 768;
        frameController.ensureRange(targetFrame - 3, targetFrame + (isMobile ? 12 : 25));
        if (isMobile) {
          frameController.releaseFar(targetFrame, 25);
        }
      }
      scheduleDraw(targetFrame);

      // 2. Color Grade Overlay Animation
      if (colorOverlay) {
        if (progress < 0.30) {
          colorOverlay.style.backgroundColor = 'rgba(255, 230, 200, 0.08)';
          colorOverlay.style.filter = 'contrast(1.02) saturate(1.05)';
        } else if (progress >= 0.30 && progress < 0.37) {
          const t = (progress - 0.30) / 0.07;
          colorOverlay.style.backgroundColor = `rgba(0, ${Math.round(40 + t * 40)}, ${Math.round(50 + t * 45)}, ${0.1 + t * 0.35})`;
          colorOverlay.style.filter = `contrast(${1.02 + t * 0.08}) saturate(${1.05 - t * 0.15})`;
        } else if (progress >= 0.37 && progress < 0.65) {
          colorOverlay.style.backgroundColor = 'rgba(0, 80, 95, 0.42)';
          colorOverlay.style.filter = 'contrast(1.1) saturate(0.9) hue-rotate(-5deg)';
        } else if (progress >= 0.65 && progress < 0.73) {
          const t = (progress - 0.65) / 0.08;
          colorOverlay.style.backgroundColor = `rgba(${Math.round(t * 196)}, ${Math.round(80 * (1 - t) + 67 * t * 0.4)}, ${Math.round(95 * (1 - t) + 34 * t * 0.5)}, ${0.42 - t * 0.15})`;
          colorOverlay.style.filter = `contrast(${1.1 - t * 0.05}) saturate(${0.9 + t * 0.35})`;
        } else {
          const t = (progress - 0.73) / 0.27;
          colorOverlay.style.backgroundColor = `rgba(196, 67, 34, ${0.28 + t * 0.12})`;
          colorOverlay.style.filter = `contrast(1.08) saturate(1.25) hue-rotate(5deg)`;
        }
      }

      // 3. Water Entry Effect (30 - 37%)
      if (progress >= 0.30 && progress <= 0.37) {
        const entryP = (progress - 0.30) / 0.07;
        if (splashOverlay) {
          if (entryP < 0.4) {
            splashOverlay.style.opacity = (entryP / 0.4) * 0.85;
          } else {
            splashOverlay.style.opacity = (1 - (entryP - 0.4) / 0.6) * 0.85;
          }
        }

        if (!hasShaken && entryP > 0.2) {
          hasShaken = true;
          if (container) {
            gsap.fromTo(
              container,
              { x: 0, y: 0 },
              {
                x: '+=6',
                y: '-=5',
                duration: 0.05,
                repeat: 5,
                yoyo: true,
                ease: 'power1.inOut',
                onComplete: () => {
                  gsap.set(container, { x: 0, y: 0 });
                }
              }
            );
          }
          if (bubbles) bubbles.burst(window.innerWidth <= 768 ? 25 : 50);
        }
      } else {
        if (splashOverlay) splashOverlay.style.opacity = '0';
        if (progress < 0.28 || progress > 0.40) {
          hasShaken = false;
        }
      }

      // Bubbles & Three.js underwater rendering opacity
      let underwaterAlpha = 0;
      if (progress >= 0.30 && progress < 0.37) {
        underwaterAlpha = (progress - 0.30) / 0.07;
      } else if (progress >= 0.37 && progress <= 0.65) {
        underwaterAlpha = 1;
      } else if (progress > 0.65 && progress <= 0.71) {
        underwaterAlpha = 1 - (progress - 0.65) / 0.06;
      } else {
        underwaterAlpha = 0;
      }

      if (bubbles && typeof bubbles.setOpacity === 'function') bubbles.setOpacity(underwaterAlpha);
      if (underwaterThree) underwaterThree.setOpacity(underwaterAlpha);

      // 4. Progress Marker 1: Hero (0 - 30%)
      if (heroOverlay) {
        if (progress <= 0.22) {
          heroOverlay.style.opacity = 1;
        } else if (progress <= 0.30) {
          heroOverlay.style.opacity = 1 - (progress - 0.22) / 0.08;
        } else {
          heroOverlay.style.opacity = 0;
        }
      }

      if (scrollDiveHint) {
        if (progress > 0.04) {
          scrollDiveHint.style.opacity = '0';
          scrollDiveHint.style.pointerEvents = 'none';
        } else {
          scrollDiveHint.style.opacity = '1';
        }
      }

      // 5. Progress Marker 3: Underwater Experiences (37 - 65%)
      if (underwaterOverlay) {
        if (progress < 0.36) {
          underwaterOverlay.style.opacity = 0;
          underwaterOverlay.classList.remove('active-pointer');
        } else if (progress >= 0.36 && progress < 0.40) {
          const fade = (progress - 0.36) / 0.04;
          underwaterOverlay.style.opacity = fade;
          underwaterOverlay.classList.add('active-pointer');
        } else if (progress >= 0.40 && progress <= 0.63) {
          underwaterOverlay.style.opacity = 1;
          underwaterOverlay.classList.add('active-pointer');
        } else if (progress > 0.63 && progress <= 0.68) {
          const fade = 1 - (progress - 0.63) / 0.05;
          underwaterOverlay.style.opacity = fade;
          if (fade <= 0.05) underwaterOverlay.classList.remove('active-pointer');
        } else {
          underwaterOverlay.style.opacity = 0;
          underwaterOverlay.classList.remove('active-pointer');
        }
      }

      // Horizontal Experiences Track scrubbing between 0.40 and 0.63
      if (experiencesTrack && progress >= 0.37 && progress <= 0.67) {
        const trackProgress = Math.max(0, Math.min(1, (progress - 0.40) / 0.23));
        const maxShift = getTrackDistance();
        const currentShift = trackProgress * maxShift;
        experiencesTrack.style.transform = `translate3d(${-currentShift}px, 0, 0)`;

        experienceCardImgs.forEach((img) => {
          const parallaxX = (trackProgress - 0.5) * 40;
          img.style.transform = `scale(1.12) translate3d(${parallaxX}px, 0, 0)`;
        });
      }

      // 6. Progress Marker 5: Sunset (73 - 100%)
      if (sunsetOverlay) {
        if (progress < 0.72) {
          sunsetOverlay.style.opacity = 0;
        } else if (progress >= 0.72 && progress < 0.77) {
          const fade = (progress - 0.72) / 0.05;
          sunsetOverlay.style.opacity = fade;
        } else {
          sunsetOverlay.style.opacity = 1;
        }

        // Sunset Time Counting: 04:10 PM to 06:42 PM
        if (progress >= 0.72 && timePill) {
          const t = Math.max(0, Math.min(1, (progress - 0.72) / 0.28));
          const totalMins = Math.round(970 + t * (1122 - 970));
          const h = Math.floor(totalMins / 60);
          const m = totalMins % 60;
          const displayH = String(h > 12 ? h - 12 : h).padStart(2, '0');
          const displayM = String(m).padStart(2, '0');
          timePill.textContent = `${displayH}:${displayM} PM`;
        }

        // SplitType Word by Word reveal
        if (progress >= 0.74 && splitWords.length > 0) {
          const tWords = Math.max(0, Math.min(1, (progress - 0.74) / 0.22));
          const totalWords = splitWords.length;
          splitWords.forEach((word, idx) => {
            const wordThreshold = idx / totalWords;
            if (tWords >= wordThreshold) {
              const wordProgress = Math.min(1, (tWords - wordThreshold) * totalWords);
              gsap.set(word, {
                opacity: wordProgress,
                y: (1 - wordProgress) * 25
              });
            } else {
              gsap.set(word, { opacity: 0, y: 25 });
            }
          });
        }
      }
    }
  });

  return {
    sequenceTrigger,
    renderFrame
  };
}
