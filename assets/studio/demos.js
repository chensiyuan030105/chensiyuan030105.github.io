const winding = document.querySelector('#winding');
const speed = document.querySelector('#demo-speed');
const pause = document.querySelector('#demo-pause');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scene, paused = motion.matches;
function updatePause() { pause.textContent = paused ? 'Resume motion' : 'Pause motion'; pause.setAttribute('aria-pressed', String(paused)); }
updatePause();
try {
  const { createKnotScene } = await import('./knot.js');
  scene = createKnotScene(document.querySelector('#demo-scene'), { winding: 3, interactive: true });
  winding.addEventListener('input', () => { document.querySelector('#winding-value').textContent = winding.value; scene.setWinding(Number(winding.value)); });
  speed.addEventListener('input', () => { document.querySelector('#speed-value').textContent = `${(speed.value / 100).toFixed(1)}×`; scene.setSpeed(speed.value / 100); });
  pause.addEventListener('click', () => { paused = !paused; scene.setPaused(paused); updatePause(); });
  motion.addEventListener('change', e => { paused = e.matches; updatePause(); });
  document.querySelector('#demo-reset').addEventListener('click', () => { winding.value = 3; speed.value = 40; document.querySelector('#winding-value').textContent = '3'; document.querySelector('#speed-value').textContent = '0.4×'; scene.setWinding(3); scene.setSpeed(.4); scene.reset(); paused = motion.matches; scene.setPaused(paused); updatePause(); });
} catch (error) {
  console.error('Could not initialize demo:', error);
  document.querySelector('#demo-fallback').hidden = false;
  [winding, speed, pause, document.querySelector('#demo-reset')].forEach(control => { control.disabled = true; });
}
window.addEventListener('pagehide', event => { if (!event.persisted) scene?.dispose(); });
