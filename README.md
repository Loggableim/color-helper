# Color Helper

Free color tools for designers, developers and creators.

Browser-based color utilities. No uploads. No tracking. Just fast, reliable tools.

## Tech Stack

- **Astro 5** — Static site generation
- **React 19** — Interactive tool components
- **TypeScript** — Type-safe code throughout
- **CSS Custom Properties** — Design token system

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

## Preview

```bash
npm run preview
```

Serve the built site locally.

## Tools

| Tool | Route | Description |
|------|-------|-------------|
| Color Picker | `/color-picker/` | Interactive color picker with HEX/RGB/HSL |
| Image Color Picker | `/image-color-picker/` | Extract colors from any image |
| HEX to RGB | `/hex-to-rgb/` | Convert hex codes to RGB |
| RGB to HEX | `/rgb-to-hex/` | Convert RGB values to hex |
| Color Palette Generator | `/color-palette-generator/` | Generate complementary, analogous, triadic palettes |
| Contrast Checker | `/contrast-checker/` | WCAG accessibility contrast ratios |
| Gradient Generator | `/gradient-generator/` | Create CSS gradients |
| Paint Color Matching Guide | `/paint-color-matching/` | Guide on paint color matching |

## Project Structure

```
src/
├── components/        # Reusable Astro + React components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── ToolLayout.astro
│   ├── ToolCard.astro
│   ├── FAQ.astro
│   ├── Breadcrumbs.astro
│   ├── ColorPicker.tsx         # React (client)
│   ├── ImageColorPicker.tsx    # React (client)
│   ├── HexToRgb.tsx            # React (client)
│   ├── RgbToHex.tsx            # React (client)
│   ├── PaletteGenerator.tsx    # React (client)
│   ├── ContrastChecker.tsx     # React (client)
│   └── GradientGenerator.tsx   # React (client)
├── layouts/
│   └── BaseLayout.astro        # Base HTML layout with SEO
├── pages/
│   ├── index.astro             # Homepage
│   ├── color-picker.astro
│   ├── image-color-picker.astro
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
    └── color.ts                # Color conversion & palette utilities
```

## Deployment

### Cloudflare Pages

1. Build: `npm run build`
2. Deploy `dist/` directory
3. Set build command: `npm run build`
4. Set build output: `dist`

### Netlify

1. Connect repo
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel

1. Import project (auto-detects Astro)
2. Deploy (no additional config needed)

## Color Utilities

All color functions are in `src/utils/color.ts`:

- `normalizeHex()` / `isValidHex()`
- `hexToRgb()` / `rgbToHex()` / `rgbToHsl()` / `hslToRgb()`
- `getRelativeLuminance()` / `getContrastRatio()`
- `meetsWcagAA()` / `meetsWcagAAA()`
- `generateComplementaryPalette()` / `generateAnalogousPalette()` / `generateTriadicPalette()`
- `generateMonochromePalette()` / `generateTintsAndShades()`
- `copyToClipboard()`
- `clampRgb()`

## License

MIT — free to use, modify, and deploy.

## Disclaimer

Color Helper is an independent color utility website. It is not affiliated with any former Color Savvy products or companies.
