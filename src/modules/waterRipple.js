import * as THREE from 'three';
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
          duration: 1.2,
          ease: 'power3.out'
        });
      }
    });
  }

  // Mobile optimization: disable WebGL water ripple for performance
  if (window.innerWidth <= 768) {
    canvas.style.display = 'none';
    const bgContainer = document.querySelector('.booking-ripple-canvas-container');
    if (bgContainer) {
      bgContainer.style.backgroundImage = 'url(/images/sunset-bg.jpg)';
      bgContainer.style.backgroundSize = 'cover';
      bgContainer.style.backgroundPosition = 'center';
      bgContainer.style.opacity = '0.35';
    }
    return;
  }

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
    console.warn('WebGL failed for water ripple', e);
    return;
  }

  const rect = container.getBoundingClientRect();
  let width = container.offsetWidth;
  let height = container.offsetHeight;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('/images/sunset-bg.jpg');
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Custom water ripple displacement shader
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
        
        // Aspect ratio correction for ripple
        float aspect = u_resolution.x / u_resolution.y;
        vec2 aspectUv = vec2(uv.x * aspect, uv.y);
        vec2 aspectMouse = vec2(u_mouse.x * aspect, u_mouse.y);
        
        // Distance from cursor
        float dist = distance(aspectUv, aspectMouse);
        
        // Concentric ripples expanding
        float wave = sin(dist * 35.0 - u_time * 5.0) * exp(-dist * 4.0) * u_waveStrength;
        
        // Ambient subtle tide
        float ambientWave = sin(uv.y * 12.0 + u_time * 1.5) * 0.003;
        
        vec2 displacedUv = uv + vec2(wave * 0.03, wave * 0.03 + ambientWave);
        
        // Subtle chromatic aberration
        float r = texture2D(u_texture, displacedUv + vec2(wave * 0.005, 0.0)).r;
        float g = texture2D(u_texture, displacedUv).g;
        float b = texture2D(u_texture, displacedUv - vec2(wave * 0.005, 0.0)).b;
        
        vec4 color = vec4(r, g, b, 1.0);
        
        // Tint with primary luxury dark teal overlay
        vec4 overlay = vec4(0.015, 0.125, 0.18, 0.65);
        gl_FragColor = mix(color, overlay, 0.6);
      }
    `,
    transparent: true
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, material);
  scene.add(quad);

  // Mouse interaction
  let waveStrength = 0;
  let targetMouse = { x: 0.5, y: 0.5 };

  container.addEventListener('mousemove', (e) => {
    const box = container.getBoundingClientRect();
    targetMouse.x = (e.clientX - box.left) / box.width;
    targetMouse.y = 1.0 - (e.clientY - box.top) / box.height;
    waveStrength = Math.min(1.2, waveStrength + 0.15);
  });

  window.addEventListener('resize', () => {
    width = container.offsetWidth;
    height = container.offsetHeight;
    renderer.setSize(width, height);
    material.uniforms.u_resolution.value.set(width, height);
  });

  gsap.ticker.add((time) => {
    // Only render if container is in or near viewport
    const box = container.getBoundingClientRect();
    if (box.top > window.innerHeight || box.bottom < 0) return;

    material.uniforms.u_time.value = time;
    material.uniforms.u_mouse.value.x += (targetMouse.x - material.uniforms.u_mouse.value.x) * 0.1;
    material.uniforms.u_mouse.value.y += (targetMouse.y - material.uniforms.u_mouse.value.y) * 0.1;
    
    // Wave decay
    waveStrength *= 0.94;
    material.uniforms.u_waveStrength.value = waveStrength;

    renderer.render(scene, camera);
  });
}
