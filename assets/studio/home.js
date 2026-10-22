const container = document.querySelector('#knot-scene');
const button = document.querySelector('#untie');
const label = button.querySelector('span');
const description = document.querySelector('#knot-description');
let scene, progress = 0, holding = false, retying = false, retieArmed = false;
const stages = [
  ['T(2, 7) · Septafoil', 'Seven crossings. One continuous curve.'],
  ['T(2, 5) · Cinquefoil', 'Five crossings. A little less entangled.'],
  ['T(2, 3) · Trefoil', 'Three crossings. The simplest true knot.'],
  ['T(2, 1)', 'One crossing. An unknot in disguise.'],
  ['The unknot', 'No crossings. Just a closed loop.']
];
function update() {
  document.body.classList.toggle('is-untying', progress > .02 || holding);
  button.dataset.holding = String(holding);
  button.disabled = retying;
  label.textContent = retying ? 'Tying…' : progress >= 4 ? 'Tie it again' : holding ? 'Untying…' : progress > 0 ? 'Hold to keep untying' : 'Press and hold to untie';
  const stage = stages[Math.min(4, Math.floor(progress + .05))];
  const content = progress > 0 || holding ? `<strong>${stage[0]}</strong>${stage[1]}` : '';
  if (description.innerHTML !== content) description.innerHTML = content;
}
function release() { holding = false; scene?.setHolding(false); update(); }
function start(e) {
  retieArmed = progress >= 4;
  if (!scene || retying || progress >= 4 || e.button > 0) return;
  holding = true; scene.setHolding(true); update();
}
button.addEventListener('pointerdown', start);
button.addEventListener('keydown', e => { if ([' ', 'Enter'].includes(e.key) && !e.repeat) { e.preventDefault(); start(e); } });
function retieIfArmed(event) { if ((retieArmed || event?.detail === 0) && progress >= 4) { retieArmed = false; retying = true; scene?.retie(); update(); } }
button.addEventListener('keyup', e => { if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); release(); retieIfArmed(); } });
button.addEventListener('click', retieIfArmed);
button.addEventListener('blur', release);
button.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
window.addEventListener('blur', release);
document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
try {
  const { createKnotScene } = await import('./knot.js');
  scene = createKnotScene(container, { home: true });
  scene.onProgress = (value, isHolding, isRetying) => { progress = value; holding = isHolding && value < 4; retying = isRetying; update(); };
  document.body.classList.add('scene-ready');
} catch (error) {
  console.error('Could not initialize the knot scene:', error);
  button.hidden = true;
  document.querySelector('#scene-fallback').hidden = false;
}
window.addEventListener('pagehide', event => { if (!event.persisted) scene?.dispose(); });
