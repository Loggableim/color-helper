/* ===== Color Helper - Tailwind-style Color Scale Generator ===== */

export interface ScaleStep {
  name: string;
  hex: string;
  luminance: number;
}

/**
 * Generates a Tailwind CSS v3/v4-style color scale (50–950) from a base hex color.
 * Uses HSL manipulation to create perceptually uniform steps.
 */
export function generateTailwindScale(baseHex: string): ScaleStep[] {
  // Normalize
  const hex = normalizeHex(baseHex);
  const rgb = hexToRgb(hex);
  if (!rgb) return [];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // The scale definitions: which lightness % for each step
  // Tailwind v3 uses these targets for the 'base' saturation at L=50%
  const steps: { name: string; targetL: number; satMul: number }[] = [
    { name: '50',  targetL: 97, satMul: 0.15 },
    { name: '100', targetL: 92, satMul: 0.25 },
    { name: '200', targetL: 84, satMul: 0.40 },
    { name: '300', targetL: 74, satMul: 0.55 },
    { name: '400', targetL: 62, satMul: 0.70 },
    { name: '500', targetL: 50, satMul: 0.85 },
    { name: '600', targetL: 40, satMul: 0.80 },
    { name: '700', targetL: 30, satMul: 0.75 },
    { name: '800', targetL: 22, satMul: 0.70 },
    { name: '900', targetL: 14, satMul: 0.60 },
    { name: '950', targetL: 8,  satMul: 0.50 },
  ];

  // Determine the base hue and saturation adjusted for the base color
  // Find which step the base color is closest to, then derive saturation
  let baseSaturation = hsl.s;
  let baseHue = hsl.h;

  // For very low saturation colors (grays), keep saturation low across all steps
  const isNeutral = baseSaturation < 15;
  if (isNeutral) {
    baseSaturation = 0;
  }

  return steps.map((step) => {
    // Calculate lightness
    let lightness = step.targetL;

    // For the base color (around L=50), interpolate saturation
    let saturation: number;
    if (isNeutral) {
      saturation = 0;
    } else {
      // Scale saturation: higher at middle steps, lower at extremes
      saturation = Math.round(baseSaturation * step.satMul);
      // Ensure minimum saturation for chromatic colors
      if (step.targetL >= 50) {
        saturation = Math.max(saturation, Math.round(baseSaturation * 0.15));
      }
      // Ensure we don't oversaturate dark steps
      saturation = Math.min(saturation, baseSaturation);
    }

    // Clamp
    saturation = Math.min(100, Math.max(0, saturation));
    lightness = Math.min(100, Math.max(0, lightness));

    const stepRgb = hslToRgb(baseHue, saturation, lightness);
    const stepHex = rgbToHex(stepRgb.r, stepRgb.g, stepRgb.b);
    const luminance = getRelativeLuminance(stepRgb.r, stepRgb.g, stepRgb.b);

    return {
      name: step.name,
      hex: stepHex,
      luminance,
    };
  });
}

/* ---- Color helpers (local copies to avoid circular deps) ---- */

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return '#' + h.toLowerCase();
}

function hexToRgb(hex: string): RGB | null {
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

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  return `#${[r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(r: number, g: number, b: number): HSL {
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

function hslToRgb(h: number, s: number, l: number): RGB {
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

function getRelativeLuminance(r: number, g: number, b: number): number {
  const srgb = [r / 255, g / 255, b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/* ---- Public helpers ---- */

export function textColorForBg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.5 ? '#111111' : '#f0f0f0';
}
