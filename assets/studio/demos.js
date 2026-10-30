import { createPigmentScene } from './pigment.js';
const brush = document.querySelector('#paint-radius'), swirl = document.querySelector('#paint-swirl'), color = document.querySelector('#paint-color'), pause = document.querySelector('#demo-pause');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let scene, paused = motion.matches;
function update() { pause.textContent = paused ? 'Resume motion' : 'Pause motion'; pause.setAttribute('aria-pressed', String(paused)); }
function changeMotion(e) { paused = e.matches; scene?.setPaused(paused); update(); }
update();
try {
  scene = createPigmentScene(document.querySelector('#demo-scene'), { paused });
  brush.oninput = () => { document.querySelector('#radius-value').textContent = brush.value; scene.setRadius(+brush.value); };
  swirl.oninput = () => { document.querySelector('#swirl-value').textContent = swirl.value; scene.setSwirl(+swirl.value); };
  color.oninput = () => scene.setColor(color.value);
  pause.onclick = () => { paused = !paused; scene.setPaused(paused); update(); };
  motion.addEventListener('change', changeMotion);
  document.querySelector('#demo-reset').onclick = () => { brush.value=18; swirl.value=20; color.value='#27d9d0'; brush.oninput(); swirl.oninput(); color.oninput(); scene.reset(); paused=motion.matches; scene.setPaused(paused); update(); };
} catch (error) {
  console.error('Pigment initialization failed:', error);
  document.querySelector('#demo-fallback').hidden = false;
  [brush,swirl,color,pause,document.querySelector('#demo-reset')].forEach(control => { control.disabled=true; });
}
window.addEventListener('pagehide', e => { if (!e.persisted) { scene?.dispose(); motion.removeEventListener('change',changeMotion); } });
