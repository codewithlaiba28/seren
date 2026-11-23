export function initUnderwaterThree() {
  const canvas = document.getElementById('underwater-three-canvas');
  // Immediately bypass on mobile, reduced motion, or low concurrency
  if (
    !canvas ||
    window.innerWidth <= 768 ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  ) {
    return { render: () => {}, setOpacity: () => {} };
  }

  let THREE = null;
  let scene, camera, renderer, rootGroup;
  let isReady = false;
  let currentOpacity = 0;
  let jelly1, jelly2, fish1;
  let targetMouseX = 0, targetMouseY = 0, mouseX = 0, mouseY = 0;

  // Lazy-load Three.js asynchronously on desktop
  import('three').then((module) => {
    THREE = module;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const ambientLight = new THREE.AmbientLight(0x004f58, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xa1effe, 2.5);
    keyLight.position.set(5, 10, 7);
    scene.add(keyLight);

    const glowLight = new THREE.PointLight(0x84d2e1, 3, 20);
    glowLight.position.set(-4, -2, 5);
    scene.add(glowLight);

    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    function createJellyfish(colorHex, emissiveHex, scale = 1) {
      const group = new THREE.Group();
      const bellGeo = new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const bellMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: emissiveHex,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.72,
        roughness: 0.3,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      const bell = new THREE.Mesh(bellGeo, bellMat);
      bell.rotation.x = Math.PI;
      group.add(bell);

      const coreGeo = new THREE.SphereGeometry(0.5, 6, 6);
      const coreMat = new THREE.MeshBasicMaterial({ color: emissiveHex, transparent: true, opacity: 0.85 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = -0.3;
      group.add(core);

      const tentacles = [];
      const tentacleMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.6 });
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const tentGeo = new THREE.CylinderGeometry(0.03, 0.01, 2.4, 4);
        const tent = new THREE.Mesh(tentGeo, tentacleMat);
        tent.position.set(Math.cos(angle) * 0.85, -1.4, Math.sin(angle) * 0.85);
        group.add(tent);
        tentacles.push(tent);
      }
      group.scale.set(scale, scale, scale);
      return { group, bell, tentacles, phase: Math.random() * 10 };
    }

    function createFish(colorHex) {
      const group = new THREE.Group();
      const bodyGeo = new THREE.ConeGeometry(0.5, 2.0, 5);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: 0x096d7a,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8,
        roughness: 0.4,
        flatShading: true
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI * 0.5;
      group.add(body);
      return { group, body, phase: Math.random() * 10 };
    }

    jelly1 = createJellyfish(0x84d2e1, 0xa1effe, 0.9);
    jelly1.group.position.set(-4.5, -0.5, -1);
    rootGroup.add(jelly1.group);

    jelly2 = createJellyfish(0x9eecfb, 0x006875, 0.65);
    jelly2.group.position.set(4.8, 1.5, -2);
    rootGroup.add(jelly2.group);

    fish1 = createFish(0x84d2e1);
    fish1.group.position.set(1.5, -2.2, 1);
    fish1.group.scale.set(0.7, 0.7, 0.7);
    rootGroup.add(fish1.group);

    window.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });

    isReady = true;
  });

  return {
    setOpacity(val) {
      currentOpacity = Math.max(0, Math.min(1, val));
      if (canvas) canvas.style.opacity = currentOpacity;
    },
    render(time = 0) {
      if (!isReady || currentOpacity <= 0.01) return;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      rootGroup.position.x = mouseX * 1.5;
      rootGroup.position.y = mouseY * 1.0;

      const t = time * 0.002;
      const pulse1 = Math.sin(t * 2 + jelly1.phase);
      jelly1.group.position.y = -0.5 + Math.sin(t + jelly1.phase) * 0.6;
      jelly1.bell.scale.set(1 + pulse1 * 0.15, 1 - pulse1 * 0.2, 1 + pulse1 * 0.15);

      const pulse2 = Math.sin(t * 1.8 + jelly2.phase);
      jelly2.group.position.y = 1.2 + Math.sin(t * 0.9 + jelly2.phase) * 0.5;
      jelly2.bell.scale.set(1 + pulse2 * 0.12, 1 - pulse2 * 0.18, 1 + pulse2 * 0.12);

      fish1.group.position.x = 1.5 + Math.sin(t * 1.4 + fish1.phase) * 1.8;
      fish1.group.position.y = -2.0 + Math.sin(t * 2.2 + fish1.phase) * 0.4;

      renderer.render(scene, camera);
    }
  };
}
