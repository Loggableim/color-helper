'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  isValidHex,
  normalizeHex,
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  hexToRgb,
  rgbToHex,
} from '../utils/color';

/* ===== Design Tokens ===== */

const primary = '#6366f1';
const borderColor = '#e2e8f0';
const textPrimary = '#1e293b';
const textSecondary = '#64748b';
const bgSubtle = '#f8fafc';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Inline Styles ===== */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '640px',
    margin: '0 auto',
    fontFamily,
  },
  card: {
    background: '#ffffff',
    border: `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding: '1.5rem',
    marginBottom: '1.25rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: textPrimary,
    marginBottom: '1.25rem',
    letterSpacing: '-0.01em',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    minWidth: '5.5rem',
  },
  hexInput: {
    flex: 1,
    minWidth: '100px',
    padding: '0.625rem 0.875rem',
    fontSize: '0.9375rem',
    fontFamily: monoFont,
    color: textPrimary,
    background: '#ffffff',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  hexInputError: {
    borderColor: '#ef4444',
  },
  colorPicker: {
    width: '48px',
    height: '48px',
    padding: '0',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    cursor: 'pointer',
    background: 'none',
    flexShrink: 0,
  },
  swapBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    lineHeight: 1,
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    cursor: 'pointer',
    background: '#ffffff',
    color: textPrimary,
    fontFamily,
    marginBottom: '0',
    transition: 'all 0.15s ease',
  },
  /* Live Preview */
  previewBox: {
    width: '100%',
    minHeight: '160px',
    borderRadius: '12px',
    border: `1px solid ${borderColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    transition: 'background 0.15s ease, color 0.15s ease',
    padding: '2rem',
  },
  previewText: {
    fontSize: '1.5rem',
    fontWeight: 600,
    textAlign: 'center' as const,
    lineHeight: 1.5,
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.01em',
  },
  previewSub: {
    fontSize: '0.875rem',
    fontWeight: 400,
    opacity: 0.65,
    margin: 0,
    textAlign: 'center' as const,
  },
  /* Results Section */
  ratioValue: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: textPrimary,
    fontFamily: monoFont,
    letterSpacing: '-0.03em',
    marginBottom: '0.125rem',
    lineHeight: 1,
  },
  ratioLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '1rem',
  },
  badgeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    borderRadius: '100px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    lineHeight: 1,
    background: bgSubtle,
  },
  badgeLabel: {
    color: textPrimary,
  },
  badgePass: {
    color: '#166534',
    background: '#dcfce7',
    padding: '0.1875rem 0.625rem',
    borderRadius: '100px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  badgeFail: {
    color: '#991b1b',
    background: '#fef2f2',
    padding: '0.1875rem 0.625rem',
    borderRadius: '100px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  explanation: {
    fontSize: '0.8125rem',
    color: textSecondary,
    lineHeight: 1.6,
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: bgSubtle,
    borderRadius: '10px',
    border: `1px solid ${borderColor}`,
  },
  divider: {
    height: '1px',
    background: borderColor,
    margin: '1rem 0',
    border: 'none',
  },
  errorMsg: {
    color: '#ef4444',
    fontSize: '0.8125rem',
    fontWeight: 500,
    marginTop: '0.25rem',
  },
};

/* ===== StatusBadge ===== */

interface StatusBadgeProps {
  pass: boolean;
}

function StatusBadge({ pass }: StatusBadgeProps) {
  return (
    <span
      style={{
        ...(pass ? styles.badgePass : styles.badgeFail),
      }}
      aria-label={pass ? 'Pass' : 'Fail'}
    >
      {pass ? '✓ Pass' : '✗ Fail'}
    </span>
  );
}

/* ===== ContrastChecker Component ===== */

