import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initVillasSection() {
  const section = document.getElementById('villas-section');
  const cards = document.querySelectorAll('.villa-card-3d');
  if (!section || cards.length === 0) return;

  // Set initial active state
  function setActiveCard(activeIndex) {
    cards.forEach((card, idx) => {
      if (idx === activeIndex) {
        card.classList.add('active');
        card.classList.remove('dimmed');
      } else {
        card.classList.remove('active');
        card.classList.add('dimmed');
      }
    });
  }

  setActiveCard(0);

  // Pin the villas section and scrub card focus
  ScrollTrigger.create({
    trigger: '#villas-section',
    start: 'top top',
    end: '+=200%', // 300vh total height
    pin: true,
    anticipatePin: 1,
    scrub: 0.5,
    onUpdate: (self) => {
      const p = self.progress;
      let activeIdx = 0;
      if (p < 0.38) {
        activeIdx = 0;
      } else if (p < 0.72) {
        activeIdx = 1;
      } else {
        activeIdx = 2;
      }
      setActiveCard(activeIdx);

      // Subtle 3D tilt with scroll
      if (window.innerWidth > 1024) {
        cards.forEach((card, idx) => {
          const offset = idx - (p * 2);
          const rotY = offset * 5;
          gsap.to(card, {
            rotationY: rotY,
            overwrite: 'auto',
            duration: 0.2
          });
        });
      }
    }
  });

  // Mouse tilt interaction on desktop
  if (window.innerWidth > 1024) {
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        gsap.to(card, {
          rotationY: x * 14,
          rotationX: -y * 14,
          transformPerspective: 1200,
          duration: 0.3,
          ease: 'power1.out',
          overwrite: 'auto'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotationY: 0,
          rotationX: 0,
          duration: 0.6,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
    });
  }

  // Reserve button interaction: smooth scroll to booking section
  const reserveButtons = document.querySelectorAll('.villa-reserve-btn');
  reserveButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const bookingSection = document.getElementById('booking-section');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}
