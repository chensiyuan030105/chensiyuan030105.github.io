const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const updateThemeLabel = () => themeButton?.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
updateThemeLabel();
themeButton?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('siyuan-theme', root.dataset.theme); } catch {}
  document.querySelector('meta[name="theme-color"]').content = root.dataset.theme === 'dark' ? '#0d0d0d' : '#e9eae7';
  updateThemeLabel();
  window.dispatchEvent(new Event('themechange'));
});
const menu = document.querySelector('#mobile-menu');
const menuButton = document.querySelector('.menu-toggle');
menuButton?.addEventListener('click', () => { menu.showModal(); menuButton.setAttribute('aria-expanded', 'true'); });
document.querySelector('.menu-close')?.addEventListener('click', () => menu.close());
menu?.addEventListener('close', () => { menuButton.setAttribute('aria-expanded', 'false'); menuButton.focus(); });
window.matchMedia('(min-width: 600px)').addEventListener('change', e => { if (e.matches && menu?.open) menu.close(); });

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const papers = [...document.querySelectorAll('.paper')];
let category = 'All';
function filterPapers() {
  const query = document.querySelector('#paper-search').value.trim().toLowerCase();
  let count = 0;
  for (const paper of papers) {
    paper.hidden = (category !== 'All' && paper.dataset.category !== category) || !paper.textContent.toLowerCase().includes(query);
    if (!paper.hidden) count++;
  }
  document.querySelectorAll('.publication-year').forEach(year => { year.hidden = ![...year.querySelectorAll('.paper')].some(paper => !paper.hidden); });
  document.querySelector('.publication-count').textContent = `${count} publication${count === 1 ? '' : 's'}`;
  document.querySelector('#no-papers').hidden = count > 0;
}
filterButtons.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  filterPapers();
}));
document.querySelector('#paper-search')?.addEventListener('input', filterPapers);

document.querySelectorAll('[data-demo-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-demo-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  document.querySelectorAll('.demo-card').forEach(card => { card.hidden = button.dataset.demoFilter !== 'All' && card.dataset.type !== button.dataset.demoFilter; });
  const count = [...document.querySelectorAll('.demo-card')].filter(card => !card.hidden).length;
  document.querySelector('.section-heading>span').textContent = `${count} project${count === 1 ? '' : 's'}`;
}));
const demoDialog = document.querySelector('#demo-dialog');
const reducedMediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const visiblePreviews = new Set();
function syncVideoPreviews() {
  document.querySelectorAll('video[data-preview-video]').forEach(video => {
    if (visiblePreviews.has(video) && !demoDialog?.open && !document.hidden && !reducedMediaMotion.matches) {
      const source = video.querySelector('source');
      if (!source.hasAttribute('src')) { source.src = source.dataset.src; video.load(); }
      video.muted = true;
      video.play().catch(() => { /* The poster remains visible when autoplay is unavailable. */ });
    } else video.pause();
  });
}
const previewObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) visiblePreviews.add(entry.target); else visiblePreviews.delete(entry.target); });
  syncVideoPreviews();
}, { threshold: .15 });
document.querySelectorAll('video[data-preview-video]').forEach(video => previewObserver.observe(video));
document.addEventListener('visibilitychange', syncVideoPreviews);
reducedMediaMotion.addEventListener('change', syncVideoPreviews);
document.querySelectorAll('[data-open-demo]').forEach(button => button.addEventListener('click', () => {
  const content = document.querySelector('#demo-dialog-content');
  content.replaceChildren(document.querySelector(`#demo-${button.dataset.openDemo}`).content.cloneNode(true));
  content.querySelector('h2').id = 'modal-title';
  demoDialog.showModal();
  syncVideoPreviews();
  const video = content.querySelector('video');
  if (video) { video.muted = true; video.play().catch(() => { /* Native controls provide a manual play action. */ }); }
}));
demoDialog?.addEventListener('close', () => {
  demoDialog.querySelectorAll('video').forEach(video => video.pause());
  syncVideoPreviews();
});
document.querySelector('.modal-close')?.addEventListener('click', () => demoDialog.close());
demoDialog?.addEventListener('click', e => { if (e.target === demoDialog) { const box = demoDialog.getBoundingClientRect(); if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) demoDialog.close(); } });
