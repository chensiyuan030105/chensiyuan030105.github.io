import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Liquid } from 'liquidjs';
import YAML from 'yaml';
import { parseBibliography } from './bibliography.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, '_site');
const read = file => readFile(path.join(root, file), 'utf8');
const engine = new Liquid({ root: path.join(root, 'studio'), extname: '.html', strictFilters: true });
engine.registerFilter('escape', value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
engine.registerFilter('month', date => new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }));
const bibliography = (await read('_bibliography/papers.bib')).replace(/^---\s*\n---\s*\n/, '');
const papers = parseBibliography(bibliography).map(entry => {
  const p = entry.fields;
  return { ...p, id: entry.id, venue: p.booktitle || p.journal, authors: p.author.replace(/<sup>.*?<\/sup>/g, '').split(' and '),
    equal: (p.equal_contrib || '').split(' and ').map(s => s.split(', ').reverse().join(' ')),
    corresponding: (p.corresponding || '').split(' and ').map(s => s.split(', ').reverse().join(' ')),
    link: p.website || p.pdf || p.html || '', category: /protein|biomolecular/i.test(p.title) ? 'Biomolecular' : /splatting|plasticine/i.test(p.title) ? 'Visual computing' : 'Simulation' };
}).sort((a, b) => Number(b.year) - Number(a.year));
const news = YAML.parse(await read('_data/news.yml'));
const demos = YAML.parse(await read('_data/demos.yml'));
const pages = [
  { template: 'home', slug: '', title: 'Siyuan Chen — AI & Physical Computing', description: 'Siyuan Chen. PhD student at UBC, exploring AI for biomolecular and physical dynamics.' },
  { template: 'publications', slug: 'publications', title: 'Publications — Siyuan Chen', description: 'Research in biomolecular modeling, neural simulation, and visual computing.' },
  { template: 'demos', slug: 'demos', title: 'Demos — Siyuan Chen', description: 'Interactive experiments and research demonstrations in physics, geometry, and learning.' },
  { template: 'about', slug: 'about', title: 'About — Siyuan Chen', description: 'About Siyuan Chen, a Computer Science PhD student at the University of British Columbia.' }
];
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
await mkdir(path.join(out, 'assets/vendor'), { recursive: true });
for (const file of ['three.module.min.js', 'three.core.min.js']) {
  await cp(path.join(root, 'node_modules/three/build', file), path.join(out, 'assets/vendor', file));
}
await cp(path.join(root, 'node_modules/three/LICENSE'), path.join(out, 'assets/vendor/THREE-LICENSE.txt'));
for (const page of pages) {
  const data = { page, papers, years: [...new Set(papers.map(p => p.year))], news, demos };
  const content = await engine.renderFile(page.template, data);
  const html = await engine.renderFile('layout', { ...data, content });
  const target = path.join(out, page.slug);
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, 'index.html'), html);
}
await writeFile(path.join(out, '.nojekyll'), '');
await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://chensiyuan030105.github.io/sitemap.xml\n');
await writeFile(path.join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + pages.map(p => `<url><loc>https://chensiyuan030105.github.io/${p.slug ? p.slug + '/' : ''}</loc></url>`).join('') + '</urlset>');
console.log(`Built ${pages.length} pages, ${papers.length} publications, ${demos.length} research demos → _site/`);
