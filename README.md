# Quilotoa

Static holding page for **quilotoa.co.uk**, served by GitHub Pages.

No build step, no dependencies. Everything in the repo root is published as-is.

## Contents

| Path | Purpose |
| --- | --- |
| `index.html` | The landing page. All CSS and the brand mark are inline, so the page is a single request. |
| `404.html` | Branded not-found page. GitHub Pages picks this up automatically. |
| `fonts/` | Jost, self-hosted (SIL Open Font License 1.1). Latin and Latin-Extended subsets, variable 300-400. |
| `quilotoa-icon.png` | The brand mark, and the source every other image is generated from. Replace this one file and rebuild. |
| `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png` | Raster icons, mark on the brand dark ground. |
| `og-image.png` | 1200x630 social share card. |
| `tools/og-card.html`, `tools/icon.html` | Source layouts for the card and the icons. |
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

Needs Playwright's Chromium. Run this after replacing `quilotoa-icon.png` or
editing either layout in `tools/`.

The icons put the mark on the brand dark ground (`#0B1A23`). The mark was drawn
for light backgrounds, so at 16-32px the peaks lose some separation from the
ground while the sun and lake still carry recognition. If tab legibility ever
matters more than theme consistency, change the `background` in
`tools/icon.html` to `#F4F7F8` and rebuild.

## Outstanding

- `quilotoa-icon.png` is 322x280. The page draws it 156px wide, which is fine
  at 1x and 2x but below native density on 3x phone screens. A larger export,
  or an SVG of the mark, would render sharper at no extra weight.
- The meta description and Open Graph copy are placeholders pending positioning.
