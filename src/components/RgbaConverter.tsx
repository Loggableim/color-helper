'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { hexToRgb, rgbToHex, copyToClipboard, isValidHex, normalizeHex } from '../utils/color';
import type { RGB } from '../utils/color';

/* ===== Design Tokens ===== */
const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Inline Styles ===== */
const s: Record<string, React.CSSProperties> = {
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
  subtitle: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.125rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: textPrimary,
  },
  desc: {
    margin: '0 0 1.25rem 0',
    fontSize: '0.8125rem',
    color: textSecondary,
  },
  inputGroup: {
    marginBottom: '1rem',
  },
  inputLabel: {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    marginBottom: '0.375rem',
    color: textPrimary,
  },
  hexInput: {
    display: 'block',
    width: '100%',
    padding: '0.625rem 0.875rem',
    fontSize: '0.9375rem',
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
  rgbRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  rgbInput: {
    flex: 1,
    padding: '0.625rem 0.5rem',
    fontSize: '0.9375rem',
    fontFamily: monoFont,
    color: textPrimary,
    background: 'var(--color-bg-card)',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    textAlign: 'center' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  },
  opacityHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.375rem',
  },
  opacityValue: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: textPrimary,
    fontFamily: monoFont,
  },
  opacitySlider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    outline: 'none',
    cursor: 'pointer',
    accentColor: primary,
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  previewStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  colorPreview: {
    width: '64px',
    height: '48px',
    borderRadius: '8px',
    border: `2px solid ${borderColor}`,
    transition: 'background-color 0.15s ease',
    flexShrink: 0,
  },
  previewInfo: {
    fontSize: '0.8125rem',
    color: textSecondary,
  },
  previewLabel: {
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  previewHex: {
    fontFamily: monoFont,
    fontSize: '0.875rem',
    color: textPrimary,
    fontWeight: 600,
  },
  resultsCard: {
    background: bgSubtle,
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    padding: '0.75rem',
    marginTop: '0.5rem',
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
    fontSize: '0.9375rem',
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
    padding: 0,
    lineHeight: 1,
  },
};

export default function RgbaConverter() {
  // State
  const [hex, setHex] = useState('#ff6600');
  const [r, setR] = useState(255);
  const [g, setG] = useState(102);
  const [b, setB] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [copied, setCopied] = useState(false);

  // Derived
  const alpha = opacity / 100;
  const alphaStr = alpha.toFixed(2);
  const rgbaStr = `rgba(${r}, ${g}, ${b}, ${alphaStr})`;
  const currentHex = rgbToHex(r, g, b);

  // Sync HEX → RGB
  const handleHexChange = useCallback((value: string) => {
    setHex(value);
    if (isValidHex(value)) {
      const normalized = normalizeHex(value);
      const rgb = hexToRgb(normalized);
      if (rgb) {
        setR(rgb.r);
        setG(rgb.g);
        setB(rgb.b);
      }
    }
  }, []);

  // Sync RGB → HEX
  const handleRgbChange = useCallback((channel: 'r' | 'g' | 'b', value: number) => {
    const clamped = Math.min(255, Math.max(0, Math.round(value)));
    let newR = r, newG = g, newB = b;
    if (channel === 'r') { newR = clamped; setR(clamped); }
    if (channel === 'g') { newG = clamped; setG(clamped); }
    if (channel === 'b') { newB = clamped; setB(clamped); }
    setHex(rgbToHex(newR, newG, newB));
  }, [r, g, b]);

  // Copy
  const handleCopy = useCallback(async () => {
    await copyToClipboard(rgbaStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [rgbaStr]);

  // Effective opacity slider style
  const sliderStyle: React.CSSProperties = useMemo(() => ({
    ...s.opacitySlider,
    background: `linear-gradient(to right, #e2e8f0, ${currentHex})`,
  }), [currentHex]);

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <h2 style={s.subtitle}>RGBA Converter with Opacity</h2>
        <p style={s.desc}>Enter a HEX or RGB color, adjust the opacity, and get a ready-to-use RGBA value.</p>

        {/* HEX Input */}
        <div style={s.inputGroup}>
          <label htmlFor="rgba-hex-input" style={s.inputLabel}>HEX color</label>
          <input
            id="rgba-hex-input"
            type="text"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#ff6600"
            spellCheck={false}
            autoComplete="off"
            style={s.hexInput}
          />
        </div>

        {/* RGB Inputs */}
        <div style={s.inputGroup}>
          <label style={s.inputLabel}>RGB values</label>
          <div style={s.rgbRow}>
            <input
              type="number"
              min={0}
              max={255}
              placeholder="R"
              value={r}
              onChange={(e) => handleRgbChange('r', parseInt(e.target.value, 10) || 0)}
              style={s.rgbInput}
            />
            <input
              type="number"
              min={0}
              max={255}
              placeholder="G"
              value={g}
              onChange={(e) => handleRgbChange('g', parseInt(e.target.value, 10) || 0)}
              style={s.rgbInput}
            />
            <input
              type="number"
              min={0}
              max={255}
              placeholder="B"
              value={b}
              onChange={(e) => handleRgbChange('b', parseInt(e.target.value, 10) || 0)}
              style={s.rgbInput}
            />
          </div>
        </div>

        {/* Opacity Slider */}
        <div style={s.inputGroup}>
          <div style={s.opacityHeader}>
            <label style={s.inputLabel}>Opacity</label>
            <span style={s.opacityValue}>{Math.round(opacity)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
            style={sliderStyle}
          />
        </div>

        {/* Live Preview */}
        <div style={s.previewRow}>
          <div style={s.previewStack}>
            <div style={{ ...s.colorPreview, backgroundColor: currentHex }} />
            <div style={{ ...s.colorPreview, backgroundColor: rgbaStr }} />
          </div>
          <div style={s.previewInfo}>
            <div style={s.previewLabel}>Solid (top) vs RGBA (bottom)</div>
            <div style={s.previewHex}>{currentHex}</div>
          </div>
        </div>

        {/* Output */}
        <div style={s.resultsCard}>
          <div style={s.resultLabel}>RGBA CSS</div>
          <div style={s.resultRow}>
            <code style={s.resultValue}>{rgbaStr}</code>
            <button
              style={s.copyBtn}
              onClick={handleCopy}
              title="Copy RGBA"
              type="button"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
