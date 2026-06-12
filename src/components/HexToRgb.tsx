'use client';

import { useState, useCallback } from 'react';
import { isValidHex, hexToRgb, copyToClipboard } from '../utils/color';
import type { RGB } from '../utils/color';

const EXAMPLE_COLORS = ['#ff6b6b', '#4ecdc4', '#6366f1', '#f59e0b', '#22c55e'];

const primary = '#6366f1';
const primaryGradient = 'linear-gradient(135deg, #6366f1, #4f46e5)';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily,
    color: textPrimary,
  },
  card: {
    background: 'var(--color-bg-card, #ffffff)',
    border: `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
    margin: '0 0 0.25rem 0',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.8125rem',
    color: textSecondary,
    margin: '0 0 1.25rem 0',
  },
  inputRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  input: {
    flex: 1,
    padding: '0.625rem 0.875rem',
    fontSize: '0.9375rem',
    fontFamily: monoFont,
    color: textPrimary,
    background: 'var(--color-bg-card, #ffffff)',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    letterSpacing: '0.02em',
  },
  inputError: {
    borderColor: '#ef4444',
    background: '#fef2f2',
  },
  preview: {
    width: '100%',
    height: '100px',
    borderRadius: '10px',
    marginBottom: '1rem',
    border: `1px solid ${borderColor}`,
    transition: 'background-color 0.15s ease',
  },
  rgbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  rgbCard: {
    background: bgSubtle,
    borderRadius: '10px',
    padding: '0.75rem 0.5rem',
    textAlign: 'center' as const,
    border: `1px solid ${borderColor}`,
  },
  rgbLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  rgbValue: {
    fontSize: '1.375rem',
    fontWeight: 700,
    color: textPrimary,
    fontFamily: monoFont,
  },
  errorText: {
    color: '#ef4444',
    fontSize: '0.8125rem',
    fontWeight: 500,
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  row: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.25rem',
  },
  copyBtn: {
    flex: 1,
    padding: '0.625rem 0.75rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.15s ease',
    fontFamily,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
  },
  quickSelectLabel: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    marginBottom: '0.625rem',
  },
  quickSelectRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  quickBtn: {
    width: '36px',
    height: '36px',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.12s ease, border-color 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};

export default function HexToRgb() {
  const [hex, setHex] = useState('#ff6600');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'hex' | 'rgb' | null>(null);

  const rgb: RGB | null = isValidHex(hex) ? hexToRgb(hex) : null;

  const handleChange = useCallback((value: string) => {
    setHex(value);
    if (value.trim() === '') {
      setError(null);
      return;
    }
    if (!isValidHex(value)) {
      setError('Invalid hex color');
    } else {
      setError(null);
    }
  }, []);

  const handleCopy = useCallback(async (text: string, type: 'hex' | 'rgb') => {
    await copyToClipboard(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1200);
  }, []);

  const rgbString = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';

  const isDark =
    rgb
      ? 0.2126 * (rgb.r / 255) ** 2.2 +
          0.7152 * (rgb.g / 255) ** 2.2 +
          0.0722 * (rgb.b / 255) ** 2.2 <
        0.3
      : false;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>HEX → RGB Converter</h2>
        <p style={styles.subtitle}>
          Convert any hex color code to its RGB values
        </p>

        <div style={styles.inputRow}>
          <input
            type="text"
            value={hex}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="#ff6600"
            maxLength={7}
            style={{
              ...styles.input,
              ...(error ? styles.inputError : {}),
            }}
            aria-invalid={!!error}
          />
        </div>

        {error && <div style={styles.errorText}>⚠ {error}</div>}

        <div
          style={{
            ...styles.preview,
            backgroundColor: rgb ? hex : '#f1f5f9',
          }}
        />

        <div style={styles.rgbGrid}>
          <div style={styles.rgbCard}>
            <div style={styles.rgbLabel}>Red</div>
            <div style={styles.rgbValue}>{rgb ? rgb.r : '—'}</div>
          </div>
          <div style={styles.rgbCard}>
            <div style={styles.rgbLabel}>Green</div>
            <div style={styles.rgbValue}>{rgb ? rgb.g : '—'}</div>
          </div>
          <div style={styles.rgbCard}>
            <div style={styles.rgbLabel}>Blue</div>
            <div style={styles.rgbValue}>{rgb ? rgb.b : '—'}</div>
          </div>
        </div>

        <div style={styles.row}>
          <button
            style={{ ...styles.copyBtn, background: primaryGradient, boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)', opacity: copied === 'hex' ? 0.7 : 1 }}
            onClick={() => handleCopy(hex, 'hex')}
            disabled={!rgb}
          >
            {copied === 'hex' ? '✓ Copied!' : 'Copy HEX'}
          </button>
          <button
            style={{ ...styles.copyBtn, background: '#10b981', opacity: copied === 'rgb' ? 0.7 : 1 }}
            onClick={() => handleCopy(rgbString, 'rgb')}
            disabled={!rgb}
          >
            {copied === 'rgb' ? '✓ Copied!' : 'Copy RGB'}
          </button>
        </div>

        <div style={styles.quickSelectLabel}>Quick Select</div>
        <div style={styles.quickSelectRow}>
          {EXAMPLE_COLORS.map((c) => (
            <button
              key={c}
              style={{
                ...styles.quickBtn,
                backgroundColor: c,
                borderColor: hex === c ? (isDark ? '#fff' : '#1a1a2e') : 'transparent',
              }}
              onClick={() => handleChange(c)}
              title={c}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
