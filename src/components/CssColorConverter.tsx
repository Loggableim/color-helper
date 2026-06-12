'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  isValidHex,
  normalizeHex,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  copyToClipboard,
  getRelativeLuminance,
} from '../utils/color';
import type { RGB } from '../utils/color';

/* ===== Design Tokens ===== */
const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Types ===== */
type DetectResult = {
  format: 'HEX' | 'RGB' | 'HSL' | null;
  rgb: RGB | null;
  error: string | null;
};

/* ===== Detection Logic ===== */
function detectFormat(input: string): DetectResult {
  const trimmed = input.trim();
  if (!trimmed) return { format: null, rgb: null, error: null };

  // HEX
  if (/^#?[0-9a-fA-F]{3}$/.test(trimmed) || /^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
    const hex = trimmed.startsWith('#') ? trimmed : '#' + trimmed;
    if (isValidHex(hex)) {
      const rgb = hexToRgb(hex);
      if (rgb) return { format: 'HEX', rgb, error: null };
    }
  }

  // RGB
  let match = trimmed.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (!match) match = trimmed.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return { format: 'RGB', rgb: { r, g, b }, error: null };
    }
    return { format: 'RGB', rgb: null, error: 'RGB values must be between 0 and 255.' };
  }

  // HSL
  let hslMatch = trimmed.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
  if (!hslMatch) hslMatch = trimmed.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (!hslMatch) hslMatch = trimmed.match(/^(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%$/);
  if (!hslMatch) hslMatch = trimmed.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10);
    const s = parseInt(hslMatch[2], 10);
    const l = parseInt(hslMatch[3], 10);
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      const rgb = hslToRgb(h, s, l);
      return { format: 'HSL', rgb, error: null };
    }
    return { format: 'HSL', rgb: null, error: 'Hue must be 0–360, saturation and lightness 0–100.' };
  }

  return {
    format: null,
    rgb: null,
    error: 'Could not detect color format. Try #ff6600, rgb(255,102,0), or hsl(30,100%,50%).',
  };
}

function isLightColor(r: number, g: number, b: number): boolean {
  return getRelativeLuminance(r, g, b) > 0.5;
}

