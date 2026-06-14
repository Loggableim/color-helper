#!/usr/bin/env node
/**
 * build-og-images.mjs
 * ────────────────────────────────────────────────────────────
 * Generiert Open-Graph-Images (1200×630) für color-helper.com.
 * Läuft zur Build-Zeit VOR Astro (siehe package.json prebuild).
 *
 * Output:
 *   public/og/default.png        — apex/Default
 *   public/og/colors/<slug>.png  — pro Farbseite (140 Stück)
 *
 * Stack: satori (HTML→SVG) + @resvg/resvg-js (SVG→PNG)
 * Fonts: Inter (TTF, aus scripts/assets/)
 *
 * Warum satori statt puppeteer/playwright:
 *   - Kein Chromium-Download (~100MB gespart)
 *   - Funktioniert in CF-Pages CI ohne extra Deps
 *   - Schneller (~50ms pro Image)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'og');
const COLORS_DIR = join(OUT_DIR, 'colors');

// ─── Fonts laden ────────────────────────────────────────────
const FONT_DIR = join(__dirname, 'assets');
function loadFont(weight) {
  const filename = weight === 400 ? 'Inter-Regular.ttf' : 'Inter-SemiBold.ttf';
  const p = join(FONT_DIR, filename);
  if (!existsSync(p)) {
    throw new Error(`Font not found: ${p}. Run: curl fonts.gstatic.com to scripts/assets/`);
  }
  return readFileSync(p);
}

const fonts = [
  { name: 'Inter', data: loadFont(400), weight: 400, style: 'normal' },
  { name: 'Inter', data: loadFont(600), weight: 600, style: 'normal' },
];

// ─── Helpers ────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function luminance({ r, g, b }) {
  // WCAG relative luminance
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function bestTextColor(bgHex) {
  return luminance(hexToRgb(bgHex)) > 0.5 ? '#111827' : '#f9fafb';
}

function mixColors(c1, c2, t) {
  return {
    r: Math.round(c1.r * (1 - t) + c2.r * t),
    g: Math.round(c1.g * (1 - t) + c2.g * t),
    b: Math.round(c1.b * (1 - t) + c2.b * t),
  };
}

async function renderPng(svgString, width = 1200, height = 630) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: width },
    background: 'transparent',
    font: { loadSystemFonts: false },
  });
  const rendered = resvg.render();
  // PNG mit Kompression + Palette für kleinere Files
  return rendered.asPng({
    palette: {
      enabled: true,
      maxColors: 256, // 8-bit indexed color
    },
  });
}

// ─── Templates ──────────────────────────────────────────────
function defaultTemplate() {
  // Brand-default OG-Image (apex, about, contact, etc.)
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
        padding: '80px',
        color: 'white',
        fontFamily: 'Inter',
        position: 'relative',
      },
      children: [
        // Logo + Brand
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              fontSize: '36px',
              fontWeight: 600,
              opacity: 0.95,
            },
            children: '🎨 Color Helper',
          },
        },
        // Spacer
        { type: 'div', props: { style: { height: '40px' } } },
        // Headline
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '76px',
              fontWeight: 800,
              lineHeight: 1.1,
              maxWidth: '1000px',
            },
            children: 'Free Color Tools for Designers & Developers',
          },
        },
        // Spacer
        { type: 'div', props: { style: { flex: 1 } } },
        // Bottom bar: URL + tagline
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              fontSize: '28px',
              fontWeight: 400,
              opacity: 0.85,
            },
            children: [
              { type: 'div', props: { children: 'color-helper.com' } },
              { type: 'div', props: { children: 'Pick • Convert • Generate' } },
            ],
          },
        },
      ],
    },
  };
}

function colorTemplate({ name, hex, category }) {
  const bgRgb = hexToRgb(hex);
  const textColor = bestTextColor(hex);
  // Accent: mix bg with white 30% (lighter) or black 30% (darker)
  const accent = luminance(bgRgb) > 0.5
    ? rgbToHex(mixColors(bgRgb, { r: 0, g: 0, b: 0 }, 0.25))
    : rgbToHex(mixColors(bgRgb, { r: 255, g: 255, b: 255 }, 0.25));

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        background: hex,
        color: textColor,
        fontFamily: 'Inter',
        position: 'relative',
      },
      children: [
        // Color-swatch-Pattern (subtle dots, 10x6 grid)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexWrap: 'wrap',
              opacity: 0.08,
            },
            children: Array.from({ length: 60 }, () => ({
              type: 'div',
              props: {
                style: {
                  width: '120px',
                  height: '105px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '60px',
                  color: textColor,
                },
                children: '●',
              },
            })),
          },
        },
        // Top bar: Brand
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '60px',
              left: '80px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '28px',
              fontWeight: 600,
              opacity: 0.85,
              color: textColor,
            },
            children: '🎨 Color Helper',
          },
        },
        // Center content
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 80px',
            },
            children: [
              // Category badge
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '24px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                    opacity: 0.7,
                    marginBottom: '24px',
                    color: textColor,
                  },
                  children: category,
                },
              },
              // Color name (huge)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '160px',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: textColor,
                    marginBottom: '16px',
                  },
                  children: name,
                },
              },
              // Hex code
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    marginTop: '24px',
                  },
                  children: [
                    // Color preview pill
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          background: accent,
                          border: `4px solid ${textColor}`,
                          display: 'flex',
                        },
                      },
                    },
                    // Hex text
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontSize: '64px',
                          fontWeight: 600,
                          fontFamily: 'Inter',
                          letterSpacing: '4px',
                          color: textColor,
                        },
                        children: hex.toUpperCase(),
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Bottom: URL
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: '60px',
              right: '80px',
              display: 'flex',
              fontSize: '24px',
              fontWeight: 500,
              opacity: 0.7,
              color: textColor,
            },
            children: `color-helper.com/colors/${name.toLowerCase().replace(/\s+/g, '-')}/`,
          },
        },
      ],
    },
  };
}

// ─── Color-Daten laden (TS-File parsen, simple regex) ──────
function loadColors() {
  const tsPath = join(ROOT, 'src', 'data', 'colors.ts');
  const src = readFileSync(tsPath, 'utf-8');

  // Match: { name: 'X', slug: 'x', hex: '#RRGGBB', category: 'X', ... }
  const re = /\{\s*name:\s*'([^']+)'\s*,\s*slug:\s*'([^']+)'\s*,\s*hex:\s*'(#[0-9a-fA-F]{6})'\s*,\s*category:\s*'([^']+)'/g;
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push({ name: m[1], slug: m[2], hex: m[3].toLowerCase(), category: m[4] });
  }
  if (out.length === 0) {
    throw new Error('No colors parsed from colors.ts — pattern mismatch?');
  }
  return out;
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log('▸ build-og-images: starting…');
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(COLORS_DIR, { recursive: true });

  // 1) Default OG-Image
  console.log('  ▸ default.png…');
  const defSvg = await satori(defaultTemplate(), { width: 1200, height: 630, fonts });
  writeFileSync(join(OUT_DIR, 'default.png'), await renderPng(defSvg));
  console.log('    ✓ default.png');

  // 2) Color OG-Images
  const colors = loadColors();
  console.log(`  ▸ colors: ${colors.length} entries`);

  const start = Date.now();
  let ok = 0, fail = 0;
  // Seriell statt Promise.all: satori yielet intern, Resvg nutzt Multi-Threading
  // und ein parallel gestarteter Build kann in GH-Action wegen Dateisystem-Race
  // fehlschlagen. Sequentiell ist langsamer (~6s → ~10s) aber zuverlässig.
  for (const c of colors) {
    try {
      const svg = await satori(colorTemplate(c), { width: 1200, height: 630, fonts });
      const png = await renderPng(svg);
      writeFileSync(join(COLORS_DIR, `${c.slug}.png`), png);
      ok++;
    } catch (e) {
      fail++;
      console.error(`    ✗ ${c.slug}: ${e.message}`);
    }
  }
  const dt = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  ✓ colors: ${ok} ok, ${fail} fail, ${dt}s`);

  // 3) Stats
  const total = ok + 1; // +1 default
  const sampleSize = 12; // KB
  const defSize = Math.round(readFileSync(join(OUT_DIR, 'default.png')).length / 1024);
  const sample = readFileSync(join(COLORS_DIR, `${colors[0].slug}.png`)).length / 1024;
  console.log(`\n  Generated ${total} OG-Images`);
  console.log(`  Sizes: default.png ~${defSize}KB, color ~${Math.round(sample)}KB`);
  console.log('▸ done.\n');
}

main().catch(e => { console.error(e); process.exit(1); });
