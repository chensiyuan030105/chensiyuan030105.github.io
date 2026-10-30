# Siyuan Chen — Interactive Portfolio

A static academic website with an interactive fluid-field identity on the landing page,
a searchable publication archive, an About page, and a dedicated Demo gallery.
The landing page uses an independent editorial layout and a cyan/amber flow palette.
Canvas particles follow a procedural vortex field before converging into SIYUAN CHEN.
This is an artistic flow visualization, not a numerical fluid solver. The Demos page includes a browser-native stable-fluids pigment experiment.

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
- `_data/thumbnail_sources.yml`: source PDF pages and figure selections for the cropped paper thumbnails (all from pages after the first).
- `_data/news.yml`: the original news feed, shown on About.
- `_data/demos.yml`: research demos. Add a thumbnail filename, description, paper URL, and optional project URL here.
- `assets/studio/`: styles and browser modules. `home.js` implements the fluid identity; `pigment.js` implements the interactive dye simulation.
- `assets/img/` and `assets/pdf/cv.pdf`: original images and CV, preserved.
- `scripts/build.mjs`: static build. It copies Three.js locally; no CDN is required at runtime.

The GitHub Pages workflow now builds the static site with Node.js and deploys
`_site/`. Earlier Jekyll templates remain in the repository for reference; they
are not part of the new build. No Ruby installation is needed.

## Interactions

The homepage begins with a moving vortex field. After eight seconds it starts
converging into a two-line particle signature, SIYUAN CHEN. “Form my name” starts
the transition early; “Release the current” restarts it. Pointer movement displaces
the current. Pause/Resume, light/dark mode, responsive canvas sampling, and
reduced-motion preferences are supported; reduced-motion opens on the signature.

The Demos page includes a live pigment fluid experiment, inspired by Taichi's
Stable Fluids example. The independent JavaScript CPU solver uses semi-Lagrangian
advection, 18 Jacobi pressure iterations, and vorticity confinement. Drag or use
the arrow/Space keys to inject dye, choose a color, adjust brush radius/vorticity,
pause, and reset. It pauses offscreen and respects reduced-motion preferences.
The research gallery retains eight previews. Four use H.264 MP4 with looping,
silent, inline playback; other previews retain the original research GIFs.
Video cards load only while visible and pause offscreen.
Expanded videos have native playback/seeking controls and a download link.
These are recorded results, distinct from the browser's live geometry experiment. Dialogs support
Escape, focus trapping, and return focus. Reduced-motion preferences pause the fluid simulation; explicit painting controls still work.

## Licensing

MIT, with legacy portions from David Lindell and al-folio. Original license
retained in `LICENSE`. Three.js's MIT license is copied into the output at
`assets/vendor/THREE-LICENSE.txt`. All webpage typography uses locally served
Linux Biolinum (regular, bold, italic), converted from the OpenType originals
in TeX Live's Libertine package. Its license and GPL font exception are retained
in `assets/studio/fonts/LinuxBiolinum-LICENCE.txt` and `LinuxBiolinum-GPL.txt`.

## Video sources

- Subspace Fluids: `3MtPZ-papers_179s2-yaml8_video.mp4`, 01:00–01:07, Ground Truth/DMD comparison.
- Efficient Open-Boundary Poisson Solves: `haQua-papers_1946s2-yaml7_video.mp4`, 00:31–00:44, ferrofluid comparison.
- From Surfaces to Volumes: `ligand_classification.gif`, full 8.5-second animation.
- Gauss–Seidel: all 144 frames of `ICLR2026gsproj.gif`, normalized to 24 fps (6 seconds). The original GIF has no repeat extension, so video loop playback fixes its stopped preview.

MP4s are silent, use broadly supported H.264/yuv420p, and have their metadata at
the front for quick playback. Source videos were not uploaded in full. Posters
are representative frames from the same source clips.