export default function ContrastChecker() {
  const [fgHex, setFgHex] = useState('#1e293b');
  const [bgHex, setBgHex] = useState('#ffffff');
  const [fgInput, setFgInput] = useState('#1e293b');
  const [bgInput, setBgInput] = useState('#ffffff');
  const [fgError, setFgError] = useState(false);
  const [bgError, setBgError] = useState(false);

  const validFg = isValidHex(fgHex) ? normalizeHex(fgHex) : null;
  const validBg = isValidHex(bgHex) ? normalizeHex(bgHex) : null;
  const bothValid = validFg && validBg;

  const ratio = bothValid ? getContrastRatio(validFg!, validBg!) : null;

  const handleFgNative = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFgHex(val);
    setFgInput(val);
    setFgError(false);
  }, []);

  const handleBgNative = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBgHex(val);
    setBgInput(val);
    setBgError(false);
  }, []);

  const handleFgInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFgInput(val);
    if (isValidHex(val)) {
      const norm = normalizeHex(val);
      setFgHex(norm);
      setFgInput(norm);
      setFgError(false);
    } else {
      setFgError(val.length > 2);
      if (val.startsWith('#') && val.length <= 7) {
        setFgHex(val);
      }
    }
  }, []);

  const handleBgInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBgInput(val);
    if (isValidHex(val)) {
      const norm = normalizeHex(val);
      setBgHex(norm);
      setBgInput(norm);
      setBgError(false);
    } else {
      setBgError(val.length > 2);
      if (val.startsWith('#') && val.length <= 7) {
        setBgHex(val);
      }
    }
  }, []);

  const handleSwap = useCallback(() => {
    setFgHex(bgHex);
    setFgInput(bgInput);
    setBgHex(fgHex);
    setBgInput(fgInput);
    setFgError(false);
    setBgError(false);
  }, [fgHex, bgHex, fgInput, bgInput]);

  /* ---- Accessible Text Color Suggestion ---- */
  const suggestedTextColor = useMemo<{ hex: string; ratio: number; label: string } | null>(() => {
    if (!validBg) return null;

    const candidates: { hex: string; label: string }[] = [
      { hex: '#ffffff', label: 'White' },
      { hex: '#000000', label: 'Black' },
    ];

    // If we have a valid foreground, also try darkened/lightened variants
    if (validFg) {
      const rgb = hexToRgb(validFg);
      if (rgb) {
        // Darkened: reduce luminance by 40%
        const dark = rgbToHex(
          Math.round(rgb.r * 0.4),
          Math.round(rgb.g * 0.4),
          Math.round(rgb.b * 0.4),
        );
        candidates.push({ hex: dark, label: 'Darker shade' });

        // Lightened: blend with white (60% white)
        const light = rgbToHex(
          Math.round(rgb.r + (255 - rgb.r) * 0.6),
          Math.round(rgb.g + (255 - rgb.g) * 0.6),
          Math.round(rgb.b + (255 - rgb.b) * 0.6),
        );
        candidates.push({ hex: light, label: 'Lighter tint' });
      }
    }

    let best = { hex: '#ffffff', ratio: 0, label: 'White' };
    for (const c of candidates) {
      const r = getContrastRatio(c.hex, validBg);
      if (r > best.ratio) {
        best = { hex: c.hex, ratio: r, label: c.label };
      }
    }
    return best;
  }, [validFg, validBg]);

  const displayFg = validFg || fgHex.startsWith('#') ? fgHex : '#1e293b';
  const displayBg = validBg || bgHex.startsWith('#') ? bgHex : '#ffffff';

  return (
    <div style={styles.wrapper}>
      {/* Color Inputs Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Color Contrast Checker</h2>

        {/* Foreground */}
        <div style={styles.colorRow}>
          <span style={styles.label}>Text Color</span>
          <input
            type="color"
            value={validFg && isValidHex(fgHex) ? normalizeHex(fgHex) : '#1e293b'}
            onChange={handleFgNative}
            style={styles.colorPicker}
            aria-label="Foreground color picker"
          />
          <input
            type="text"
            value={fgInput}
            onChange={handleFgInput}
            placeholder="#1e293b"
            maxLength={7}
            style={{
              ...styles.hexInput,
              ...(fgError ? styles.hexInputError : {}),
            }}
            aria-label="Foreground hex value"
          />
        </div>

        {/* Background */}
        <div style={styles.colorRow}>
          <span style={styles.label}>Background</span>
          <input
            type="color"
            value={validBg && isValidHex(bgHex) ? normalizeHex(bgHex) : '#ffffff'}
            onChange={handleBgNative}
            style={styles.colorPicker}
            aria-label="Background color picker"
          />
          <input
            type="text"
            value={bgInput}
            onChange={handleBgInput}
            placeholder="#ffffff"
            maxLength={7}
            style={{
              ...styles.hexInput,
              ...(bgError ? styles.hexInputError : {}),
            }}
            aria-label="Background hex value"
          />
        </div>

        {/* Swap Button */}
        <div style={{ marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={handleSwap}
            style={styles.swapBtn}
            aria-label="Swap foreground and background colors"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
              (e.currentTarget as HTMLButtonElement).style.color = primary;
              (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
              (e.currentTarget as HTMLButtonElement).style.color = textPrimary;
              (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
            }}
          >
            ⇄ Swap Colors
          </button>
        </div>

        {/* Error messages */}
        {fgError && (
          <div style={styles.errorMsg}>
            Invalid foreground color
          </div>
        )}
        {bgError && (
          <div style={styles.errorMsg}>
            Invalid background color
          </div>
        )}
      </div>

      {/* Live Preview Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Live Preview</h2>
        <div
          style={{
            ...styles.previewBox,
            color: displayFg,
            backgroundColor: displayBg,
          }}
        >
          <div>
            <p style={styles.previewText}>
              The quick brown fox jumps over the lazy dog
            </p>
            <p style={styles.previewSub}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ • abcdefghijklmnopqrstuvwxyz • 0123456789
            </p>
          </div>
        </div>
      </div>

      {/* Results Card */}
      {bothValid && ratio !== null && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Contrast Results</h2>

          {/* Ratio */}
          <div style={styles.ratioValue}>{ratio.toFixed(2)}:1</div>
          <div style={styles.ratioLabel}>Contrast Ratio</div>

          <hr style={styles.divider} />

          {/* WCAG Badges */}
          <div style={styles.badgeGrid}>
            <div style={styles.badge}>
              <span style={styles.badgeLabel}>AA Normal Text</span>
              <StatusBadge pass={meetsWcagAA(ratio, false)} />
            </div>
            <div style={styles.badge}>
              <span style={styles.badgeLabel}>AA Large Text</span>
              <StatusBadge pass={meetsWcagAA(ratio, true)} />
            </div>
            <div style={styles.badge}>
              <span style={styles.badgeLabel}>AAA Normal Text</span>
              <StatusBadge pass={meetsWcagAAA(ratio, false)} />
            </div>
            <div style={styles.badge}>
              <span style={styles.badgeLabel}>AAA Large Text</span>
              <StatusBadge pass={meetsWcagAAA(ratio, true)} />
            </div>
          </div>

          {/* Explanation */}
          <div style={styles.explanation}>
            <strong>About WCAG Contrast Ratios:</strong>{' '}
            The Web Content Accessibility Guidelines (WCAG) define minimum contrast
            ratios for text. <strong>AA</strong> requires 4.5:1 for normal text and
            3:1 for large text. <strong>AAA</strong> requires 7:1 for normal text and
            4.5:1 for large text. Large text is defined as at least 18pt (24px) or
            14pt (19px) bold.
          </div>

          {/* Suggest Accessible Text Color */}
          {suggestedTextColor && (
            <>
              <hr style={styles.divider} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: textPrimary, flex: 1, minWidth: '140px' }}>
                  Suggested Text Color
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    border: `1.5px solid ${borderColor}`,
                    background: suggestedTextColor.hex,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontFamily: monoFont, fontSize: '0.8125rem', color: textPrimary, fontWeight: 600 }}>
                  {suggestedTextColor.hex}
                </div>
                <div style={{ fontSize: '0.75rem', color: textSecondary, fontWeight: 500 }}>
                  {suggestedTextColor.ratio.toFixed(2)}:1 · {suggestedTextColor.label}
                </div>
                <button
                  type="button"
                  style={{
                    ...styles.swapBtn,
                    marginBottom: 0,
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
                    (e.currentTarget as HTMLButtonElement).style.color = primary;
                    (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
                    (e.currentTarget as HTMLButtonElement).style.color = textPrimary;
                    (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
                  }}
                  onClick={() => {
                    setFgHex(suggestedTextColor.hex);
                    setFgInput(suggestedTextColor.hex);
                    setFgError(false);
                  }}
                  aria-label="Apply suggested text color"
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
