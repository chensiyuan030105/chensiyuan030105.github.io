# Siyuan Chen — Interactive Portfolio

A static academic website with an interactive, reflective torus-knot landing scene,
a searchable publication archive, an About page, and a dedicated Demo gallery.
The visual direction is inspired by [Zhecheng Wang's homepage](https://www.dgp.toronto.edu/~zhecheng/).
The frontend and knot interactions are independently implemented with Three.js.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. Re-run `npm run build` after changing source files.
`npm run preview` serves an existing build. `npm run check` verifies generated
routes, links, images, bibliography completeness, and JavaScript syntax.

## Edit content

- `studio/`: page templates and shared layout. The routes are `/`, `/publications/`, `/demos/`, and `/about/`.
- `_bibliography/papers.bib`: the original bibliography, still the source of all publications.
- `_data/news.yml`: the original news feed, shown on About.
- `_data/demos.yml`: research demos. Add a thumbnail filename, description, paper URL, and optional project URL here.
- `assets/studio/`: styles and browser modules. `knot.js` implements the interactive geometry and material.
- `assets/img/` and `assets/pdf/cv.pdf`: original images and CV, preserved.
- `scripts/build.mjs`: static build. It copies Three.js locally; no CDN is required at runtime.

The GitHub Pages workflow now builds the static site with Node.js and deploys
`_site/`. Earlier Jekyll templates remain in the repository for reference; they
are not part of the new build. No Ruby installation is needed.

## Interactions

Hold the landing-page button with a pointer, Enter, or Space to morph a septafoil
through progressively simpler knots into a circle. Release to pause; activate
“Tie it again” to reset. This is a visual homotopy with self-intersections, not
a topology-preserving physical untangling simulation. Mouse movement changes the
viewpoint. Light/dark theme is remembered locally.

The Demos page includes a working knot experiment (drag, winding, speed, pause,
reset) and six previews using the actual research GIFs. These GIFs are recorded
results, distinct from the browser's live geometry experiment. Dialogs support
Escape, focus trapping, and return focus. Reduced-motion preferences disable
automatic rotation and the traveling highlight; explicit controls still work.

## Licensing

MIT, with legacy portions from David Lindell and al-folio. Original license
retained in `LICENSE`. Three.js's MIT license is copied into the output at
`assets/vendor/THREE-LICENSE.txt`. Michroma is distributed under the SIL Open
Font License in `assets/studio/fonts/OFL-Michroma.txt`.
