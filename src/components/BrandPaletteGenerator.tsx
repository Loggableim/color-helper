'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  hexToRgb,
  rgbToHex,
  getContrastRatio,
  meetsWcagAA,
  isValidHex,
  normalizeHex,
  copyToClipboard,
} from '../utils/color';
import { savePalette, addRecentColor } from '../utils/storage';
import { getQueryParam, setQueryParam } from '../utils/url';

/* ===== Design Tokens ===== */
const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Types ===== */
type BrandPalette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};

type A11yResult = {
  label: string;
  ratio: number;
  aa: boolean;
  aaLarge: boolean;
  aaa: boolean;
};

/* ===== Palette Generation ===== */
function generatePalette(hex: string): BrandPalette | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { r, g, b } = rgb;

  const primaryColor = hex;
  const secondary = rgbToHex(g, b, r);
  const accent = rgbToHex(Math.min(255, r + 60), Math.min(255, g + 40), Math.min(255, b + 100));
  const bg = rgbToHex(Math.min(255, r + 200), Math.min(255, g + 200), Math.min(255, b + 200));
  const textColor = rgbToHex(Math.max(0, r - 120), Math.max(0, g - 120), Math.max(0, b - 120));

  return { primary: primaryColor, secondary, accent, background: bg, text: textColor };
}

