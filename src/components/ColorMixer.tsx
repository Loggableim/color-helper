'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  isValidHex,
  normalizeHex,
  copyToClipboard,
  type RGB,
  type HSL,
} from '../utils/color';
import { addRecentColor } from '../utils/storage';
import { getQueryParam, setQueryParam } from '../utils/url';
import Toast from './Toast';

/* ===== Design Tokens ===== */

const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

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
  inputGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    marginBottom: '0.375rem',
  },
  mixerInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  colorRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  nativePicker: {
    width: '44px',
    height: '44px',
    border: `2px solid ${borderColor}`,
    borderRadius: '10px',
    cursor: 'pointer',
    padding: '2px',
    background: 'none',
    flexShrink: 0,
  },
  hexInput: {
    display: 'block',
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    fontFamily: monoFont,
    color: textPrimary,
    background: 'var(--color-bg-card)',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    letterSpacing: '0.02em',
    boxSizing: 'border-box' as const,
  },
  sliderHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.375rem',
  },
  sliderValue: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: textPrimary,
    fontFamily: monoFont,
  },
  slider: {
    WebkitAppearance: 'none' as const,
    appearance: 'none' as const,
    width: '100%',
    height: '8px',
    background: `linear-gradient(to right, #6366f1, #f59e0b)`,
    borderRadius: '4px',
    outline: 'none',
    cursor: 'pointer',
    margin: 0,
  },
  ratioLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.6875rem',
    fontWeight: 500,
    color: textSecondary,
    marginTop: '0.25rem',
  },
  previews: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr 1fr',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  previewItem: {
    textAlign: 'center' as const,
  },
  previewLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.375rem',
  },
  swatch: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '10px',
    border: `2px solid ${borderColor}`,
    transition: 'background-color 0.15s ease',
    maxHeight: '80px',
  },
  swatchLarge: {
    maxHeight: '100px',
  },
  swatchHex: {
    display: 'block',
    fontFamily: monoFont,
    fontSize: '0.7rem',
    fontWeight: 600,
    color: textPrimary,
    marginTop: '0.25rem',
  },
  results: {
    marginTop: '0.5rem',
  },
  resultCard: {
    background: bgSubtle,
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    padding: '0.75rem',
    marginBottom: '0.5rem',
  },
  resultLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.375rem',
  },
  resultRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  resultValue: {
    fontFamily: monoFont,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: textPrimary,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    background: 'transparent',
    padding: '0',
  },
  copyBtn: {
    flexShrink: 0,
    width: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background 0.15s, transform 0.1s',
    color: textSecondary,
  },
};

