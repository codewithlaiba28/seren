import * as THREE from 'three';

export function initUnderwaterThree() {
  const canvas = document.getElementById('underwater-three-canvas');
  if (!canvas || window.innerWidth <= 768) {
    return { render: () => {}, setOpacity: () => {} };
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    console.warn('WebGL not supported for underwater Three.js', e);
    return { render: () => {}, setOpacity: () => {} };
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting: deep teal ambient + cyan accent point lights
  const ambientLight = new THREE.AmbientLight(0x004f58, 1.8);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xa1effe, 2.5);
  keyLight.position.set(5, 10, 7);
  scene.add(keyLight);

  const glowLight = new THREE.PointLight(0x84d2e1, 3, 20);
  glowLight.position.set(-4, -2, 5);
  scene.add(glowLight);

  // Group to hold floating 3D objects
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // Helper to build a stylized low-poly Jellyfish
  function createJellyfish(colorHex, emissiveHex, scale = 1) {
    const group = new THREE.Group();

    // Jellyfish Bell (translucent dome)
    const bellGeo = new THREE.SphereGeometry(1.2, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
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

    // Inner glowing core
    const coreGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: emissiveHex,
      transparent: true,
      opacity: 0.85
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = -0.3;
    group.add(core);

    // Tentacles hanging below
    const tentacles = [];
    const tentacleCount = 6;
    const tentacleMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2;
      const r = 0.85;
      const tentGeo = new THREE.CylinderGeometry(0.03, 0.01, 2.6, 5);
      const tent = new THREE.Mesh(tentGeo, tentacleMat);
      tent.position.set(Math.cos(angle) * r, -1.5, Math.sin(angle) * r);
      group.add(tent);
      tentacles.push(tent);
    }

    group.scale.set(scale, scale, scale);
    return { group, bell, core, tentacles, baseY: 0, phase: Math.random() * 10 };
  }

  // Helper to build a low-poly stylized fish/manta
  function createFish(colorHex) {
    const group = new THREE.Group();
    // Body
    const bodyGeo = new THREE.ConeGeometry(0.6, 2.2, 6);
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

    // Side fins
    const finGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0,
      -0.6, 0.1, 1.2,
      -0.8, -0.1, 0,
      0, 0, 0,
      -0.6, 0.1, -1.2,
      -0.8, -0.1, 0
    ]);
    finGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    finGeo.computeVertexNormals();
    const finMat = new THREE.MeshBasicMaterial({ color: 0xa1effe, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const fins = new THREE.Mesh(finGeo, finMat);
    group.add(fins);

    return { group, body, fins, phase: Math.random() * 10 };
  }

  // Instantiate 3 low-poly creatures
  const jelly1 = createJellyfish(0x84d2e1, 0xa1effe, 0.9);
  jelly1.group.position.set(-4.5, -0.5, -1);
  rootGroup.add(jelly1.group);

  const jelly2 = createJellyfish(0x9eecfb, 0x006875, 0.65);
  jelly2.group.position.set(4.8, 1.5, -2);
  rootGroup.add(jelly2.group);

  const fish1 = createFish(0x84d2e1);
  fish1.group.position.set(1.5, -2.2, 1);
  fish1.group.scale.set(0.7, 0.7, 0.7);
  rootGroup.add(fish1.group);

  // Mouse Parallax tracking
  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let currentOpacity = 0;

  function setOpacity(val) {
    currentOpacity = Math.max(0, Math.min(1, val));
    canvas.style.opacity = currentOpacity;
  }

  function render(time = 0) {
    if (currentOpacity <= 0.01) return;

    // Smooth mouse parallax
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    rootGroup.position.x = mouseX * 1.5;
    rootGroup.position.y = mouseY * 1.0;

    // Organic pulsing and undulating animation
    const t = time * 0.002;

    // Jellyfish 1 pulse
    const pulse1 = Math.sin(t * 2 + jelly1.phase);
    jelly1.group.position.y = -0.5 + Math.sin(t + jelly1.phase) * 0.6;
    jelly1.group.position.x = -4.5 + Math.cos(t * 0.8) * 0.4;
    jelly1.bell.scale.set(1 + pulse1 * 0.15, 1 - pulse1 * 0.2, 1 + pulse1 * 0.15);
    jelly1.tentacles.forEach((tent, idx) => {
      tent.rotation.z = Math.sin(t * 2.5 + idx) * 0.2;
      tent.rotation.x = Math.cos(t * 2.5 + idx) * 0.15;
    });

    // Jellyfish 2 pulse
    const pulse2 = Math.sin(t * 1.8 + jelly2.phase);
    jelly2.group.position.y = 1.2 + Math.sin(t * 0.9 + jelly2.phase) * 0.5;
    jelly2.group.position.x = 4.8 + Math.sin(t * 0.7) * 0.5;
    jelly2.bell.scale.set(1 + pulse2 * 0.12, 1 - pulse2 * 0.18, 1 + pulse2 * 0.12);
    jelly2.tentacles.forEach((tent, idx) => {
      tent.rotation.z = Math.cos(t * 2.2 + idx) * 0.2;
    });

    // Fish swim path
    fish1.group.position.x = 1.5 + Math.sin(t * 1.4 + fish1.phase) * 1.8;
    fish1.group.position.y = -2.0 + Math.sin(t * 2.2 + fish1.phase) * 0.4;
    fish1.group.rotation.y = Math.sin(t * 1.4 + fish1.phase) > 0 ? 0 : Math.PI;
    fish1.group.rotation.z = Math.sin(t * 3) * 0.1;

    renderer.render(scene, camera);
  }

  return {
    render,
    setOpacity
  };
}