/* ===== Inline Styles ===== */
const s: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '680px',
    margin: '0 auto',
    fontFamily,
  },
  card: {
    background: 'var(--color-bg-card)',
    border: `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-md)',
    marginBottom: '2rem',
  },
  panelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  label: {
    fontWeight: 600,
    fontSize: '0.875rem',
    color: textPrimary,
  },
  colorPicker: {
    width: '48px',
    height: '48px',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    borderRadius: '8px',
  },
  hexInput: {
    width: '120px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.9375rem',
    fontFamily: monoFont,
    color: textPrimary,
    background: 'var(--color-bg-card)',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    letterSpacing: '0.02em',
    boxSizing: 'border-box' as const,
  },
  paletteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.75rem',
    marginBottom: '2rem',
  },
  paletteCard: {
    padding: '1rem',
    textAlign: 'center' as const,
    borderRadius: '12px',
    border: `1px solid ${borderColor}`,
    background: 'var(--color-bg-card)',
  },
  swatch: {
    width: '100%',
    height: '64px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    marginBottom: '0.5rem',
  },
  swatchLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'capitalize' as const,
    color: textSecondary,
    marginBottom: '0.125rem',
  },
  swatchHex: {
    fontFamily: monoFont,
    fontSize: '0.8125rem',
    color: textPrimary,
    fontWeight: 600,
  },
  a11ySection: {
    marginBottom: '2rem',
  },
  a11yTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    margin: '0 0 0.75rem 0',
    color: textPrimary,
  },
  a11yGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '0.75rem',
  },
  a11yCard: {
    padding: '1rem',
    borderRadius: '12px',
    border: `1px solid ${borderColor}`,
    background: 'var(--color-bg-card)',
  },
  a11yPairLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: textPrimary,
  },
  a11yRatio: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
    color: textPrimary,
  },
  a11yBadges: {
    display: 'flex',
    gap: '0.375rem',
    flexWrap: 'wrap' as const,
  },
  wcagPass: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    padding: '0.2rem 0.45rem',
    borderRadius: '6px',
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#16a34a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  wcagFail: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    padding: '0.2rem 0.45rem',
    borderRadius: '6px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#dc2626',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  exportRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginBottom: '1.5rem',
  },
  btn: {
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily,
    lineHeight: 1,
  },
  btnPrimary: {
    background: primary,
    color: '#ffffff',
  },
  btnSecondary: {
    background: bgSubtle,
    color: textPrimary,
    border: `1px solid ${borderColor}`,
  },
  cssCard: {
    padding: '1.25rem',
    borderRadius: '12px',
    border: `1px solid ${borderColor}`,
    background: 'var(--color-bg-card)',
  },
  cssCardTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: '0 0 0.75rem 0',
    color: textPrimary,
  },
  cssPre: {
    background: '#0f172a',
    color: '#e2e8f0',
    padding: '1rem',
    borderRadius: '10px',
    fontFamily: monoFont,
    fontSize: '0.8125rem',
    overflowX: 'auto' as const,
    marginBottom: '0.75rem',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
    lineHeight: 1.6,
  },
  cssActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  feedback: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#16a34a',
    marginLeft: '0.375rem',
    alignSelf: 'center',
  },
};

/* ===== Component ===== */
export default function BrandPaletteGenerator() {
  const [baseHex, setBaseHex] = useState('#3B82F6');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedCss, setCopiedCss] = useState(false);

  const palette = useMemo(() => generatePalette(baseHex), [baseHex]);

  const a11yResults = useMemo((): A11yResult[] => {
    if (!palette) return [];
    const pairs = [
      { label: 'Text on Background', fg: palette.text, bg: palette.background },
      { label: 'Text on Primary', fg: palette.text, bg: palette.primary },
      { label: 'Text on Secondary', fg: palette.text, bg: palette.secondary },
    ];
    return pairs.map((p) => {
      const ratio = getContrastRatio(p.fg, p.bg);
      return {
        label: p.label,
        ratio,
        aa: meetsWcagAA(ratio, false),
        aaLarge: meetsWcagAA(ratio, true),
        aaa: ratio >= 7,
      };
    });
  }, [palette]);

  const cssVarsText = useMemo(() => {
    if (!palette) return '';
    const vars = Object.entries(palette)
      .map(([k, v]) => `  --color-${k}: ${v};`)
      .join('\n');
    return `:root {\n${vars}\n}`;
  }, [palette]);

  // URL param handling
  useEffect(() => {
    const base = getQueryParam('base');
    if (base) {
      let hex = base.trim();
      if (!hex.startsWith('#')) hex = '#' + hex;
      if (isValidHex(hex)) {
        setBaseHex(normalizeHex(hex));
      }
    }
  }, []);

  // Update URL on hex change
  useEffect(() => {
    const stripped = baseHex.replace('#', '');
    setQueryParam('base', stripped);
  }, [baseHex]);

  // Handlers
  const handleColorPicker = useCallback((value: string) => {
    setBaseHex(value);
  }, []);

  const handleHexInput = useCallback((value: string) => {
    const stripped = value.replace('#', '');
    if (/^[0-9a-f]{6}$/i.test(stripped)) {
      const h = value.startsWith('#') ? value : '#' + value;
      setBaseHex(h);
    } else if (value === '' || value === '#') {
      // Allow partial input
    }
  }, []);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  const handleCopyCss = useCallback(async () => {
    await copyToClipboard(cssVarsText);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  }, [cssVarsText]);

  const handleDownloadCss = useCallback(() => {
    const blob = new Blob([cssVarsText], { type: 'text/css' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'brand-palette.css';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [cssVarsText]);

  const handleExportJson = useCallback(async () => {
    if (!palette) return;
    const json = JSON.stringify(palette, null, 2);
    await copyToClipboard(json);
    showFeedback('JSON Copied!');
  }, [palette, showFeedback]);

  const handleExportTailwind = useCallback(async () => {
    if (!palette) return;
    const entries = Object.entries(palette)
      .map(([k, v]) => `    '${k}': '${v}'`)
      .join(',\n');
    const tw = `{\n  colors: {\n${entries}\n  }\n}`;
    await copyToClipboard(tw);
    showFeedback('Tailwind Copied!');
  }, [palette, showFeedback]);

  const handleSave = useCallback(() => {
    if (!palette) return;
    const colors = Object.values(palette);
    savePalette('Brand Palette', colors, 'brand');
    colors.forEach((c) => addRecentColor(c));
    showFeedback('Saved!');
  }, [palette, showFeedback]);

  if (!palette) {
    return (
      <div style={s.wrapper}>
        <div style={s.card}>
          <p style={{ color: textSecondary }}>Invalid base color. Please enter a valid HEX color.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      {/* Base Color Input */}
      <div style={s.card}>
        <div style={s.panelRow}>
          <span style={s.label}>Base Color</span>
          <input
            type="color"
            id="bp-base"
            value={baseHex}
            onChange={(e) => handleColorPicker(e.target.value)}
            style={s.colorPicker}
          />
          <input
            type="text"
            value={baseHex}
            maxLength={7}
            placeholder="#RRGGBB"
            onChange={(e) => handleHexInput(e.target.value)}
            style={s.hexInput}
          />
          {feedback && <span style={s.feedback}>{feedback}</span>}
        </div>
      </div>

      {/* Palette */}
      <div style={s.paletteGrid}>
        {Object.entries(palette).map(([key, val]) => (
          <div key={key} style={s.paletteCard}>
            <div style={{ ...s.swatch, backgroundColor: val }} />
            <div style={s.swatchLabel}>{key}</div>
            <div style={s.swatchHex}>{val}</div>
          </div>
        ))}
      </div>

      {/* Accessibility */}
      <div style={s.a11ySection}>
        <h3 style={s.a11yTitle}>Accessibility Check</h3>
        <div style={s.a11yGrid}>
          {a11yResults.map((r) => (
            <div key={r.label} style={s.a11yCard}>
              <div style={s.a11yPairLabel}>{r.label}</div>
              <div style={s.a11yRatio}>{r.ratio}:1</div>
              <div style={s.a11yBadges}>
                <span style={r.aa ? s.wcagPass : s.wcagFail}>
                  AA {r.aa ? 'PASS' : 'FAIL'}
                </span>
                <span style={r.aaLarge ? s.wcagPass : s.wcagFail}>
                  AA Large {r.aaLarge ? 'PASS' : 'FAIL'}
                </span>
                <span style={r.aaa ? s.wcagPass : s.wcagFail}>
                  AAA {r.aaa ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Buttons */}
      <div style={s.exportRow}>
        <button
          style={{ ...s.btn, ...s.btnPrimary }}
          onClick={handleCopyCss}
          type="button"
        >
          {copiedCss ? 'Copied!' : 'Copy CSS'}
        </button>
        <button
          style={{ ...s.btn, ...s.btnSecondary }}
          onClick={handleExportJson}
          type="button"
        >
          Export JSON
        </button>
        <button
          style={{ ...s.btn, ...s.btnSecondary }}
          onClick={handleExportTailwind}
          type="button"
        >
          Export Tailwind
        </button>
        <button
          style={{ ...s.btn, ...s.btnSecondary }}
          onClick={handleSave}
          type="button"
        >
          💾 Save Palette
        </button>
      </div>

      {/* CSS Custom Properties */}
      <div style={s.cssCard}>
        <h3 style={s.cssCardTitle}>CSS Custom Properties</h3>
        <pre style={s.cssPre}>{cssVarsText}</pre>
        <div style={s.cssActions}>
          <button
            style={{ ...s.btn, ...s.btnSecondary }}
            onClick={handleDownloadCss}
            type="button"
          >
            Download .css
          </button>
        </div>
      </div>
    </div>
  );
}
