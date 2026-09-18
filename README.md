# Quilotoa

Static holding page for **quilotoa.co.uk**, served by GitHub Pages.

No build step, no dependencies. Everything in the repo root is published as-is.

## Contents

| Path | Purpose |
| --- | --- |
| `index.html` | The landing page. All CSS and the brand mark are inline, so the page is a single request. |
| `404.html` | Branded not-found page. GitHub Pages picks this up automatically. |
| `fonts/` | Jost, self-hosted (SIL Open Font License 1.1). Latin and Latin-Extended subsets, variable 300-400. |
| `quilotoa-mark.svg` | Canonical brand mark. The page inlines a copy of this to avoid a second request; edit both together. |
| `favicon.svg` | Simplified mark for favicon use, legible at 16px. |
| `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png` | Raster icons generated from `favicon.svg`. |
| `og-image.png` | 1200x630 social share card. |
| `tools/og-card.html` | Source layout for the share card. |
| `tools/build-assets.mjs` | Regenerates the PNGs above. |
| `CNAME` | Custom domain for GitHub Pages. |
| `.nojekyll` | Skips Jekyll processing; files are served verbatim. |
| `robots.txt`, `sitemap.xml` | Crawler basics. |

## Local preview

```bash
python3 -m http.server 8899      # then open http://127.0.0.1:8899
```

Use a server rather than opening `index.html` from disk. Browsers block webfont
loads over `file://`, so the page falls back to Helvetica and looks wrong.

## Publishing

1. **Settings → Pages → Build and deployment**: source *Deploy from a branch*,
   branch `main`, folder `/ (root)`.
2. The `CNAME` file already sets the custom domain to `quilotoa.co.uk`, so the
   domain field should populate on its own.
3. Point DNS at GitHub. For the apex domain, four `A` records:

   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   Optionally the matching `AAAA` records for IPv6:

   ```
   2606:50c0:8000::153
   2606:50c0:8001::153
   2606:50c0:8002::153
   2606:50c0:8003::153
   ```

   And a `CNAME` for `www` pointing at `ilexlycalopex.github.io`.

   Confirm these against GitHub's current documentation before you commit the
   change at the registrar.
4. Wait for the DNS check to pass, then tick **Enforce HTTPS**. The certificate
   is issued automatically and can take up to an hour.

## Regenerating assets

```bash
python3 -m http.server 8899 &
node tools/build-assets.mjs
```

Needs Playwright's Chromium. Run this after any change to `favicon.svg` or
`tools/og-card.html`.

## Outstanding

- `quilotoa-icon.png` referenced by the original design was not supplied. The
  page ships a placeholder crater mark; see the comment in `index.html` for the
  one-line swap once the real artwork exists.
- The meta description and Open Graph copy are placeholders pending positioning.
