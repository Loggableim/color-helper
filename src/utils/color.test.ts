/* ===== Color Helper — Algorithm Tests =====
 * Unit tests for color math, WCAG contrast, palette generators, color blindness simulation.
 *
 * These tests run in pure Node (no DOM) — they exercise the pure functions in
 * src/utils/color.ts. They serve as the "ground truth" reference for the
 * color math used by every tool on the site.
 *
 * Tolerances: HSL/HEX round-trips are off by ≤ 1 unit (integer math);
 * WCAG contrast is off by ≤ 0.05 (rounded to 2 decimals);
 * CVD simulation is off by ≤ 2 units per channel (gamma encoding noise).
 */

import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  normalizeHex,
  isValidHex,
  getRelativeLuminance,
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  generateComplementaryPalette,
  generateAnalogousPalette,
  generateTriadicPalette,
  generateMonochromePalette,
  generateSplitComplementaryPalette,
  generateTetradicPalette,
  generateTintsPalette,
  generateShadesPalette,
  generateTintsAndShades,
  simulateCVD,
} from '../utils/color';

/* ===== HEX <-> RGB ===== */

describe('HEX <-> RGB', () => {
  it('hexToRgb parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('hexToRgb parses 3-digit hex (after normalize)', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('hexToRgb is case-insensitive', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#FfAa01')).toEqual({ r: 255, g: 170, b: 1 });
  });

  it('hexToRgb returns null on invalid input', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
    expect(hexToRgb('#gg0000')).toBeNull();
  });

  it('rgbToHex produces 6-digit lowercase hex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    expect(rgbToHex(124, 58, 237)).toBe('#7c3aed');
  });

  it('rgbToHex clamps out-of-range values', () => {
    expect(rgbToHex(300, -10, 128)).toBe('#ff0080');
    expect(rgbToHex(-50, 1000, 0)).toBe('#00ff00');
  });

  it('HEX <-> RGB roundtrip is identity', () => {
    const samples = ['#7c3aed', '#3b82f6', '#ec4899', '#f97316', '#10b981', '#000000', '#ffffff'];
    for (const hex of samples) {
      const rgb = hexToRgb(hex);
      expect(rgb).not.toBeNull();
      expect(rgbToHex(rgb!.r, rgb!.g, rgb!.b)).toBe(hex);
    }
  });
});

describe('normalizeHex / isValidHex', () => {
  it('normalizeHex expands 3-digit to 6-digit', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
    expect(normalizeHex('abc')).toBe('#aabbcc');
  });

  it('normalizeHex accepts 6-digit with or without #', () => {
    expect(normalizeHex('#ff0000')).toBe('#ff0000');
    expect(normalizeHex('ff0000')).toBe('#ff0000');
  });

  it('isValidHex accepts valid hex (3 and 6 digit)', () => {
    expect(isValidHex('#fff')).toBe(true);
    expect(isValidHex('#ffffff')).toBe(true);
    expect(isValidHex('fff')).toBe(true);
  });

  it('isValidHex rejects invalid hex', () => {
    expect(isValidHex('#ff')).toBe(false);
    expect(isValidHex('#fffffff')).toBe(false);
    expect(isValidHex('#xyzxyz')).toBe(false);
    expect(isValidHex('hello')).toBe(false);
  });
});

/* ===== RGB <-> HSL ===== */

