# Color Helper

Free color tools for designers, developers and creators.

Browser-based color utilities. No uploads. No tracking. Just fast, reliable tools.

**Live:** [color-helper.com](https://color-helper.com) (coming soon)  
**GitHub:** [github.com/Loggableim/color-helper](https://github.com/Loggableim/color-helper)

---

## Features

- **Color Picker** — Interactive picker with HEX, RGB, HSL inputs and live preview. Save colors to a local palette.
- **Image Color Picker** — Upload any image, click to extract colors, auto-detect dominant palette.
- **Color Converter** — Auto-detect HEX, RGB, or HSL input and convert between all formats.
- **HEX to RGB** / **RGB to HEX** — Dedicated converters with validation and examples.
- **Color Palette Generator** — Generate complementary, analogous, triadic, monochromatic, and tints/shades palettes. Export as CSS variables or JSON.
- **Contrast Checker** — WCAG AA/AAA compliance checker with live preview and accessible color suggestions.
- **Gradient Generator** — Multi-stop CSS gradient generator with live preview and direction controls.
- **Paint Color Matching Guide** — Educational guide on how paint color matching works.
- **Privacy-first** — All image processing is local in your browser. Nothing is uploaded.

## Tech Stack

- **Astro 5** — Static site generation
- **React 19** — Interactive tool components (`client:load`)
- **TypeScript** — Type-safe throughout
- **CSS Custom Properties** — Full design token system
- **Cloudflare Pages** — Deployment platform

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the dev server at `http://localhost:4321`.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Preview Production Build

```bash
npm run preview
```

Serves the built `dist/` folder locally.

## Project Structure

```
src/
├── components/           # Asto + React components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── ToolLayout.astro
│   ├── ToolCard.astro
│   ├── FAQ.astro
│   ├── Breadcrumbs.astro
│   ├── ColorPicker.tsx
│   ├── ImageColorPicker.tsx
│   ├── HexToRgb.tsx
│   ├── RgbToHex.tsx
│   ├── PaletteGenerator.tsx
│   ├── ContrastChecker.tsx
│   └── GradientGenerator.tsx
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   ├── index.astro
│   ├── color-picker.astro
│   ├── image-color-picker.astro
│   ├── color-converter.astro
│   ├── hex-to-rgb.astro
│   ├── rgb-to-hex.astro
│   ├── color-palette-generator.astro
│   ├── contrast-checker.astro
│   ├── gradient-generator.astro
│   ├── paint-color-matching.astro
│   ├── about.astro
│   ├── privacy.astro
│   ├── contact.astro
│   └── 404.astro
├── styles/
│   └── global.css
└── utils/
    └── color.ts
```

## Pages

| Page | Route | Type |
|------|-------|------|
| Home | `/` | Landing + tool overview |
| Color Picker | `/color-picker/` | Interactive tool |
| Image Color Picker | `/image-color-picker/` | Interactive tool |
| Color Converter | `/color-converter/` | Interactive tool (auto-detect) |
| HEX to RGB | `/hex-to-rgb/` | Interactive tool |
| RGB to HEX | `/rgb-to-hex/` | Interactive tool |
| Palette Generator | `/color-palette-generator/` | Interactive tool |
| Contrast Checker | `/contrast-checker/` | Interactive tool |
| Gradient Generator | `/gradient-generator/` | Interactive tool |
| Paint Color Matching | `/paint-color-matching/` | Guide |
| About | `/about/` | Content |
| Privacy | `/privacy/` | Content |
| Contact | `/contact/` | Content |
| 404 | `/404/` | Error page |

## SEO

- Unique meta titles and descriptions per page
- OpenGraph tags (title, description, URL)
- Canonical URLs
- JSON-LD schemas: `WebSite`, `WebApplication` (tools), `FAQPage` (where applicable)
- `sitemap-index.xml` (auto-generated via `@astrojs/sitemap`)
- `robots.txt`
- Internal cross-linking between related tools
- Semantic HTML with proper heading hierarchy

## Accessibility

- Visible focus states on all interactive elements
- Keyboard-navigable tools (Tab, Enter, Space)
- `aria-label` on all inputs and buttons
- `aria-live` regions for dynamic content (copy toasts)
- `aria-invalid` on validation errors
- `prefers-reduced-motion` support via CSS
- WCAG-compliant UI contrast ratios
- Skip-to-content link
- Semantic landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`)

## Color Utilities (`src/utils/color.ts`)

- `normalizeHex()` / `isValidHex()`
- `hexToRgb()` / `rgbToHex()` / `rgbToHsl()` / `hslToRgb()`
- `getRelativeLuminance()` / `getContrastRatio()`
- `meetsWcagAA()` / `meetsWcagAAA()`
- `generateComplementaryPalette()` / `generateAnalogousPalette()` / `generateTriadicPalette()`
- `generateMonochromePalette()` / `generateTintsAndShades()`
- `copyToClipboard()` / `clampRgb()`

## Deployment

### Cloudflare Pages

1. Connect GitHub repo `Loggableim/color-helper` in Cloudflare Dashboard
2. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: 20+ (not 24, known CSPRNG issues on Windows VMs)

### Manual via Wrangler CLI

```bash
npm install -g wrangler
wrangler login
npx wrangler pages deploy dist/ --project-name=color-helper
```

Then set custom domain in Cloudflare Dashboard → Pages → color-helper → Custom domains → `color-helper.com`.

### DNS (Porkbun → Cloudflare)

1. In Porkbun DNS: Set NS records to Cloudflare nameservers
2. Or add a CNAME record: `@` → `color-helper.pages.dev`

## Privacy

- **No image uploads** — All image processing happens in-browser via Canvas API
- **No analytics** — MVP has no tracking scripts
- **No account required** — All tools are immediately accessible
- **localStorage only** — Saved palettes are stored in your browser's localStorage
- **Google Fonts** — The Inter font is loaded from Google Fonts CDN

## License

MIT — Free to use, modify, and deploy.

## Disclaimer

Color Helper is an independent color utility website. It is not affiliated with any former Color Savvy products or companies.
