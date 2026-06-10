'use client';

import React, { useState, useCallback } from 'react';

type Direction = 'to right' | 'to bottom' | 'to bottom right' | 'to left' | 'to top' | 'diagonal';

const DIRECTION_ANGLES: Record<Direction, string> = {
  'to right': '90deg',
  'to bottom': '180deg',
  'to bottom right': '135deg',
  'to left': '270deg',
  'to top': '0deg',
  diagonal: '45deg',
};

const DIRECTION_LABELS: Record<Direction, string> = {
  'to right': '→ Right',
  'to bottom': '↓ Bottom',
  'to bottom right': '↘ Bottom Right',
  'to left': '← Left',
  'to top': '↑ Top',
  diagonal: '↗ Diagonal',
};

const DEFAULT_COLORS = ['#6366f1', '#a855f7'];

/* ===== Design Tokens ===== */

const primary = '#6366f1';
const borderColor = '#e2e8f0';
const textPrimary = '#1e293b';
const textSecondary = '#64748b';
const bgSubtle = '#f8fafc';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    fontFamily,
    color: textPrimary,
  },
  card: {
    background: '#ffffff',
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
  preview: {
    width: '100%',
    height: '240px',
    borderRadius: '12px',
    border: `1px solid ${borderColor}`,
    marginBottom: '1.25rem',
    transition: 'background 0.2s ease',
  },
  colorsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '1.25rem',
  },
  colorRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  colorPicker: {
    width: '44px',
    height: '44px',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    cursor: 'pointer',
    padding: 0,
    background: 'none',
    flexShrink: 0,
  },
  hexInput: {
    flex: 1,
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    background: '#ffffff',
    color: textPrimary,
    fontFamily: monoFont,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  hexInputError: {
    borderColor: '#ef4444',
    background: '#fef2f2',
  },
  removeBtn: {
    width: '36px',
    height: '36px',
    border: 'none',
    borderRadius: '8px',
    background: '#fef2f2',
    color: '#ef4444',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    lineHeight: 1,
    transition: 'background 0.15s ease',
  },
  addColorBtn: {
    padding: '0.625rem 1rem',
    border: `1.5px dashed #cbd5e1`,
    borderRadius: '10px',
    background: 'transparent',
    color: textSecondary,
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    alignSelf: 'flex-start',
    fontFamily,
    lineHeight: 1,
  },
  directionSection: {
    marginBottom: '1.25rem',
  },
  directionLabel: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    marginBottom: '0.625rem',
  },
  directionGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  directionBtn: {
    padding: '0.5rem 0.875rem',
    borderRadius: '8px',
    border: `1.5px solid ${borderColor}`,
    background: '#ffffff',
    color: textSecondary,
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily,
    lineHeight: 1,
  },
  directionBtnActive: {
    borderColor: primary,
    background: '#eef2ff',
    color: primary,
  },
  cssSection: {
    background: '#0f172a',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid #1e293b',
  },
  cssCode: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: '0.8125rem',
    fontFamily: monoFont,
    lineHeight: '22px',
    wordBreak: 'break-all' as const,
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
  },
  copyBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    border: 'none',
    background: primary,
    color: '#ffffff',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '36px',
    fontFamily,
    lineHeight: 1,
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
  },
  copyBtnCopied: {
    background: '#10b981',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
  },
  sectionLabel: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    marginBottom: '0.5rem',
  },
};

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

export default function GradientGenerator() {
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [direction, setDirection] = useState<Direction>('to right');
  const [errors, setErrors] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const gradientAngle = DIRECTION_ANGLES[direction];
  const colorStops = colors.join(', ');
  const gradientCss = `background: linear-gradient(${gradientAngle}, ${colorStops});`;
  const previewBackground = `linear-gradient(${gradientAngle}, ${colorStops})`;

  const handleColorChange = useCallback((index: number, value: string) => {
    setColors(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && !isValidHex(value)) {
      setErrors(prev => ({ ...prev, [index]: true }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  }, []);

  const handleColorPickerChange = useCallback((index: number, value: string) => {
    setColors(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setErrors(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const addColor = useCallback(() => {
    setColors(prev => [...prev, '#8b5cf6']);
  }, []);

  const removeColor = useCallback((index: number) => {
    setColors(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(gradientCss);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = gradientCss;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [gradientCss]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Gradient Generator</h2>
        <p style={styles.subtitle}>
          Create and customize linear gradients with your chosen colors
        </p>

        {/* Live Preview */}
        <div
          style={{
            ...styles.preview,
            background: previewBackground,
          }}
          role="img"
          aria-label={`Gradient preview: ${gradientCss}`}
        />

        {/* Color Inputs */}
        <div style={styles.colorsSection}>
          <div style={styles.sectionLabel}>Colors</div>
          {colors.map((color, index) => (
            <div key={index} style={styles.colorRow}>
              <input
                type="color"
                value={color}
                onChange={e => handleColorPickerChange(index, e.target.value)}
                aria-label={`Color ${index + 1} picker`}
                style={styles.colorPicker}
              />
              <input
                type="text"
                value={color}
                onChange={e => handleColorChange(index, e.target.value)}
                placeholder="#000000"
                maxLength={7}
                aria-label={`Color ${index + 1} hex value`}
                style={{
                  ...styles.hexInput,
                  ...(errors[index] ? styles.hexInputError : {}),
                }}
              />
              {colors.length > 2 && (
                <button
                  onClick={() => removeColor(index)}
                  style={styles.removeBtn}
                  aria-label={`Remove color ${index + 1}`}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {colors.length < 5 && (
            <button
              onClick={addColor}
              style={styles.addColorBtn}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
                (e.currentTarget as HTMLButtonElement).style.color = primary;
                (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e1';
                (e.currentTarget as HTMLButtonElement).style.color = textSecondary;
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Color
            </button>
          )}
        </div>

        {/* Direction Selector */}
        <div style={styles.directionSection}>
          <div style={styles.directionLabel}>Direction</div>
          <div style={styles.directionGrid}>
            {(Object.keys(DIRECTION_ANGLES) as Direction[]).map(dir => (
              <button
                key={dir}
                onClick={() => setDirection(dir)}
                style={{
                  ...styles.directionBtn,
                  ...(direction === dir ? styles.directionBtnActive : {}),
                }}
              >
                {DIRECTION_LABELS[dir]}
              </button>
            ))}
          </div>
        </div>

        {/* Generated CSS + Copy Button */}
        <div style={styles.cssSection}>
          <pre style={styles.cssCode}>{gradientCss}</pre>
          <button
            onClick={handleCopy}
            style={{
              ...styles.copyBtn,
              ...(copied ? styles.copyBtnCopied : {}),
            }}
            aria-label={copied ? 'Copied!' : 'Copy CSS code'}
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
                Copy CSS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