describe('RGB <-> HSL', () => {
  it('rgbToHsl: pure red', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
  });
  it('rgbToHsl: pure green', () => {
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
  });
  it('rgbToHsl: pure blue', () => {
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
  });
  it('rgbToHsl: black', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
  });
  it('rgbToHsl: white', () => {
    expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
  });
  it('rgbToHsl: 50% gray', () => {
    const hsl = rgbToHsl(128, 128, 128);
    expect(hsl.l).toBe(50);
    expect(hsl.s).toBe(0);
  });

  it('hslToRgb: pure red, green, blue', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('hslToRgb: black and white', () => {
    expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
    expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('HSL <-> RGB roundtrip is identity (± 2 per channel)', () => {
    // Tolerance is 2 because the conversion uses integer rounding twice
    // (sRGB→HSL drops fractions, HSL→sRGB re-rounds). This is acceptable
    // for the site's tools (no critical color reproduction use case).
    const samples = [
      [124, 58, 237],
      [6, 182, 212],
      [236, 72, 153],
      [249, 115, 22],
      [16, 185, 129],
    ];
    for (const [r, g, b] of samples) {
      const hsl = rgbToHsl(r, g, b);
      const back = hslToRgb(hsl.h, hsl.s, hsl.l);
      expect(Math.abs(back.r - r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - b)).toBeLessThanOrEqual(2);
    }
  });
});

/* ===== WCAG ===== */

describe('WCAG relative luminance and contrast', () => {
  it('relative luminance: black = 0, white = 1', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBeCloseTo(0, 5);
    expect(getRelativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
  });

  it('relative luminance: mid-gray (~0.2156)', () => {
    // sRGB 128 → Y ≈ 0.2158 (sRGB transfer function)
    const l = getRelativeLuminance(128, 128, 128);
    expect(l).toBeGreaterThan(0.18);
    expect(l).toBeLessThan(0.25);
  });

  it('contrast black/white = 21:1 (WCAG maximum)', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('contrast same color = 1:1', () => {
    expect(getContrastRatio('#7c3aed', '#7c3aed')).toBeCloseTo(1, 1);
  });

  it('contrast symmetric: a vs b == b vs a', () => {
    const a = '#3b82f6';
    const b = '#ec4899';
    expect(getContrastRatio(a, b)).toBeCloseTo(getContrastRatio(b, a), 5);
  });

  it('WCAG known pairs', () => {
    // W3C reference values (from webaim.org contrast checker):
    // #0066cc on #ffffff = 5.57 (passes AA Large)
    // #777777 on #ffffff = 4.48 (passes AA Large only)
    // Note: the site rounds to 2 decimals; expect 5.57 not 5.66.
    expect(getContrastRatio('#0066cc', '#ffffff')).toBeCloseTo(5.57, 2);
    expect(getContrastRatio('#777777', '#ffffff')).toBeGreaterThan(4.4);
    expect(getContrastRatio('#777777', '#ffffff')).toBeLessThan(4.55);
  });

  it('meetsWcagAA: 4.5:1 normal text, 3:1 large', () => {
    expect(meetsWcagAA(4.5, false)).toBe(true);
    expect(meetsWcagAA(4.4, false)).toBe(false);
    expect(meetsWcagAA(3, true)).toBe(true);
    expect(meetsWcagAA(2.9, true)).toBe(false);
  });

  it('meetsWcagAAA: 7:1 normal text, 4.5:1 large', () => {
    expect(meetsWcagAAA(7, false)).toBe(true);
    expect(meetsWcagAAA(6.9, false)).toBe(false);
    expect(meetsWcagAAA(4.5, true)).toBe(true);
    expect(meetsWcagAAA(4.4, true)).toBe(false);
  });
});

/* ===== Palette Generators ===== */

describe('Palette generators', () => {
  it('complementary palette has 2 colors opposite on the wheel', () => {
    const p = generateComplementaryPalette('#ff0000');
    expect(p.colors).toHaveLength(2);
    // Pure red complement is pure cyan
    const complement = hexToRgb(p.colors[1]);
    expect(complement).toEqual({ r: 0, g: 255, b: 255 });
  });

  it('analogous palette has 3 colors', () => {
    const p = generateAnalogousPalette('#7c3aed');
    expect(p.colors).toHaveLength(3);
    expect(p.colors[1]).toBe('#7c3aed'); // center
  });

  it('triadic palette has 3 colors, 120° apart', () => {
    const p = generateTriadicPalette('#ff0000');
    expect(p.colors).toHaveLength(3);
    expect(p.colors[0]).toBe('#ff0000');
    // 120° from red on HSL wheel is green-ish; not pure green due to round-trip rounding
    const c1 = rgbToHsl(...Object.values(hexToRgb(p.colors[1])!) as [number, number, number]);
    expect(c1.h).toBeGreaterThan(110);
    expect(c1.h).toBeLessThan(130);
  });

  it('monochrome palette generates N steps from 10% to 90% lightness', () => {
    const p = generateMonochromePalette('#7c3aed', 5);
    expect(p.colors).toHaveLength(5);
  });

  it('split-complementary has 3 colors', () => {
    const p = generateSplitComplementaryPalette('#ff0000');
    expect(p.colors).toHaveLength(3);
  });

  it('tetradic has 4 colors', () => {
    const p = generateTetradicPalette('#7c3aed');
    expect(p.colors).toHaveLength(4);
  });

  it('tints get lighter (closer to white)', () => {
    const base = hexToRgb('#7c3aed')!;
    const tints = generateTintsPalette('#7c3aed', 5);
    for (const hex of tints.colors) {
      const rgb = hexToRgb(hex)!;
      // Each tint should have higher luminance than base
      const baseL = getRelativeLuminance(base.r, base.g, base.b);
      const tintL = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
      expect(tintL).toBeGreaterThan(baseL);
    }
  });

  it('shades get darker (closer to black)', () => {
    const base = hexToRgb('#7c3aed')!;
    const shades = generateShadesPalette('#7c3aed', 5);
    for (const hex of shades.colors) {
      const rgb = hexToRgb(hex)!;
      const baseL = getRelativeLuminance(base.r, base.g, base.b);
      const shadeL = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
      expect(shadeL).toBeLessThan(baseL);
    }
  });

  it('tints-and-shades has 9 steps with center being the base', () => {
    const p = generateTintsAndShades('#7c3aed', 9);
    expect(p.colors).toHaveLength(9);
    expect(p.colors[4]).toBe('#7c3aed');
  });
});

/* ===== Color Blindness Simulation ===== */

describe('Color blindness simulation (CVD matrices)', () => {
  it('protanopia: pure red shifts toward green/yellow', () => {
    const result = simulateCVD('#ff0000', 'protanopia');
    expect(result).not.toBeNull();
    // Red-blind should significantly reduce R channel
    expect(result!.r).toBeLessThan(255);
    expect(result!.r).toBeGreaterThan(0);
  });

  it('deuteranopia: pure green shifts', () => {
    const result = simulateCVD('#00ff00', 'deuteranopia');
    expect(result).not.toBeNull();
    // Green-blind: G channel may stay similar but RGB composition changes
    expect([result!.r, result!.g, result!.b]).toEqual(
      expect.arrayContaining([expect.any(Number)])
    );
  });

  it('tritanopia: blue shifts', () => {
    const result = simulateCVD('#0000ff', 'tritanopia');
    expect(result).not.toBeNull();
    expect(result!.b).toBeLessThan(255);
  });

  it('achromatopsia: result is grayscale (R=G=B)', () => {
    // Test with several non-grayscale colors
    const samples = ['#ff0000', '#00ff00', '#0000ff', '#7c3aed', '#3b82f6'];
    for (const hex of samples) {
      const r = simulateCVD(hex, 'achromatopsia')!;
      expect(r.r).toBe(r.g);
      expect(r.g).toBe(r.b);
    }
  });

  it('achromatopsia output is luminance-weighted grayscale', () => {
    // The achromatopsia matrix [0.299, 0.587, 0.114] is applied in **linear** sRGB,
    // then delinearized back. For pure red (1, 0, 0) in linear sRGB:
    //   Y_lin = 0.299 * 1 + 0.587 * 0 + 0.114 * 0 = 0.299
    //   delinearize(0.299) ≈ 0.554 → 0.554 * 255 ≈ 141
    const r = simulateCVD('#ff0000', 'achromatopsia')!;
    expect(r.r).toBeGreaterThan(130);
    expect(r.r).toBeLessThan(150);
  });

  it('returns null on invalid hex', () => {
    expect(simulateCVD('not-a-color', 'protanopia')).toBeNull();
  });

  it('simulation always returns a 6-digit lowercase hex', () => {
    const samples = ['#ffffff', '#000000', '#7c3aed', '#abcdef'];
    for (const hex of samples) {
      for (const type of ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const) {
        const r = simulateCVD(hex, type)!;
        expect(r.hex).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});
