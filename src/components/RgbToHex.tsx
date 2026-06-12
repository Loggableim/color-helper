'use client';

import React, { useState, useCallback } from 'react';
import { rgbToHex, clampRgb, copyToClipboard } from '../utils/color';

type RgbInput = { r: string; g: string; b: string };

const PRESETS: { label: string; r: number; g: number; b: number }[] = [
  { label: 'Red',     r: 255, g: 0,   b: 0   },
  { label: 'Green',   r: 0,   g: 255, b: 0   },
  { label: 'Blue',    r: 0,   g: 0,   b: 255 },
  { label: 'White',   r: 255, g: 255, b: 255 },
  { label: 'Black',   r: 0,   g: 0,   b: 0   },
  { label: 'Gray',    r: 128, g: 128, b: 128 },
  { label: 'Yellow',  r: 255, g: 255, b: 0   },
  { label: 'Cyan',    r: 0,   g: 255, b: 255 },
  { label: 'Magenta', r: 255, g: 0,   b: 255 },
  { label: 'Orange',  r: 255, g: 165, b: 0   },
  { label: 'Purple',  r: 128, g: 0,   b: 128 },
];

const LABELS: Record<string, string> = { r: 'R', g: 'G', b: 'B' };

const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '520px',
    margin: '0 auto',
    fontFamily,
    color: textPrimary,
  },
  card: {
    background: 'var(--color-bg-card, #ffffff)',
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    border: `1px solid ${borderColor}`,
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
    margin: '0 0 4px 0',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.8125rem',
    color: textSecondary,
    margin: '0 0 1.25rem 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    color: textSecondary,
  },
  inputRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  textInput: {
    width: '100%',
    padding: '0.5rem 0',
    border: 'none',
    borderBottom: '2px solid #cbd5e1',
    fontSize: '1.125rem',
    fontWeight: 600,
    textAlign: 'center' as const,
    outline: 'none',
    background: 'transparent',
    color: textPrimary,
    fontFamily: monoFont,
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box' as const,
  },
  textInputError: {
    borderBottomColor: '#ef4444',
  },
  rangeInput: {
    width: '100%',
    height: '6px',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
    background: borderColor,
  },
  errorText: {
    fontSize: '0.6875rem',
    color: '#ef4444',
    margin: 0,
    minHeight: '14px',
    lineHeight: '14px',
  },
  previewSection: {
    marginTop: '1.25rem',
    padding: '1rem',
    borderRadius: '10px',
    background: bgSubtle,
    border: `1px solid ${borderColor}`,
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  previewSwatch: {
    width: '56px',
    height: '56px',
    borderRadius: '10px',
    border: `2px solid ${borderColor}`,
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
  previewInfo: {
    flex: 1,
    minWidth: 0,
  },
  hexLabel: {
    fontSize: '0.6875rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: textSecondary,
    marginBottom: '2px',
  },
  hexValue: {
    fontSize: '1.375rem',
    fontWeight: 700,
    fontFamily: monoFont,
    color: '#0f172a',
    letterSpacing: '0.02em',
  },
  copyButton: {
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    border: `1px solid ${borderColor}`,
    background: 'var(--color-bg-card, #ffffff)',
    color: textSecondary,
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontFamily,
    lineHeight: 1,
  },
  copyButtonCopied: {
    background: '#10b981',
    borderColor: '#10b981',
    color: '#ffffff',
  },
  presetsSection: {
    marginTop: '1.25rem',
  },
  presetsLabel: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    marginBottom: '0.625rem',
  },
  presetsGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  presetChip: {
    padding: '0.375rem 0.75rem',
    borderRadius: '20px',
    border: `1px solid ${borderColor}`,
    background: 'var(--color-bg-card, #ffffff)',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    lineHeight: '20px',
    fontFamily,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
};

/* Range slider custom styling */
const rangeSliderStyle = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${primary};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${primary};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  input[type="range"]:focus {
    outline: 2px solid ${primary}40;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export default function RgbToHex() {
  const [textInputs, setTextInputs] = useState<RgbInput>({ r: '128', g: '128', b: '128' });
  const [values, setValues] = useState<{ r: number; g: number; b: number }>({ r: 128, g: 128, b: 128 });
  const [errors, setErrors] = useState<{ r: string | null; g: string | null; b: string | null }>({
    r: null, g: null, b: null,
  });
  const [copied, setCopied] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const hex = rgbToHex(values.r, values.g, values.b);

  const sliderBg = (ch: 'r' | 'g' | 'b') => {
    const v = values[ch];
    if (ch === 'r') return `linear-gradient(to right, #fecaca 0%, #ef4444 ${v / 2.55}%, ${borderColor} ${v / 2.55}%)`;
    if (ch === 'g') return `linear-gradient(to right, #bbf7d0 0%, #22c55e ${v / 2.55}%, ${borderColor} ${v / 2.55}%)`;
    return `linear-gradient(to right, #bfdbfe 0%, #3b82f6 ${v / 2.55}%, ${borderColor} ${v / 2.55}%)`;
  };

  const parseAndValidate = useCallback((ch: 'r' | 'g' | 'b', raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      setErrors(prev => ({ ...prev, [ch]: null }));
      return;
    }
    const num = Number(trimmed);
    if (isNaN(num) || !Number.isFinite(num)) {
      setErrors(prev => ({ ...prev, [ch]: 'Must be a number' }));
      return;
    }
    if (num < 0 || num > 255) {
      setErrors(prev => ({ ...prev, [ch]: 'Must be 0–255' }));
      return;
    }
    if (!Number.isInteger(num)) {
      setErrors(prev => ({ ...prev, [ch]: 'Must be a whole number' }));
      return;
    }
    setErrors(prev => ({ ...prev, [ch]: null }));
    const clamped = clampRgb(num);
    setValues(prev => ({ ...prev, [ch]: clamped }));
  }, []);

  const handleTextChange = useCallback((ch: 'r' | 'g' | 'b', value: string) => {
    setTextInputs(prev => ({ ...prev, [ch]: value }));
    parseAndValidate(ch, value);
  }, [parseAndValidate]);

  const handleSliderChange = useCallback((ch: 'r' | 'g' | 'b', value: number) => {
    const clamped = clampRgb(value);
    setValues(prev => ({ ...prev, [ch]: clamped }));
    setTextInputs(prev => ({ ...prev, [ch]: String(clamped) }));
    setErrors(prev => ({ ...prev, [ch]: null }));
  }, []);

  const handlePreset = useCallback((r: number, g: number, b: number) => {
    setValues({ r, g, b });
    setTextInputs({ r: String(r), g: String(g), b: String(b) });
    setErrors({ r: null, g: null, b: null });
  }, []);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(hex);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [hex]);

  const isInputError = (ch: 'r' | 'g' | 'b') => errors[ch] !== null;

  return (
    <div style={styles.container}>
      <style>{rangeSliderStyle}</style>

      <div style={styles.card}>
        <h2 style={styles.title}>RGB → Hex Converter</h2>
        <p style={styles.subtitle}>
          Enter RGB values or use the sliders to get the corresponding hex code
        </p>

        {/* Text Inputs */}
        <div style={styles.grid}>
          {(['r', 'g', 'b'] as const).map(ch => (
            <div key={ch} style={styles.fieldGroup}>
              <label style={styles.label} htmlFor={`rgb-${ch}`}>
                {LABELS[ch]}
              </label>
              <div style={styles.inputRow}>
                <input
                  id={`rgb-${ch}`}
                  type="text"
                  inputMode="numeric"
                  value={textInputs[ch]}
                  onChange={e => handleTextChange(ch, e.target.value)}
                  onFocus={() => setFocusedInput(ch)}
                  onBlur={() => setFocusedInput(null)}
                  aria-invalid={isInputError(ch)}
                  aria-describedby={isInputError(ch) ? `err-${ch}` : undefined}
                  style={{
                    ...styles.textInput,
                    ...(isInputError(ch) ? styles.textInputError : {}),
                    ...(focusedInput === ch && !isInputError(ch) ? { borderBottomColor: primary } : {}),
                  }}
                />
                <span style={styles.errorText} id={`err-${ch}`} role="alert">
                  {errors[ch] ?? ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '4px' }}>
          {(['r', 'g', 'b'] as const).map(ch => {
            const colorName = ch === 'r' ? 'red' : ch === 'g' ? 'green' : 'blue';
            return (
              <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  width: '16px',
                  color: ch === 'r' ? '#dc2626' : ch === 'g' ? '#16a34a' : '#2563eb',
                  textTransform: 'uppercase',
                  fontFamily: monoFont,
                }}>
                  {LABELS[ch]}
                </span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={values[ch]}
                  onChange={e => handleSliderChange(ch, Number(e.target.value))}
                  aria-label={`${colorName} value`}
                  style={{
                    ...styles.rangeInput,
                    background: sliderBg(ch),
                  }}
                />
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  fontFamily: monoFont,
                  color: textSecondary,
                  minWidth: '32px',
                  textAlign: 'right',
                }}>
                  {values[ch]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Color Preview & Copy */}
        <div style={styles.previewSection}>
          <div
            style={{
              ...styles.previewSwatch,
              backgroundColor: hex,
            }}
            role="img"
            aria-label={`Color preview: ${hex}`}
          />
          <div style={styles.previewInfo}>
            <div style={styles.hexLabel}>HEX Code</div>
            <div style={styles.hexValue}>{hex}</div>
          </div>
          <button
            onClick={handleCopy}
            onMouseEnter={e => {
              if (!copied) {
                (e.currentTarget as HTMLButtonElement).style.background = bgSubtle;
                (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
                (e.currentTarget as HTMLButtonElement).style.color = primary;
              }
            }}
            onMouseLeave={e => {
              if (!copied) {
                (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
                (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
                (e.currentTarget as HTMLButtonElement).style.color = textSecondary;
              }
            }}
            style={{
              ...styles.copyButton,
              ...(copied ? styles.copyButtonCopied : {}),
            }}
            aria-label={copied ? 'Copied!' : 'Copy HEX code to clipboard'}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        {/* Presets */}
        <div style={styles.presetsSection}>
          <div style={styles.presetsLabel}>Quick Select</div>
          <div style={styles.presetsGrid}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => handlePreset(p.r, p.g, p.b)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
                  (e.currentTarget as HTMLButtonElement).style.color = primary;
                  (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
                  (e.currentTarget as HTMLButtonElement).style.color = '#334155';
                  (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
                }}
                style={styles.presetChip}
                aria-label={`Set to ${p.label}: RGB(${p.r}, ${p.g}, ${p.b})`}
              >
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: rgbToHex(p.r, p.g, p.b),
                  border: '1px solid rgba(0,0,0,0.1)',
                  verticalAlign: 'middle',
                }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
