export function initBubblesCanvas() {
  const canvas = document.getElementById('bubbles-canvas');
  if (!canvas) return { update: () => {}, burst: () => {}, render: () => {}, setOpacity: () => {} };

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const bubbles = [];
  const isMobile = window.innerWidth <= 768;
  const MAX_AMBIENT_BUBBLES = isMobile ? 12 : 35;

  class Bubble {
    constructor(isBurst = false) {
      this.reset(isBurst);
    }

    reset(isBurst = false) {
      this.x = Math.random() * width;
      this.y = isBurst ? height * (0.4 + Math.random() * 0.4) : height + Math.random() * 50;
      this.radius = isBurst ? 2 + Math.random() * 6 : 3 + Math.random() * 8;
      this.speedY = isBurst ? -(3 + Math.random() * 5) : -(1 + Math.random() * 2);
      this.speedX = (Math.random() - 0.5) * (isBurst ? 2.5 : 0.8);
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.03 + Math.random() * 0.04;
      this.wobbleAmp = 0.8 + Math.random() * 1.2;
      this.alpha = 0.2 + Math.random() * 0.5;
    }

    update() {
      this.y += this.speedY;
      this.wobble += this.wobbleSpeed;
      this.x += Math.sin(this.wobble) * this.wobbleAmp + this.speedX;

      if (this.y < -30) {
        this.reset(false);
      }
    }

    draw(context, globalAlpha) {
      const a = this.alpha * globalAlpha;
      if (a <= 0.01) return;

      context.save();
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      const grad = context.createRadialGradient(
        this.x - this.radius * 0.3,
        this.y - this.radius * 0.3,
        this.radius * 0.1,
        this.x,
        this.y,
        this.radius
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${a * 0.9})`);
      grad.addColorStop(0.4, `rgba(161, 239, 254, ${a * 0.4})`);
      grad.addColorStop(0.9, `rgba(0, 104, 117, ${a * 0.6})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${a * 0.8})`);

      context.fillStyle = grad;
      context.fill();

      context.beginPath();
      context.arc(
        this.x - this.radius * 0.35,
        this.y - this.radius * 0.35,
        this.radius * 0.25,
        0,
        Math.PI * 2
      );
      context.fillStyle = `rgba(255, 255, 255, ${a * 0.85})`;
      context.fill();

      context.restore();
    }
  }

  // Populate initial bubbles
  for (let i = 0; i < MAX_AMBIENT_BUBBLES; i++) {
    const b = new Bubble();
    b.y = Math.random() * height;
    bubbles.push(b);
  }

  let currentOpacity = 0;
  let isActive = false;

  function burst(count = isMobile ? 15 : 35) {
    for (let i = 0; i < count; i++) {
      bubbles.push(new Bubble(true));
    }
  }

  function setOpacity(val) {
    currentOpacity = Math.max(0, Math.min(1, val));
    isActive = currentOpacity > 0.01;
    if (canvas) canvas.style.opacity = currentOpacity;
  }

  function render() {
    if (!isActive) return;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < bubbles.length; i++) {
      bubbles[i].update();
      bubbles[i].draw(ctx, currentOpacity);
    }

    if (bubbles.length > MAX_AMBIENT_BUBBLES) {
      bubbles.splice(MAX_AMBIENT_BUBBLES, 1);
    }
  }

  return {
    render,
    burst,
    setOpacity
  };
}
