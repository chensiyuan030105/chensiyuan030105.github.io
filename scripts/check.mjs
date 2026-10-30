import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBibliography } from './bibliography.mjs';
import YAML from 'yaml';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '_site');
const routes = ['', 'about', 'publications', 'demos'];
const html = new Map();
for (const route of routes) html.set(route, await readFile(path.join(output, route, 'index.html'), 'utf8'));
let links = 0;
for (const [route, source] of html) {
  assert.equal((source.match(/<h1\b/g) || []).length, 1, `${route}: one h1`);
  assert(source.includes('<nav'), `${route}: navigation`);
  assert(!/{[{%]/.test(source), `${route}: no unresolved template syntax`);
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${route}: unique IDs`);
  for (const match of source.matchAll(/(?:href|src|poster)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    let local = path.join(output, match[1]);
    if (local.endsWith(path.sep)) local = path.join(local, 'index.html');
    await access(local).catch(() => assert.fail(`${route}: broken local URL ${match[1]}`)); links++;
  }
}
const entries = parseBibliography(await readFile(path.join(root, '_bibliography/papers.bib'), 'utf8'));
const publicationHTML = html.get('publications');
for (const entry of entries) {
  assert(publicationHTML.includes(`id="${entry.id}"`), `Missing publication ${entry.id}`);
  for (const field of ['pdf', 'website', 'html']) if (entry.fields[field]) assert(publicationHTML.includes(entry.fields[field]), `Missing ${field} for ${entry.id}`);
}
assert.equal((publicationHTML.match(/class="paper"/g) || []).length, entries.length, 'All papers preserved');
const demos = YAML.parse(await readFile(path.join(root, '_data/demos.yml'), 'utf8'));
assert.equal((html.get('demos').match(/class="demo-card"/g) || []).length, demos.length, 'All research previews');
for (const demo of demos) {
  assert(html.get('demos').includes(`id="demo-${demo.id}"`), `Missing demo ${demo.id}`);
  if (demo.video) {
    assert(demo.poster, `Video ${demo.id} needs a poster`);
    assert(html.get('demos').includes(`src="${demo.video}"`), `Missing playable video ${demo.id}`);
  }
}
assert.equal((html.get('demos').match(/data-preview-video loop muted playsinline/g) || []).length, demos.filter(demo => demo.video).length, 'Video previews loop silently inline');
assert(html.get('demos').includes('id="demo-scene"'), 'Live experiment is present');
const fixture = parseBibliography('@article{test, title={A {nested} title}, author="A and B", year=2026, pdf={https://example.com/a}}');
assert.equal(fixture[0].fields.title, 'A {nested} title');
assert.throws(() => parseBibliography('@article{bad,title={unclosed'), /Unclosed/);
for (const file of await readdir(path.join(root, 'assets/studio'))) if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', path.join(root, 'assets/studio', file)]);
for (const file of ['home.js', 'demos.js', 'pigment.js', 'site.js']) {
  const source = await readFile(path.join(output, 'assets/studio', file), 'utf8');
  for (const match of source.matchAll(/(?:from\s*|import\()['"]([.][^'"]+)['"]/g)) await access(path.resolve(output, 'assets/studio', match[1]));
}
console.log(`Verified ${routes.length} routes, ${entries.length} complete publications, ${demos.length} demos, ${links} local URLs, and browser module syntax/imports.`);
