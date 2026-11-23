import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initWaterRipple() {
  const container = document.getElementById('booking-section');
  const canvas = document.getElementById('booking-ripple-canvas');
  if (!container || !canvas) return;

  // Mask reveal for "Book your tide."
  const maskInner = document.querySelector('.booking-title .mask-line-inner');
  if (maskInner) {
    ScrollTrigger.create({
      trigger: '#booking-section',
      start: 'top 80%',
      onEnter: () => {
        gsap.to(maskInner, {
          y: '0%',
          opacity: 1,
          duration: 1.0,
          ease: 'power3.out'
        });
      }
    });
  }

  // Mobile optimization: disable WebGL water ripple for performance
  if (
    window.innerWidth <= 768 ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  ) {
    canvas.style.display = 'none';
    const bgContainer = document.querySelector('.booking-ripple-canvas-container');
    if (bgContainer) {
      bgContainer.style.backgroundImage = 'url(/images/sunset-bg.webp)';
      bgContainer.style.backgroundSize = 'cover';
      bgContainer.style.backgroundPosition = 'center';
      bgContainer.style.opacity = '0.35';
    }
    return;
  }

  // On desktop, lazy load Three.js ripple shader only when booking section is near viewport
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      observer.disconnect();
      initThreeRipple(container, canvas);
    }
  }, { rootMargin: '300px' });

  observer.observe(container);
}

async function initThreeRipple(container, canvas) {
  const THREE = await import('three');

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    return;
  }

  let width = container.offsetWidth;
  let height = container.offsetHeight;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('/images/sunset-bg.webp');
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      u_texture: { value: texture },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_time: { value: 0 },
      u_waveStrength: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform float u_waveStrength;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 aspectUv = vec2(uv.x * aspect, uv.y);
        vec2 aspectMouse = vec2(u_mouse.x * aspect, u_mouse.y);
        
        float dist = distance(aspectUv, aspectMouse);
        float wave = sin(dist * 32.0 - u_time * 4.5) * exp(-dist * 4.0) * u_waveStrength;
        float ambientWave = sin(uv.y * 10.0 + u_time * 1.2) * 0.003;
        
        vec2 displacedUv = uv + vec2(wave * 0.03, wave * 0.03 + ambientWave);
        float r = texture2D(u_texture, displacedUv + vec2(wave * 0.005, 0.0)).r;
        float g = texture2D(u_texture, displacedUv).g;
        float b = texture2D(u_texture, displacedUv - vec2(wave * 0.005, 0.0)).b;
        
        vec4 color = vec4(r, g, b, 1.0);
        vec4 overlay = vec4(0.015, 0.125, 0.18, 0.65);
        gl_FragColor = mix(color, overlay, 0.6);
      }
    `,
    transparent: true
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, material);
  scene.add(quad);

  let waveStrength = 0;
  let targetMouse = { x: 0.5, y: 0.5 };

  container.addEventListener('mousemove', (e) => {
    const box = container.getBoundingClientRect();
    targetMouse.x = (e.clientX - box.left) / box.width;
    targetMouse.y = 1.0 - (e.clientY - box.top) / box.height;
    waveStrength = Math.min(1.2, waveStrength + 0.15);
  }, { passive: true });

  window.addEventListener('resize', () => {
    width = container.offsetWidth;
    height = container.offsetHeight;
    renderer.setSize(width, height);
    material.uniforms.u_resolution.value.set(width, height);
  }, { passive: true });

  gsap.ticker.add((time) => {
    const box = container.getBoundingClientRect();
    if (box.top > window.innerHeight || box.bottom < 0) return;

    material.uniforms.u_time.value = time;
    material.uniforms.u_mouse.value.x += (targetMouse.x - material.uniforms.u_mouse.value.x) * 0.1;
    material.uniforms.u_mouse.value.y += (targetMouse.y - material.uniforms.u_mouse.value.y) * 0.1;
    
    waveStrength *= 0.94;
    material.uniforms.u_waveStrength.value = waveStrength;

    renderer.render(scene, camera);
  });
}