/* ===== Helpers ===== */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function formatRgb(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function formatHsl(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/* ===== Component ===== */

export default function ColorMixer() {
  const [colorA, setColorA] = useState('#6366f1');
  const [colorB, setColorB] = useState('#f59e0b');
  const [hexInputA, setHexInputA] = useState('#6366f1');
  const [hexInputB, setHexInputB] = useState('#f59e0b');
  const [ratio, setRatio] = useState(50);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Computed mixed color
  const computeMixed = useCallback(() => {
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);
    if (!rgbA || !rgbB) return null;
    const t = ratio / 100;
    const r = Math.round(lerp(rgbA.r, rgbB.r, t));
    const g = Math.round(lerp(rgbA.g, rgbB.g, t));
    const b = Math.round(lerp(rgbA.b, rgbB.b, t));
    return { r, g, b, hex: rgbToHex(r, g, b), hsl: rgbToHsl(r, g, b) };
  }, [colorA, colorB, ratio]);

  const mixed = computeMixed();
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);

  const pctA = Math.round((1 - ratio / 100) * 100);
  const pctB = Math.round((ratio / 100) * 100);

  // Load from URL on mount
  useEffect(() => {
    const a = getQueryParam('a');
    const b = getQueryParam('b');
    const r = getQueryParam('ratio');
    if (a) {
      const ha = a.startsWith('#') ? a : '#' + a;
      if (/^#[0-9a-f]{6}$/i.test(ha)) {
        setColorA(ha.toLowerCase());
        setHexInputA(ha.toLowerCase());
      }
    }
    if (b) {
      const hb = b.startsWith('#') ? b : '#' + b;
      if (/^#[0-9a-f]{6}$/i.test(hb)) {
        setColorB(hb.toLowerCase());
        setHexInputB(hb.toLowerCase());
      }
    }
    if (r) {
      const parsed = parseInt(r, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        setRatio(parsed);
      }
    }
  }, []);

  // Sync URL params
  useEffect(() => {
    setQueryParam('a', colorA.replace('#', ''));
    setQueryParam('b', colorB.replace('#', ''));
    setQueryParam('ratio', String(ratio));
  }, [colorA, colorB, ratio]);

  // Handle color picker change
  const handleColorAPicker = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColorA(val);
    setHexInputA(val);
  }, []);

  const handleColorBPicker = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColorB(val);
    setHexInputB(val);
  }, []);

  // Handle hex text input
  const handleColorAHex = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInputA(val);
    let normalized = val.trim();
    if (!normalized.startsWith('#')) normalized = '#' + normalized;
    if (/^#[0-9a-fA-F]{3}$/.test(normalized) || /^#[0-9a-fA-F]{6}$/.test(normalized)) {
      let h = normalized.replace(/^#/, '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      normalized = '#' + h.toLowerCase();
      setColorA(normalized);
    }
  }, []);

  const handleColorBHex = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInputB(val);
    let normalized = val.trim();
    if (!normalized.startsWith('#')) normalized = '#' + normalized;
    if (/^#[0-9a-fA-F]{3}$/.test(normalized) || /^#[0-9a-fA-F]{6}$/.test(normalized)) {
      let h = normalized.replace(/^#/, '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      normalized = '#' + h.toLowerCase();
      setColorB(normalized);
    }
  }, []);

  // Handle ratio slider
  const handleRatio = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRatio(parseInt(e.target.value, 10));
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback(async (text: string) => {
    await copyToClipboard(text);
    setToastMessage('Copied!');
    const hexMatch = text.match(/#[0-9a-fA-F]{6}/);
    if (hexMatch) addRecentColor(hexMatch[0]);
    if (mixed) addRecentColor(mixed.hex);
  }, [mixed]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Color Mixer</h2>
        <p style={styles.cardDesc}>Pick two colors and blend them together with a custom ratio.</p>

        {/* Color Inputs */}
        <div style={styles.mixerInputs}>
          <div>
            <label style={styles.label}>Color A</label>
            <div style={styles.colorRow}>
              <input
                type="color"
                style={styles.nativePicker}
                value={colorA}
                onChange={handleColorAPicker}
              />
              <input
                type="text"
                style={styles.hexInput}
                value={hexInputA}
                onChange={handleColorAHex}
                spellCheck={false}
              />
            </div>
          </div>
          <div>
            <label style={styles.label}>Color B</label>
            <div style={styles.colorRow}>
              <input
                type="color"
                style={styles.nativePicker}
                value={colorB}
                onChange={handleColorBPicker}
              />
              <input
                type="text"
                style={styles.hexInput}
                value={hexInputB}
                onChange={handleColorBHex}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Ratio Slider */}
        <div style={styles.inputGroup}>
          <div style={styles.sliderHeader}>
            <label style={styles.label}>Mix Ratio</label>
            <span style={styles.sliderValue}>{pctA}% A / {pctB}% B</span>
          </div>
          <input
            type="range"
            style={styles.slider}
            min="0"
            max="100"
            value={ratio}
            onChange={handleRatio}
          />
          <div style={styles.ratioLabels}>
            <span>100% A</span>
            <span>100% B</span>
          </div>
        </div>

        {/* Previews */}
        <div style={styles.previews}>
          <div style={styles.previewItem}>
            <div style={styles.previewLabel}>Color A</div>
            <div style={{ ...styles.swatch, backgroundColor: colorA }} />
            <span style={styles.swatchHex}>{colorA}</span>
          </div>
          <div style={styles.previewItem}>
            <div style={styles.previewLabel}>Mixed</div>
            <div style={{ ...styles.swatch, ...styles.swatchLarge, backgroundColor: mixed?.hex || '#ac8235' }} />
            <span style={styles.swatchHex}>{mixed?.hex || '#ac8235'}</span>
          </div>
          <div style={styles.previewItem}>
            <div style={styles.previewLabel}>Color B</div>
            <div style={{ ...styles.swatch, backgroundColor: colorB }} />
            <span style={styles.swatchHex}>{colorB}</span>
          </div>
        </div>

        {/* Results */}
        {mixed && (
          <div style={styles.results}>
            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>HEX</div>
              <div style={styles.resultRow}>
                <code style={styles.resultValue}>{mixed.hex}</code>
                <button
                  style={styles.copyBtn}
                  onClick={() => handleCopy(mixed.hex)}
                  title="Copy HEX"
                >
                  📋
                </button>
              </div>
            </div>
            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>RGB</div>
              <div style={styles.resultRow}>
                <code style={styles.resultValue}>{formatRgb(mixed.r, mixed.g, mixed.b)}</code>
                <button
                  style={styles.copyBtn}
                  onClick={() => handleCopy(formatRgb(mixed.r, mixed.g, mixed.b))}
                  title="Copy RGB"
                >
                  📋
                </button>
              </div>
            </div>
            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>HSL</div>
              <div style={styles.resultRow}>
                <code style={styles.resultValue}>{formatHsl(mixed.hsl)}</code>
                <button
                  style={styles.copyBtn}
                  onClick={() => handleCopy(formatHsl(mixed.hsl))}
                  title="Copy HSL"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        )}

        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    </div>
  );
}
