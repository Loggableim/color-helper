/* ===== Color Helper - Color Utilities ===== */

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };
export type Palette = { name: string; colors: string[] };

/** Normalisiert einen HEX-Wert: #fff → #ffffff, optional # entfernen */
export function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  if (h.length === 6 && /^[0-9a-fA-F]+$/.test(h)) {
    return '#' + h.toLowerCase();
  }
  return hex;
}

export function isValidHex(hex: string): boolean {
  const h = hex.trim().replace(/^#/, '');
  if (h.length !== 3 && h.length !== 6) return false;
  return /^[0-9a-fA-F]+$/.test(h);
}

export function hexToRgb(hex: string): RGB | null {
  try {
    const h = normalizeHex(hex);
    const val = h.replace('#', '');
    return {
      r: parseInt(val.substring(0, 2), 16),
      g: parseInt(val.substring(2, 4), 16),
      b: parseInt(val.substring(4, 6), 16),
    };
  } catch {
    return null;
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  return `#${[r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const diff = max - min;
  let h = 0, s = 0, l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch (max) {
      case rr: h = ((gg - bb) / diff + (gg < bb ? 6 : 0)) * 60; break;
      case gg: h = ((bb - rr) / diff + 2) * 60; break;
      case bb: h = ((rr - gg) / diff + 4) * 60; break;
    }
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const ss = s / 100, ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function clampRgb(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const srgb = [r / 255, g / 255, b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round((lighter + 0.05) / (darker + 0.05) * 100) / 100;
}

export function meetsWcagAA(contrastRatio: number, isLargeText: boolean): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

export function meetsWcagAAA(contrastRatio: number, isLargeText: boolean): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
}

/* ===== Palette Generators ===== */

export function generateComplementaryPalette(hex: string): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Complementary', colors: [hex, '#ffffff'] };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const comp = hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l);
  return { name: 'Complementary', colors: [hex, rgbToHex(comp.r, comp.g, comp.b)] };
}

export function generateAnalogousPalette(hex: string): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Analogous', colors: [hex] };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const c1 = hslToRgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l);
  const c2 = hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l);
  return {
    name: 'Analogous',
    colors: [rgbToHex(c1.r, c1.g, c1.b), hex, rgbToHex(c2.r, c2.g, c2.b)],
  };
}

export function generateTriadicPalette(hex: string): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Triadic', colors: [hex] };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const c1 = hslToRgb((hsl.h + 120) % 360, hsl.s, hsl.l);
  const c2 = hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l);
  return {
    name: 'Triadic',
    colors: [hex, rgbToHex(c1.r, c1.g, c1.b), rgbToHex(c2.r, c2.g, c2.b)],
  };
}

export function generateMonochromePalette(hex: string, steps: number = 5): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Monochromatic', colors: [hex] };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const lightness = Math.round(10 + (80 / (steps - 1)) * i);
    const c = hslToRgb(hsl.h, hsl.s, lightness);
    colors.push(rgbToHex(c.r, c.g, c.b));
  }
  return { name: 'Monochromatic', colors };
}

export function generateSplitComplementaryPalette(hex: string): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Split Complementary', colors: [hex, '#ffffff', '#cccccc'] };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const comp = (hsl.h + 180) % 360;
  const split1 = hslToRgb((comp - 30 + 360) % 360, hsl.s, hsl.l);
  const split2 = hslToRgb((comp + 30) % 360, hsl.s, hsl.l);
  return {
    name: 'Split Complementary',
    colors: [hex, rgbToHex(split1.r, split1.g, split1.b), rgbToHex(split2.r, split2.g, split2.b)],
  };
}

export function generateTetradicPalette(hex: string): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Tetradic', colors: [hex, '#ffffff', '#cccccc', '#999999'] };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const c1 = hslToRgb((hsl.h + 60) % 360, hsl.s, hsl.l);
  const c2 = hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l);
  const c3 = hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l);
  return {
    name: 'Tetradic',
    colors: [hex, rgbToHex(c1.r, c1.g, c1.b), rgbToHex(c2.r, c2.g, c2.b), rgbToHex(c3.r, c3.g, c3.b)],
  };
}

export function generateTintsPalette(hex: string, steps: number = 5): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Tints', colors: [hex] };
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const mix = (i + 1) / (steps + 1);
    const c = {
      r: Math.round(rgb.r + (255 - rgb.r) * mix),
      g: Math.round(rgb.g + (255 - rgb.g) * mix),
      b: Math.round(rgb.b + (255 - rgb.b) * mix),
    };
    colors.push(rgbToHex(c.r, c.g, c.b));
  }
  return { name: 'Tints', colors };
}

export function generateShadesPalette(hex: string, steps: number = 5): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Shades', colors: [hex] };
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const mix = (i + 1) / (steps + 1);
    const c = {
      r: Math.round(rgb.r * (1 - mix)),
      g: Math.round(rgb.g * (1 - mix)),
      b: Math.round(rgb.b * (1 - mix)),
    };
    colors.push(rgbToHex(c.r, c.g, c.b));
  }
  return { name: 'Shades', colors };
}

export function generateTintsAndShades(hex: string, steps: number = 9): Palette {
  const rgb = hexToRgb(hex);
  if (!rgb) return { name: 'Tints & Shades', colors: [hex] };
  const colors: string[] = [];
  const mid = Math.floor(steps / 2);
  for (let i = 0; i < steps; i++) {
    const t = (i - mid) / mid; // -1 to +1
    if (t < 0) {
      // tint: mix with white
      const mix = Math.abs(t);
      const c = {
        r: Math.round(rgb.r + (255 - rgb.r) * mix),
        g: Math.round(rgb.g + (255 - rgb.g) * mix),
        b: Math.round(rgb.b + (255 - rgb.b) * mix),
      };
      colors.push(rgbToHex(c.r, c.g, c.b));
    } else if (t === 0) {
      colors.push(hex);
    } else {
      // shade: mix with black
      const mix = t;
      const c = {
        r: Math.round(rgb.r * (1 - mix)),
        g: Math.round(rgb.g * (1 - mix)),
        b: Math.round(rgb.b * (1 - mix)),
      };
      colors.push(rgbToHex(c.r, c.g, c.b));
    }
  }
  return { name: 'Tints & Shades', colors };
}

/* Copy to clipboard helper */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}
