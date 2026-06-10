'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  generateComplementaryPalette,
  generateAnalogousPalette,
  generateTriadicPalette,
  generateMonochromePalette,
  generateTintsAndShades,
  copyToClipboard,
  normalizeHex,
  isValidHex,
  hexToRgb,
  getRelativeLuminance,
  type Palette,
} from '../utils/color';

/* ---------- helpers ---------- */

function textColorForBg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.5 ? '#111111' : '#f0f0f0';
}

/* ---------- design tokens ---------- */

const primary = '#6366f1';
const borderColor = '#e2e8f0';
const textPrimary = '#1e293b';
const textSecondary = '#64748b';
const bgSubtle = '#f8fafc';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ---------- styles ---------- */

const styles = {
  wrapper: {
    maxWidth: 800,
    margin: '0 auto',
    fontFamily,
    color: textPrimary,
  } as React.CSSProperties,
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '0.875rem',
    color: textSecondary,
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.75rem',
    flexWrap: 'wrap' as const,
  },
  colorInput: {
    width: 48,
    height: 48,
    padding: 0,
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    cursor: 'pointer',
    background: 'none',
    flexShrink: 0,
  } as React.CSSProperties,
  hexInput: {
    width: 120,
    padding: '0.5rem 0.75rem',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontFamily: monoFont,
    outline: 'none',
    background: '#ffffff',
    color: textPrimary,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,
  hexInputError: {
    borderColor: '#ef4444',
  } as React.CSSProperties,
  card: {
    background: '#ffffff',
    borderRadius: '14px',
    padding: '1.25rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    border: `1px solid ${borderColor}`,
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  paletteName: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
  } as React.CSSProperties,
  copyAllBtn: {
    fontSize: '0.75rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    background: '#ffffff',
    cursor: 'pointer',
    color: textSecondary,
    fontWeight: 600,
    fontFamily,
    transition: 'all 0.15s ease',
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  } as React.CSSProperties,
  colorRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  colorBlock: {
    flex: '1 0 56px',
    height: 72,
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontFamily: monoFont,
    fontWeight: 600,
    transition: 'transform 0.12s ease, box-shadow 0.12s ease',
    border: '1px solid rgba(0,0,0,0.06)',
    position: 'relative' as const,
    userSelect: 'none' as const,
    minWidth: 0,
  } as React.CSSProperties,
  toast: {
    position: 'fixed' as const,
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1e293b',
    color: '#f1f5f9',
    padding: '0.6rem 1.2rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    zIndex: 9999,
    transition: 'opacity 0.25s, transform 0.25s',
    pointerEvents: 'none' as const,
    fontFamily,
  } as React.CSSProperties,
  errorText: {
    fontSize: '0.8rem',
    color: '#ef4444',
    margin: '0.25rem 0 0 0',
  } as React.CSSProperties,
};

/* ---------- component ---------- */

export default function PaletteGenerator() {
  const [baseColor, setBaseColor] = useState('#3B82F6');
  const [hexInput, setHexInput] = useState('3B82F6');
  const [hexError, setHexError] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- toast ---- */
  const showFeedback = useCallback((msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(msg);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  /* ---- hex input handling ---- */
  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/^#/, '');
      setHexInput(raw);
      const withHash = '#' + raw;
      if (raw.length === 3 || raw.length === 6) {
        if (isValidHex(withHash)) {
          setHexError('');
          setBaseColor(normalizeHex(withHash));
          return;
        }
      }
      if (raw.length >= 6) {
        setHexError('Invalid hex value');
      } else {
        setHexError('');
      }
    },
    [],
  );

  const handleColorPicker = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setBaseColor(v);
      setHexInput(v.replace('#', ''));
      setHexError('');
    },
    [],
  );

  /* ---- palettes ---- */
  const palettes = useMemo<Palette[]>(() => {
    const valid = isValidHex(baseColor);
    if (!valid) return [];
    return [
      generateComplementaryPalette(baseColor),
      generateAnalogousPalette(baseColor),
      generateTriadicPalette(baseColor),
      generateMonochromePalette(baseColor),
      generateTintsAndShades(baseColor),
    ];
  }, [baseColor]);

  /* ---- copy actions ---- */
  const handleCopyColor = useCallback(
    async (hex: string) => {
      const ok = await copyToClipboard(hex);
      if (ok) showFeedback(`Copied ${hex}`);
    },
    [showFeedback],
  );

  const handleCopyAll = useCallback(
    async (colors: string[]) => {
      const text = colors.join(', ');
      const ok = await copyToClipboard(text);
      if (ok) showFeedback(`Copied palette (${colors.length} colors)`);
    },
    [showFeedback],
  );

  /* ---- render ---- */
  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Color Palette Generator</h1>
      <p style={styles.subtitle}>
        Pick a base color and explore harmony palettes.
      </p>

      {/* Controls */}
      <div style={styles.controls}>
        <input
          type="color"
          value={baseColor}
          onChange={handleColorPicker}
          style={styles.colorInput}
          aria-label="Base color picker"
        />
        <div>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="HEX value"
            maxLength={7}
            style={{
              ...styles.hexInput,
              ...(hexError ? styles.hexInputError : {}),
            }}
            aria-label="HEX input"
            aria-invalid={!!hexError}
          />
          {hexError && <p style={styles.errorText}>{hexError}</p>}
        </div>
      </div>

      {/* Palettes */}
      {palettes.map((palette) => (
        <div key={palette.name} style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.paletteName}>{palette.name}</h2>
            <button
              type="button"
              onClick={() => handleCopyAll(palette.colors)}
              style={styles.copyAllBtn}
              aria-label={`Copy all ${palette.name} colors`}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
                (e.currentTarget as HTMLButtonElement).style.color = primary;
                (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
                (e.currentTarget as HTMLButtonElement).style.color = textSecondary;
                (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy All
            </button>
          </div>
          <div style={styles.colorRow}>
            {palette.colors.map((color, idx) => {
              const textClr = textColorForBg(color);
              return (
                <button
                  key={`${palette.name}-${idx}`}
                  onClick={() => handleCopyColor(color)}
                  style={{
                    ...styles.colorBlock,
                    background: color,
                    color: textClr,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                  aria-label={`Copy ${color}`}
                  title={color}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Toast feedback */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          ...styles.toast,
          opacity: feedback ? 1 : 0,
          transform: feedback
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(12px)',
        }}
      >
        {feedback ?? '\u00A0'}
      </div>
    </div>
  );
}
