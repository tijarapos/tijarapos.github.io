# tijarapos.github.io

Homepage for Tijara POS, served by GitHub Pages at https://tijarapos.github.io.

Plain HTML, CSS and JavaScript; no build step. Edit `index.html`, `styles.css` and `main.js`, push to
`main`, and Pages publishes within a minute.

- Download buttons read the latest published release of
  [AhsanRao/tijara-pos-releases](https://github.com/AhsanRao/tijara-pos-releases) through the GitHub
  API and fall back to its releases page.
- Screenshots in `assets/shots/` come from the demo shop (`pnpm seed` in the app repo).
- Preview locally: `python3 -m http.server 8765`, then open http://localhost:8765.
- `.nojekyll` makes Pages serve the files as they are.
