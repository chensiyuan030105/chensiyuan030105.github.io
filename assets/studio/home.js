// A curl-inspired, advected particle field; an artistic flow visualization.
// Text is sampled from a local canvas, so it stays sharp at every viewport size.
const host = document.querySelector('#fluid-scene');
const status = document.querySelector('#fluid-status');
const progress = document.querySelector('#fluid-progress');
const resolve = document.querySelector('#fluid-resolve');
const pause = document.querySelector('#fluid-pause');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
let w = 0, h = 0, particles = [], targets = [], elapsed = reduced.matches ? 18 : 0;
let paused = false, frame, last = performance.now(), disposed = false, phase = -1;
let pointer = { x: -10000, y: -10000 }, dark = true;
const palette = ['#54e0e8', '#40b4cc', '#699eea', '#c0cafa', '#edc382', '#e8a96c'];
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function resize() {
  w = host.clientWidth; h = host.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mask = document.createElement('canvas'); mask.width = Math.ceil(w); mask.height = Math.ceil(h);
  const m = mask.getContext('2d', { willReadFrequently: true });
  let size = Math.min(w * .20, h * .21, 200);
  m.font = `700 ${size}px "Linux Biolinum"`;
  size *= Math.min(1, w * .80 / m.measureText('SIYUAN').width);
  m.font = `700 ${size}px "Linux Biolinum"`; m.textAlign = 'center'; m.textBaseline = 'middle';
  m.fillStyle = '#fff';
  m.fillText('SIYUAN', w * .53, h * .40); m.fillText('CHEN', w * .53, h * .40 + size * .94);
  const data = m.getImageData(0, 0, mask.width, mask.height).data;
  targets = [];
  const step = w < 600 ? 3 : 4;
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step)
    if (data[(y * mask.width + x) * 4 + 3] > 128) targets.push({ x, y });
  targets.sort((a, b) => a.x - b.x);
  particles = Array.from({ length: w < 600 ? 4200 : 8500 }, (_, i) => {
    const a = ((i % 6) / 6 + Math.random() * .16) * Math.PI * 2, r = .35 + Math.random() * .65;
    const target = targets[Math.min(targets.length - 1, Math.floor(((i % 6) + Math.random()) / 6 * targets.length))] || { x: w / 2, y: h / 2 };
    return { x: w * (.53 + .43 * r * Math.cos(a)), y: h * (.43 + .4 * r * Math.sin(a)), vx: 0, vy: 0,
      seed: Math.random() * 100, color: i % 6, target: { x: target.x + (Math.random() - .5) * 2.2, y: target.y + (Math.random() - .5) * 2.2 } };
  });
  ctx.fillStyle = dark ? '#071015' : '#e8eef0'; ctx.fillRect(0, 0, w, h);
}
function theme() { dark = document.documentElement.dataset.theme !== 'light'; }
function render(now) {
  if (disposed) return;
  const dt = Math.min((now - last) / 1000, .04); last = now;
  if (!paused && !document.hidden) {
    elapsed += reduced.matches ? 0 : dt;
    const morph = smooth((elapsed - 8) / 7);
    const nextPhase = morph >= 1 ? 2 : elapsed >= 8 ? 1 : 0;
    if (phase !== nextPhase) {
      phase = nextPhase;
      status.textContent = ['01 / A field in motion', '02 / Finding a form', '03 / Siyuan Chen'][phase];
      resolve.textContent = phase === 2 ? 'Release the current ↻' : 'Form my name ↗';
    }
    progress.style.width = `${Math.min(100, elapsed / 15 * 100)}%`;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = dark ? `rgba(7,16,21,${.045 + morph * .20})` : `rgba(232,238,240,${.07 + morph * .2})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    const time = elapsed * .22, scale = Math.min(w, h), speed = dt * 60;
    for (let color = 0; color < 6; color++) {
      ctx.beginPath(); ctx.strokeStyle = dark ? palette[color] : ['#007d92','#087782','#2868ab','#665ca0','#a16a25','#b56632'][color];
      ctx.globalAlpha = .55; ctx.lineWidth = morph > .9 ? 1.6 : 1.0;
      for (let i = color; i < particles.length; i += 6) {
        const p = particles[i];
        if (reduced.matches) { p.x = p.target.x; p.y = p.target.y; }
        const ox = p.x, oy = p.y;
        const x = (p.x - w * .53) / scale, y = (p.y - h * .43) / scale;
        // Counter-rotating vortices with a slowly changing incompressible wave field.
        let fx = .65 * Math.cos(3.1 * y + time) + .38 * Math.cos(7 * y - 2 * x + time * 1.7);
        let fy = .65 * Math.sin(3.1 * x - time) + .38 * Math.sin(7 * x + 2 * y - time * 1.4);
        for (let j = 0; j < 3; j++) {
          const cx = Math.cos(time * .4 + j * 2.1) * .24, cy = Math.sin(time * .5 + j * 2.1) * .20;
          const dx = x - cx, dy = y - cy, force = .055 / (.018 + dx * dx + dy * dy) * (j === 1 ? -1 : 1);
          fx -= dy * force; fy += dx * force;
        }
        fx -= x * .35; fy -= y * .45;
        const breathe = reduced.matches ? 0 : Math.sin(time * 2 + p.seed) * .7 * morph;
        let tx = (p.target.x + breathe - p.x) * .045, ty = (p.target.y + breathe * .5 - p.y) * .045;
        const dx = p.x - pointer.x, dy = p.y - pointer.y, dist = Math.hypot(dx, dy);
        if (dist < 110 && dist > 0) { const force = (1 - dist / 110) * 4; fx += dx / dist * force; fy += dy / dist * force; tx += dx / dist * force; ty += dy / dist * force; }
        p.vx = p.vx * .73 + (fx * (1 - morph) * 1.8 + tx * morph) * .27;
        p.vy = p.vy * .73 + (fy * (1 - morph) * 1.8 + ty * morph) * .27;
        if (!reduced.matches) { p.x += p.vx * speed; p.y += p.vy * speed; }
        if (morph < .1 && (p.x < 0 || p.x > w || p.y < h * .1 || p.y > h * .85)) {
          p.x = w * .53 + (Math.random() - .5) * scale * 1.2; p.y = h * .43 + (Math.random() - .5) * scale * .9;
        } else {
          ctx.moveTo(ox, oy); ctx.lineTo(p.x + .3, p.y + .3);
          if (morph > .7) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + .65, p.y + .65); }
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  frame = requestAnimationFrame(render);
}
function restart() {
  if (reduced.matches) { elapsed = 18; resize(); phase = -1; return; }
  if (elapsed >= 15) { elapsed = 0; resize(); } else elapsed = Math.max(elapsed, 8);
  if (paused) togglePause();

  phase = -1;
}
function togglePause() { paused = !paused; pause.textContent = paused ? 'Resume' : 'Pause'; pause.setAttribute('aria-pressed', String(paused)); }
function motionChange() { if (reduced.matches) elapsed = 18; }
try {
  if (!ctx) throw Error('Canvas unavailable');
  await document.fonts.load('700 100px "Linux Biolinum"');
  theme(); host.append(canvas); resize(); frame = requestAnimationFrame(render);
  resolve.addEventListener('click', restart); pause.addEventListener('click', togglePause);
  host.addEventListener('pointermove', e => { const rect = host.getBoundingClientRect(); pointer.x = e.clientX - rect.left; pointer.y = e.clientY - rect.top; });
  host.addEventListener('pointerleave', () => { pointer.x = -10000; pointer.y = -10000; });
  window.addEventListener('resize', resize); window.addEventListener('themechange', theme);
  reduced.addEventListener('change', motionChange);
  window.addEventListener('pagehide', e => { if (!e.persisted) { disposed = true; cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('themechange', theme); reduced.removeEventListener('change', motionChange); } });
} catch (error) {
  console.error('Could not initialize fluid field:', error);
  document.querySelector('#scene-fallback').hidden = false;
  document.querySelector('.fluid-accessible-name').classList.add('fluid-name-fallback');
  document.querySelector('.fluid-controls').hidden = true;
}
