import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

export function initScrollSequence(loadedFrames, totalFrames, bubbles, underwaterThree) {
  const canvas = document.getElementById('sequence-canvas');
  if (!canvas || !loadedFrames || loadedFrames.length === 0) return;

  const ctx = canvas.getContext('2d');
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

  // SplitType on sunset heading
  let splitWords = [];
  if (sunsetHeading) {
    const split = new SplitType(sunsetHeading, { types: 'words' });
    splitWords = split.words || [];
    // Set initial word state
    gsap.set(splitWords, { opacity: 0, y: 30 });
  }

  // Canvas size management
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    renderFrame(currentFrameIndex);
  }

  let currentFrameIndex = 0;
  function renderFrame(index) {
    currentFrameIndex = Math.max(0, Math.min(totalFrames - 1, index));
    const img = loadedFrames[currentFrameIndex];
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgRatio = img.width / img.height;
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

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, ox, oy, rw, rh);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Initial render first frame
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

      // 1. Scrub frames based on scroll progress
      const targetFrame = Math.round(progress * (totalFrames - 1));
      renderFrame(targetFrame);

      // 2. Color Grade Overlay Animation
      // 0 - 30%: bright and warm
      // 30 - 37%: transition to deep teal
      // 37 - 65%: deep teal
      // 65 - 73%: transition to sunset
      // 73 - 100%: orange-pink sunset
      if (colorOverlay) {
        if (progress < 0.30) {
          // Warm golden daylight tint
          colorOverlay.style.backgroundColor = 'rgba(255, 230, 200, 0.08)';
          colorOverlay.style.filter = 'contrast(1.02) saturate(1.05)';
        } else if (progress >= 0.30 && progress < 0.37) {
          // Blend into deep teal
          const t = (progress - 0.30) / 0.07;
          colorOverlay.style.backgroundColor = `rgba(0, ${Math.round(40 + t * 40)}, ${Math.round(50 + t * 45)}, ${0.1 + t * 0.35})`;
          colorOverlay.style.filter = `contrast(${1.02 + t * 0.08}) saturate(${1.05 - t * 0.15})`;
        } else if (progress >= 0.37 && progress < 0.65) {
          // Underwater deep teal
          colorOverlay.style.backgroundColor = 'rgba(0, 80, 95, 0.42)';
          colorOverlay.style.filter = 'contrast(1.1) saturate(0.9) hue-rotate(-5deg)';
        } else if (progress >= 0.65 && progress < 0.73) {
          // Transition from teal to sunset
          const t = (progress - 0.65) / 0.08;
          colorOverlay.style.backgroundColor = `rgba(${Math.round(t * 219)}, ${Math.round(80 * (1 - t) + 95 * t * 0.4)}, ${Math.round(95 * (1 - t) + 64 * t * 0.5)}, ${0.42 - t * 0.15})`;
          colorOverlay.style.filter = `contrast(${1.1 - t * 0.05}) saturate(${0.9 + t * 0.35})`;
        } else {
          // Sunset: orange-pink glow
          const t = (progress - 0.73) / 0.27;
          colorOverlay.style.backgroundColor = `rgba(219, 95, 64, ${0.28 + t * 0.12})`;
          colorOverlay.style.filter = `contrast(1.08) saturate(1.25) hue-rotate(5deg)`;
        }
      }

      // 3. Water Entry Effect (30 - 37%)
      if (progress >= 0.30 && progress <= 0.37) {
        const entryP = (progress - 0.30) / 0.07;
        // White flash peaks at ~0.33, then rapidly fades
        if (splashOverlay) {
          if (entryP < 0.4) {
            splashOverlay.style.opacity = (entryP / 0.4) * 0.85;
          } else {
            splashOverlay.style.opacity = (1 - (entryP - 0.4) / 0.6) * 0.85;
          }
        }

        // Camera shake trigger
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
          if (bubbles) bubbles.burst(window.innerWidth <= 768 ? 30 : 60);
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

      const bubblesCanvas = document.getElementById('bubbles-canvas');
      if (bubblesCanvas) bubblesCanvas.style.opacity = underwaterAlpha;
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

      // "Scroll to dive" hint fades out after first scroll
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

        // Image Parallax within cards
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
          // 04:10 PM = 970 mins, 06:42 PM = 1122 mins
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
