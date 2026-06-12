'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  copyToClipboard,
  type RGB,
  type HSL,
} from '../utils/color';
import { addRecentColor, savePalette, formatCSSVariables, formatJSON } from '../utils/storage';
import Toast from './Toast';

/* ===== Design Tokens ===== */

const primary = '#6366f1';
const primaryGradient = 'linear-gradient(135deg, #6366f1, #4f46e5)';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Color Modes ===== */

interface ColorMode {
  name: string;
  sRange: [number, number];
  lRange: [number, number];
}

const COLOR_MODES: Record<string, ColorMode> = {
  random: { name: 'Random', sRange: [0, 100], lRange: [5, 95] },
  pastel: { name: 'Pastel', sRange: [20, 45], lRange: [60, 85] },
  vivid:  { name: 'Vivid',  sRange: [70, 100], lRange: [40, 60] },
  dark:   { name: 'Dark',   sRange: [0, 40],  lRange: [5, 22] },
  neon:   { name: 'Neon',   sRange: [85, 100], lRange: [50, 65] },
  earthy: { name: 'Earthy', sRange: [20, 55], lRange: [25, 45] },
};

interface ColorObj {
  r: number;
  g: number;
  b: number;
  hex: string;
}

/* ===== Helpers ===== */

function hslToString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function rgbToString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function randomHexWithMode(mode: string): ColorObj {
  const config = COLOR_MODES[mode] || COLOR_MODES.random;
  const h = Math.floor(Math.random() * 360);
  const s = config.sRange[0] + Math.random() * (config.sRange[1] - config.sRange[0]);
  const l = config.lRange[0] + Math.random() * (config.lRange[1] - config.lRange[0]);
  const { r, g, b } = hslToRgb(h, s, l);
  return { r, g, b, hex: rgbToHex(r, g, b) };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const rs = r / 255, gs = g / 255, bs = b / 255;
  const rl = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const gl = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const bl = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatioOnWhite(r: number, g: number, b: number): number {
  const lum = relativeLuminance(r, g, b);
  return (1 + 0.05) / (lum + 0.05);
}

function generateAccessibleColor(mode: string): ColorObj {
  for (let attempt = 0; attempt < 100; attempt++) {
    const color = randomHexWithMode(mode);
    if (contrastRatioOnWhite(color.r, color.g, color.b) >= 4.5) {
      return color;
    }
  }
  // Fallback: force high lightness
  const fallback = hslToRgb(Math.floor(Math.random() * 360), 40 + Math.random() * 60, 70 + Math.random() * 20);
  return { ...fallback, hex: rgbToHex(fallback.r, fallback.g, fallback.b) };
}

function getTextColor(r: number, g: number, b: number): string {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? '#1e293b' : '#f8fafc';
}

/* ===== Inline Styles ===== */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '540px',
    margin: '0 auto',
    fontFamily,
  },
  card: {
    background: 'var(--color-bg-card)',
    border: `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-md)',
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: textPrimary,
    margin: '0 0 0.25rem 0',
    letterSpacing: '-0.01em',
  },
  cardDesc: {
    margin: '0 0 1.25rem 0',
    fontSize: '0.8125rem',
    color: textSecondary,
  },
  sectionBlock: {
    marginBottom: '1rem',
  },
  sectionDivider: {
    height: '1px',
    background: borderColor,
    margin: '1.25rem 0',
    border: 'none',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: '0 0 0.75rem 0',
    color: textPrimary,
  },
  /* Single preview */
  singlePreview: {
    width: '100%',
    height: '120px',
    borderRadius: '12px',
    border: `2px solid ${borderColor}`,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '0.75rem',
    transition: 'background-color 0.2s ease',
    marginBottom: '0.75rem',
  },
  singleInfo: {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(4px)',
    borderRadius: '8px',
    padding: '0.375rem 1rem',
  },
  singleHex: {
    fontFamily: monoFont,
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  /* Output rows */
  outputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0',
    borderBottom: `1px solid ${borderColor}`,
  },
  outputLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    width: '36px',
    flexShrink: 0,
  },
  outputValue: {
    flex: 1,
    fontFamily: monoFont,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: textPrimary,
  },
  lastOutputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0',
  },
  /* Buttons */
  actionBtn: {
    display: 'block',
    width: '100%',
    padding: '0.625rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '10px',
    background: primaryGradient,
    color: '#fff',
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.1s',
    marginBottom: '0.5rem',
    fontFamily,
  },
  actionBtnSecondary: {
    background: 'var(--color-bg-alt)',
    color: textPrimary,
    border: `1px solid ${borderColor}`,
  },
  actionBtnRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  /* Palette */
  paletteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  paletteSwatch: {
    textAlign: 'center' as const,
  },
  paletteColorBox: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '10px',
    border: `2px solid ${borderColor}`,
    transition: 'background-color 0.2s ease',
    marginBottom: '0.25rem',
  },
  paletteColorLabel: {
    display: 'block',
    fontFamily: monoFont,
    fontSize: '0.65rem',
    fontWeight: 600,
    marginBottom: '0.25rem',
    wordBreak: 'break-all' as const,
  },
  paletteBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '2px 4px',
    borderRadius: '4px',
    transition: 'background 0.15s',
  },
  /* Mode */
  modeSelector: {
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  modeLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  modeButtons: {
    display: 'flex',
    gap: '0.25rem',
    flexWrap: 'wrap' as const,
  },
  modeBtn: {
    padding: '0.25rem 0.625rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    background: 'var(--color-bg-card)',
    color: textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily,
  },
  modeBtnActive: {
    background: primary,
    color: '#fff',
    borderColor: primary,
  },
  /* Accessible toggle */
  accessibleToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    cursor: 'pointer',
  },
  /* Save msg */
  saveMsg: {
    textAlign: 'center' as const,
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#22c55e',
    padding: '0.5rem',
  },
  /* Export */
  exportActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  copyBtn: {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'background 0.15s',
    color: textSecondary,
  },
};

/* ===== Component ===== */

export default function RandomColorGenerator() {
  const [mode, setMode] = useState('random');
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single color state
  const [singleColor, setSingleColor] = useState<ColorObj>(() => randomHexWithMode('random'));

  // Palette state
  const [paletteColors, setPaletteColors] = useState<ColorObj[]>(() =>
    Array.from({ length: 5 }, () => randomHexWithMode('random'))
  );
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);

  // Generate single random color
  const generateSingle = useCallback(() => {
    const genFn = accessibleMode ? generateAccessibleColor : randomHexWithMode;
    const color = genFn(mode);
    setSingleColor(color);
    addRecentColor(color.hex);
  }, [mode, accessibleMode]);

  // Generate palette colors, respecting locks
  const generatePalette = useCallback(() => {
    const genFn = accessibleMode ? generateAccessibleColor : randomHexWithMode;
    setPaletteColors(prev => {
      const newColors = prev.map((color, i) => {
        if (locked[i]) return color;
        return genFn(mode);
      });
      return newColors;
    });
  }, [mode, accessibleMode, locked]);

  // Toggle lock for palette swatch
  const toggleLock = useCallback((index: number) => {
    setLocked(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  }, []);

  // Copy hex from palette
  const handleCopyPaletteHex = useCallback(async (color: ColorObj) => {
    await copyToClipboard(color.hex);
    addRecentColor(color.hex);
    setToastMessage('Copied!');
  }, []);

  // Copy single color
  const handleCopySingle = useCallback(async (text: string) => {
    await copyToClipboard(text);
    const hexMatch = text.match(/#[0-9a-fA-F]{6}/);
    if (hexMatch) addRecentColor(hexMatch[0]);
    setToastMessage('Copied!');
  }, []);

  // Save palette to storage
  const handleSavePalette = useCallback(() => {
    const colors = paletteColors.map(c => c.hex);
    if (colors.length === 0) return;
    savePalette('Random Palette', colors, 'random');
    colors.forEach(c => addRecentColor(c));
    setToastMessage('✅ Palette saved to localStorage!');
  }, [paletteColors]);

  // Export CSS variables
  const handleExportCSS = useCallback(async () => {
    const colors = paletteColors.map(c => c.hex);
    if (colors.length === 0) return;
    const css = ':root {\n' + formatCSSVariables(colors) + '\n}';
    await copyToClipboard(css);
    colors.forEach(c => addRecentColor(c));
    setToastMessage('Copied CSS variables!');
  }, [paletteColors]);

  // Export JSON
  const handleExportJSON = useCallback(async () => {
    const colors = paletteColors.map(c => c.hex);
    if (colors.length === 0) return;
    const json = formatJSON(colors);
    await copyToClipboard(json);
    colors.forEach(c => addRecentColor(c));
    setToastMessage('Copied JSON!');
  }, [paletteColors]);

  const singleHsl = rgbToHsl(singleColor.r, singleColor.g, singleColor.b);
  const singleTextColor = getTextColor(singleColor.r, singleColor.g, singleColor.b);
  const singleHexStyle = { ...styles.singleHex, color: singleTextColor };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Random Color Generator</h2>
        <p style={styles.cardDesc}>Generate a random color, view it in HEX/RGB/HSL, and build a palette you can lock, shuffle, and save.</p>

        {/* Single Color */}
        <div style={styles.sectionBlock}>
          <div style={{ ...styles.singlePreview, backgroundColor: singleColor.hex }}>
            <div style={styles.singleInfo}>
              <span style={singleHexStyle}>{singleColor.hex}</span>
            </div>
          </div>

          <div>
            <div style={styles.outputRow}>
              <span style={styles.outputLabel}>HEX</span>
              <code style={styles.outputValue}>{singleColor.hex}</code>
              <button
                style={styles.copyBtn}
                onClick={() => handleCopySingle(singleColor.hex)}
                title="Copy HEX"
              >
                📋
              </button>
            </div>
            <div style={styles.outputRow}>
              <span style={styles.outputLabel}>RGB</span>
              <code style={styles.outputValue}>{rgbToString(singleColor)}</code>
              <button
                style={styles.copyBtn}
                onClick={() => handleCopySingle(rgbToString(singleColor))}
                title="Copy RGB"
              >
                📋
              </button>
            </div>
            <div style={styles.outputRow}>
              <span style={styles.outputLabel}>HSL</span>
              <code style={styles.outputValue}>{hslToString(singleHsl)}</code>
              <button
                style={styles.copyBtn}
                onClick={() => handleCopySingle(hslToString(singleHsl))}
                title="Copy HSL"
              >
                📋
              </button>
            </div>
          </div>

          <button
            style={styles.actionBtn}
            onClick={generateSingle}
          >
            Generate Random Color
          </button>
        </div>

        {/* Divider */}
        <hr style={styles.sectionDivider} />

        {/* Palette */}
        <div style={styles.sectionBlock}>
          <h3 style={styles.sectionTitle}>Color Palette</h3>

          {/* Mode Selector */}
          <div style={styles.modeSelector}>
            <span style={styles.modeLabel}>Mode:</span>
            <div style={styles.modeButtons}>
              {Object.keys(COLOR_MODES).map(key => (
                <button
                  key={key}
                  style={{
                    ...styles.modeBtn,
                    ...(mode === key ? styles.modeBtnActive : {}),
                  }}
                  onClick={() => setMode(key)}
                >
                  {COLOR_MODES[key].name}
                </button>
              ))}
            </div>
          </div>

          {/* Accessible toggle */}
          <label style={styles.accessibleToggle}>
            <input
              type="checkbox"
              checked={accessibleMode}
              onChange={e => setAccessibleMode(e.target.checked)}
            />
            <span>WCAG AA on white</span>
          </label>

          {/* Palette Grid */}
          <div style={styles.paletteGrid}>
            {paletteColors.map((color, i) => (
              <div key={i} style={styles.paletteSwatch}>
                <div
                  style={{ ...styles.paletteColorBox, backgroundColor: color.hex }}
                />
                <span
                  style={{
                    ...styles.paletteColorLabel,
                    color: getTextColor(color.r, color.g, color.b),
                  }}
                >
                  {color.hex}
                </span>
                <button
                  style={styles.paletteBtn}
                  onClick={() => toggleLock(i)}
                  title={locked[i] ? 'Unlock color' : 'Lock color'}
                >
                  {locked[i] ? '🔒' : '🔓'}
                </button>
                <button
                  style={styles.paletteBtn}
                  onClick={() => handleCopyPaletteHex(color)}
                  title="Copy HEX"
                >
                  📋
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={styles.actionBtnRow}>
            <button
              style={{ ...styles.actionBtn, marginBottom: 0 }}
              onClick={generatePalette}
            >
              Generate New Palette
            </button>
            <button
              style={{ ...styles.actionBtn, ...styles.actionBtnSecondary, marginBottom: 0 }}
              onClick={handleSavePalette}
            >
              💾 Save Palette
            </button>
          </div>

          {/* Export */}
          <div style={styles.exportActions}>
            <button
              style={{ ...styles.actionBtn, ...styles.actionBtnSecondary, marginBottom: 0 }}
              onClick={handleExportCSS}
            >
              📋 Copy CSS Variables
            </button>
            <button
              style={{ ...styles.actionBtn, ...styles.actionBtnSecondary, marginBottom: 0 }}
              onClick={handleExportJSON}
            >
              📋 Copy JSON
            </button>
          </div>
        </div>

        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    </div>
  );
}
