import * as THREE from '../vendor/three.module.min.js';

// A torus-knot family, independently parameterized and morphed on the CPU.
// The last step flattens T(2,1) into a simple circle.
export class KnotCurve extends THREE.Curve {
  constructor(winding = 7) { super(); this.winding = winding; this.next = winding; this.mix = 0; }
  sample(t, winding, target) {
    const a = t * Math.PI * 2;
    if (winding === 0) return target.set(4.6 * Math.cos(a), 4.6 * Math.sin(a), 0);
    const radius = 4 + 1.7 * Math.cos(winding * a);
    return target.set(radius * Math.cos(2 * a), radius * Math.sin(2 * a), 1.7 * Math.sin(winding * a));
  }
  getPoint(t, target = new THREE.Vector3()) {
    this.sample(t, this.winding, target);
    if (this.mix > 0) target.lerp(this.sample(t, this.next, new THREE.Vector3()), this.mix);
    return target;
  }
}

function environment(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111315'; ctx.fillRect(0, 0, 1024, 512);
  // Studio softboxes: elongated highlights make the curved glass legible.
  for (const [x, y, width, height, color] of [
    [120, 110, 18, 290, '#ffffff'], [155, 80, 5, 320, '#dae1ff'],
    [385, 100, 250, 16, '#ffffff'], [430, 120, 160, 6, '#c4c4cd'],
    [740, 160, 12, 250, '#fff1e5'], [790, 70, 120, 22, '#ffffff'],
    [220, 400, 500, 7, '#9aa6b9']
  ]) { ctx.fillStyle = color; ctx.fillRect(x, y, width, height); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(texture);
  texture.dispose(); pmrem.dispose();
  return target;
}

export function createKnotScene(container, { winding = 7, interactive = false, home = false } = {}) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 600 ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  const env = environment(renderer); scene.environment = env.texture;
  const group = new THREE.Group(); scene.add(group);
  const curve = new KnotCurve(winding);
  const material = new THREE.MeshPhysicalMaterial({ color: '#d0d3da', roughness: .12, metalness: .25, clearcoat: 1, clearcoatRoughness: .08, transmission: .85, thickness: .65, ior: 1.3, envMapIntensity: 3.2 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 384, .135, 24, true), material);
  group.add(tube);
  // A subtle Fresnel layer restores the fine silver rim of studio-lit glass.
  const rimMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, uniforms: { uLight: { value: 1 } },
    vertexShader: `varying vec3 vNormal; varying vec3 vView;
      void main(){ vec4 p=modelViewMatrix*vec4(position,1.); vNormal=normalize(normalMatrix*normal); vView=normalize(-p.xyz); gl_Position=projectionMatrix*p; }`,
    fragmentShader: `varying vec3 vNormal; varying vec3 vView; uniform float uLight;
      void main(){ float facing=abs(dot(normalize(vNormal),normalize(vView)));
        float f=pow(1.-facing,2.5);
        float stripe=exp(-pow((facing-.44)/.065,2.));
        float fine=exp(-pow((facing-.77)/.035,2.));
        vec3 silver=mix(vec3(.76,.82,.9),vec3(1.),f+stripe*.6);
        gl_FragColor=vec4(silver, clamp(f*1.3+stripe*.8+fine*.2,0.,1.)*uLight); }`
  });
  const rim = new THREE.Mesh(tube.geometry, rimMaterial); rim.renderOrder = 2; group.add(rim);
  scene.add(new THREE.HemisphereLight('#e4e9ff', '#3e3f42', .07));
  const light = new THREE.DirectionalLight('#ffffff', .3); light.position.set(4, 8, 12); scene.add(light);
  const trailCurve = new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => curve.getPoint(i / 30)));
  const trailMaterial = new THREE.MeshBasicMaterial({ color: '#d9ccff', transparent: true, opacity: 0 });
  const trail = new THREE.Mesh(new THREE.TubeGeometry(trailCurve, 32, .041, 6, false), trailMaterial); group.add(trail);
  let width = 0, height = 0, dark = true, time = 0, previous = performance.now(), frameId, disposed = false, inView = true;
  let geometryDirty = false, lastShape = '', progress = 0, holding = false, retying = false;
  let paused = reducedMotion.matches, speed = .4, yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0, drag = null;
  let lastTrail = -1, lastTrailShape = '';
  const stages = [7, 5, 3, 1, 0];
  const onTheme = () => {
    dark = document.documentElement.dataset.theme !== 'light';
    scene.background = new THREE.Color(dark ? (home ? '#0d0d0d' : '#121413') : (home ? '#e9eae7' : '#e0e3de'));
    material.color.set(dark ? '#c2c7d2' : '#6c7481');
    material.envMapIntensity = dark ? 3.2 : 1.3;
    rimMaterial.uniforms.uLight.value = dark ? 1 : .28;
  };
  onTheme(); window.addEventListener('themechange', onTheme);
  const resize = () => {
    const rect = container.getBoundingClientRect(); width = rect.width; height = rect.height;
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height;
    const worldHeight = home ? (width < 600 ? 17 : 15.8) : Math.max(14.5, 13 / camera.aspect);
    camera.position.set(0, 0, worldHeight / (2 * Math.tan(THREE.MathUtils.degToRad(17.5))));
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  const visibilityObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
  visibilityObserver.observe(container);
  const pointerMove = e => {
    if (interactive && drag) {
      targetYaw += (e.clientX - drag.x) * .008; targetPitch += (e.clientY - drag.y) * .008;
      drag = { x: e.clientX, y: e.clientY };
    } else if (home && !reducedMotion.matches && e.pointerType !== 'touch') {
      targetYaw = (e.clientX / window.innerWidth - .5) * .6;
      targetPitch = (e.clientY / window.innerHeight - .5) * .35;
    }
  };
  const pointerDown = e => { if (interactive) { drag = { x: e.clientX, y: e.clientY }; container.setPointerCapture(e.pointerId); } };
  const pointerUp = () => { drag = null; };
  container.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);
  const onMotion = e => { paused = e.matches; };
  reducedMotion.addEventListener('change', onMotion);
  function updateGeometry() {
    const next = new THREE.TubeGeometry(curve, 384, .135, 24, true);
    tube.geometry.dispose(); tube.geometry = next; rim.geometry = next; geometryDirty = false;
  }
  const state = { onProgress: null, setHolding(value) { holding = value; }, retie() { holding = false; retying = true; },
    setWinding(value) { curve.winding = value; curve.next = value; curve.mix = 0; geometryDirty = true; lastTrail = -1; },
    setSpeed(value) { speed = value; }, setPaused(value) { paused = value; },
    reset() { targetYaw = targetPitch = 0; time = 0; },
    dispose() { disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); visibilityObserver.disconnect(); window.removeEventListener('themechange', onTheme); window.removeEventListener('pointermove', pointerMove); window.removeEventListener('pointerup', pointerUp); container.removeEventListener('pointerdown', pointerDown); reducedMotion.removeEventListener('change', onMotion); tube.geometry.dispose(); trail.geometry.dispose(); material.dispose(); rimMaterial.dispose(); trailMaterial.dispose(); env.dispose(); renderer.dispose(); renderer.domElement.remove(); }
  };
  function frame(now) {
    if (disposed) return;
    frameId = requestAnimationFrame(frame);
    const dt = Math.min((now - previous) / 1000, .05); previous = now;
    if (document.hidden || !inView || !width || !height) return;
    if (!paused) time += dt * speed;
    if (home) {
      const old = progress;
      if (retying) { progress = Math.max(0, progress - dt * 1.6); if (progress === 0) retying = false; }
      else if (holding) progress = Math.min(4, progress + dt * .48);
      const index = Math.min(3, Math.floor(progress)); const frac = progress - index;
      curve.winding = stages[index]; curve.next = stages[index + 1]; curve.mix = frac * frac * (3 - 2 * frac);
      const shape = `${index}-${curve.mix.toFixed(3)}`;
      if (shape !== lastShape) { geometryDirty = true; lastShape = shape; }
      if (progress !== old) state.onProgress?.(progress, holding, retying);
      group.position.y = THREE.MathUtils.damp(group.position.y, progress > 0 ? .6 : 0, 4, dt);
    }
    if (geometryDirty) updateGeometry();
    yaw = THREE.MathUtils.damp(yaw, targetYaw, 4, dt); pitch = THREE.MathUtils.damp(pitch, targetPitch, 4, dt);
    group.rotation.set(.13 + pitch, yaw + (home ? .1 : .2), (home ? -.15 : .2) + time * .13);
    // A faint iridescent comet traces the curve; it never competes with the name.
    const traceTime = Math.floor(time * 18);
    if (!reducedMotion.matches && (traceTime !== lastTrail || lastShape !== lastTrailShape)) {
      const head = (time * .13 + .15) % 1;
      const points = Array.from({ length: 26 }, (_, i) => curve.getPoint((head + i * .003) % 1, new THREE.Vector3()));
      trailCurve.points = points;
      const next = new THREE.TubeGeometry(trailCurve, 32, .042, 6, false);
      trail.geometry.dispose(); trail.geometry = next;
      lastTrail = traceTime; lastTrailShape = lastShape;
      trailMaterial.color.setHSL((time * .05 + .62) % 1, .6, .8);
    }
    trailMaterial.opacity = reducedMotion.matches ? 0 : (holding ? .75 : .28);
    renderer.render(scene, camera);
  }
  frameId = requestAnimationFrame(frame);
  return state;
}