/* ===== Quick Sample Colors ===== */
const QUICK_COLORS = ['#ff6b6b', '#4ecdc4', '#6366f1', '#f59e0b', '#22c55e'];

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
  input: {
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
  detectBadge: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: textSecondary,
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  badgeDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#94a3b8',
  },
  badgeDotSuccess: {
    background: '#22c55e',
  },
  badgeDotError: {
    background: '#ef4444',
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  preview: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    border: `2px solid ${borderColor}`,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    flexShrink: 0,
  },
  previewInfo: {
    fontSize: '0.8125rem',
    color: textSecondary,
  },
  detectedFormat: {
    fontWeight: 700,
    fontSize: '0.9375rem',
    color: textPrimary,
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  resultCard: {
    background: bgSubtle,
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    padding: '0.75rem',
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
    margin: '0',
    flex: 1,
    minWidth: 0,
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
  errorMsg: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#dc2626',
    fontSize: '0.8125rem',
    fontWeight: 500,
    marginBottom: '1rem',
  },
  quickSamples: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  quickLabel: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
  },
  quickBtns: {
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

/* ===== Component ===== */
export default function CssColorConverter() {
  const [input, setInput] = useState('#ff6600');
  const [copied, setCopied] = useState<string | null>(null);

  const detection = useMemo(() => detectFormat(input), [input]);
  const { format, rgb, error } = detection;

  const handleCopy = useCallback(async (text: string, id: string) => {
    if (text === '—' || !text) return;
    await copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  }, []);

  const handleQuickColor = useCallback((color: string) => {
    setInput(color);
  }, []);

  // Derived output values
  const output = useMemo(() => {
    if (!rgb) return null;
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      colorHex: `color: ${hex};`,
      bgHex: `background-color: ${hex};`,
      cssVar: `--color-primary: ${hex};`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
      hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`,
    };
  }, [rgb]);

  const previewBorder = useMemo(() => {
    if (!rgb) return borderColor;
    return isLightColor(rgb.r, rgb.g, rgb.b) ? '#cbd5e1' : '#334155';
  }, [rgb]);

  const previewBg = useMemo(() => {
    if (!rgb) return '#e2e8f0';
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }, [rgb]);

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <h2 style={s.subtitle}>CSS Color Converter</h2>
        <p style={s.desc}>Enter a color value and get instant CSS-ready output in every format.</p>

        {/* Input */}
        <div style={s.inputGroup}>
          <label htmlFor="css-color-input" style={s.inputLabel}>Enter color value</label>
          <input
            id="css-color-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#ff6600, rgb(255,102,0), hsl(30,100%,50%) …"
            spellCheck={false}
            autoComplete="off"
            style={s.input}
          />
          <div style={s.detectBadge}>
            <span
              style={{
                ...s.badgeDot,
                ...(format ? s.badgeDotSuccess : {}),
                ...(error ? s.badgeDotError : {}),
              }}
            />
            {!input.trim()
              ? 'Waiting for input…'
              : error
                ? 'Error'
                : `${format} detected`}
          </div>
        </div>

        {/* Preview */}
        <div style={s.previewRow}>
          <div
            style={{
              ...s.preview,
              backgroundColor: previewBg,
              borderColor: previewBorder,
            }}
          />
          <div style={s.previewInfo}>
            <span style={s.detectedFormat}>{format || '—'}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorMsg}>{error}</div>
        )}

        {/* Results */}
        {output && (
          <div style={s.resultsGrid}>
            <ResultCard
              label="color: #hex"
              value={output.colorHex}
              copied={copied === 'color-hex'}
              onCopy={() => handleCopy(output.colorHex, 'color-hex')}
            />
            <ResultCard
              label="background-color: #hex"
              value={output.bgHex}
              copied={copied === 'bg-hex'}
              onCopy={() => handleCopy(output.bgHex, 'bg-hex')}
            />
            <ResultCard
              label="--color-primary: #hex"
              value={output.cssVar}
              copied={copied === 'cssvar'}
              onCopy={() => handleCopy(output.cssVar, 'cssvar')}
            />
            <ResultCard
              label="rgba(r,g,b)"
              value={output.rgba}
              copied={copied === 'rgba'}
              onCopy={() => handleCopy(output.rgba, 'rgba')}
            />
            <ResultCard
              label="hsla(h,s,l)"
              value={output.hsla}
              copied={copied === 'hsla'}
              onCopy={() => handleCopy(output.hsla, 'hsla')}
              fullWidth
            />
          </div>
        )}

        {/* Quick Samples */}
        <div style={s.quickSamples}>
          <span style={s.quickLabel}>Try an example:</span>
          <div style={s.quickBtns}>
            {QUICK_COLORS.map((c) => (
              <button
                key={c}
                style={{ ...s.quickBtn, backgroundColor: c }}
                onClick={() => handleQuickColor(c)}
                title={c}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Result Card Sub-component ===== */
function ResultCard({
  label,
  value,
  copied,
  onCopy,
  fullWidth,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        ...sResultCard.card,
        ...(fullWidth ? sResultCard.fullWidth : {}),
      }}
    >
      <div style={sResultCard.label}>{label}</div>
      <div style={sResultCard.row}>
        <code style={sResultCard.value}>{value}</code>
        <button
          style={sResultCard.copyBtn}
          onClick={onCopy}
          title="Copy"
          type="button"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
    </div>
  );
}

const sResultCard: Record<string, React.CSSProperties> = {
  card: {
    background: bgSubtle,
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    padding: '0.75rem',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  label: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.375rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  value: {
    fontFamily: monoFont,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: textPrimary,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    background: 'transparent',
    padding: '0',
    margin: '0',
    flex: 1,
    minWidth: 0,
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
