'use client';

import React, { useState, useCallback } from 'react';
import {
  hexToRgb,
  rgbToHex,
  normalizeHex,
  copyToClipboard,
  simulateCVDFromRgb,
  type CVDType,
} from '../utils/color';
import Toast from './Toast';

/* ===== Design Tokens ===== */

const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== CVD Simulation now lives in utils/color.ts (testable) ===== */

/* ===== Inline Styles ===== */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '600px',
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
  colorPickRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  nativePicker: {
    width: '48px',
    height: '48px',
    border: `2px solid ${borderColor}`,
    borderRadius: '10px',
    cursor: 'pointer',
    padding: '2px',
    background: 'none',
    flexShrink: 0,
  },
  hexInput: {
    flex: 1,
    display: 'block',
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
  swatchesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  swatchCard: {
    textAlign: 'center' as const,
  },
  swatchLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.375rem',
  },
  swatchBox: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '10px',
    border: `2px solid ${borderColor}`,
    transition: 'background-color 0.15s ease',
    marginBottom: '0.375rem',
  },
  swatchName: {
    fontSize: '0.75rem',
    color: textSecondary,
    fontWeight: 500,
  },
  noteBox: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.8125rem',
    color: '#92400e',
    lineHeight: 1.5,
    marginBottom: '1.25rem',
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'var(--color-bg-card)',
    color: textSecondary,
    transition: 'all 0.15s ease',
    fontFamily,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
  },
  hexDisplay: {
    fontFamily: monoFont,
    fontSize: '0.7rem',
    fontWeight: 600,
    color: textPrimary,
    marginBottom: '0.25rem',
    wordBreak: 'break-all' as const,
  },
};

/* ===== Component ===== */

const CVD_TYPES: { id: CVDType; label: string; subtitle: string }[] = [
  { id: 'protanopia', label: 'Protanopia', subtitle: 'Red-blind' },
  { id: 'deuteranopia', label: 'Deuteranopia', subtitle: 'Green-blind' },
  { id: 'tritanopia', label: 'Tritanopia', subtitle: 'Blue-blind' },
  { id: 'achromatopsia', label: 'Achromatopsia', subtitle: 'Monochrome' },
];

export default function ColorBlindnessSimulator() {
  const [hexInput, setHexInput] = useState('#6366f1');
  const [color, setColor] = useState('#6366f1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const rgb = hexToRgb(color);
  const simulations = rgb
    ? CVD_TYPES.map(cvd => ({
        ...cvd,
        ...simulateCVDFromRgb(rgb.r, rgb.g, rgb.b, cvd.id),
      }))
    : [];

  // Handle color picker change
  const handlePickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColor(val);
    setHexInput(val);
  }, []);

  // Handle hex text input
  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    let normalized = val.trim();
    if (!normalized.startsWith('#')) normalized = '#' + normalized;
    if (/^#[0-9a-fA-F]{3}$/.test(normalized) || /^#[0-9a-fA-F]{6}$/.test(normalized)) {
      let h = normalized.replace(/^#/, '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      normalized = '#' + h.toLowerCase();
      setColor(normalized);
    }
  }, []);

  // Copy hex to clipboard
  const handleCopy = useCallback(async (hex: string) => {
    await copyToClipboard(hex);
    setToastMessage(`Copied ${hex}`);
  }, []);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Color Blindness Simulator</h2>
        <p style={styles.cardDesc}>Enter a color to see how it appears under four common types of color vision deficiency.</p>

        {/* Input */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Pick a color</label>
          <div style={styles.colorPickRow}>
            <input
              type="color"
              style={styles.nativePicker}
              value={color}
              onChange={handlePickerChange}
            />
            <input
              type="text"
              style={styles.hexInput}
              value={hexInput}
              onChange={handleHexChange}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Swatches */}
        <div style={styles.swatchesGrid}>
          {/* Original */}
          <div style={styles.swatchCard}>
            <div style={styles.swatchLabel}>Original</div>
            <div style={{ ...styles.swatchBox, backgroundColor: color }} />
            <div style={styles.hexDisplay}>{color}</div>
            <div style={styles.swatchName}>Normal vision</div>
            <button
              style={{ ...styles.copyBtn, marginTop: '0.25rem' }}
              onClick={() => handleCopy(color)}
            >
              📋 Copy
            </button>
          </div>

          {/* CVD simulations */}
          {simulations.map(sim => (
            <div key={sim.id} style={styles.swatchCard}>
              <div style={styles.swatchLabel}>{sim.label}</div>
              <div style={{ ...styles.swatchBox, backgroundColor: sim.hex }} />
              <div style={styles.hexDisplay}>{sim.hex}</div>
              <div style={styles.swatchName}>{sim.subtitle}</div>
              <button
                style={{ ...styles.copyBtn, marginTop: '0.25rem' }}
                onClick={() => handleCopy(sim.hex)}
              >
                📋 Copy
              </button>
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={styles.noteBox}>
          <strong>Note:</strong> Color blindness simulation is an approximation based on mathematical models.
          Actual perception varies by individual. Use this tool to test contrast and readability, not as a clinical diagnosis.
        </div>

        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    </div>
  );
}
