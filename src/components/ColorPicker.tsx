'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  isValidHex,
  normalizeHex,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  copyToClipboard,
  type RGB,
  type HSL,
} from '../utils/color';

/* ===== Design Tokens ===== */

const primary = '#6366f1';
const primaryGradient = 'linear-gradient(135deg, #6366f1, #4f46e5)';
const borderColor = '#e2e8f0';
const textPrimary = '#1e293b';
const textSecondary = '#64748b';
const bgSubtle = '#f8fafc';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== CopyToast Component (same file) ===== */

interface CopyToastProps {
  message: string;
  visible: boolean;
}

function CopyToast({ message, visible }: CopyToastProps) {
  if (!visible) return null;

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1e293b',
    color: '#fff',
    padding: '0.625rem 1.25rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 500,
    zIndex: 100,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.12), 0 4px 6px -4px rgba(0,0,0,0.08)',
    fontFamily,
  };

  return (
    <div
      style={toastStyle}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

/* ===== Helpers ===== */

function generateRandomHex(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex(r, g, b);
}

function hslToString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function rgbToString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

const LS_KEY = 'ch-palette';

function loadPalette(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePalette(colors: string[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(colors));
}

/* ===== Inline Styles ===== */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '600px',
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
    marginBottom: '1rem',
    letterSpacing: '-0.01em',
  },
  previewBox: {
    width: '100%',
    height: '140px',
    borderRadius: '10px',
    border: `1px solid ${borderColor}`,
    transition: 'background 0.15s ease',
    marginBottom: '1rem',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  label: {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    marginBottom: '0.375rem',
  },
  labelRow: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: textPrimary,
    minWidth: '3.5rem',
  },
  input: {
    flex: 1,
    minWidth: '120px',
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
  inputError: {
    borderColor: '#ef4444',
  },
  colorInput: {
    width: '48px',
    height: '48px',
    padding: '0',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    cursor: 'pointer',
    background: 'none',
    flexShrink: 0,
  },
  buttonRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginBottom: '0.75rem',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    lineHeight: 1,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily,
  },
  btnPrimary: {
    background: primaryGradient,
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
  },
  btnSecondary: {
    background: '#ffffff',
    color: textPrimary,
    border: `1px solid ${borderColor}`,
  },
  btnGhost: {
    background: 'transparent',
    color: textSecondary,
    padding: '0.375rem 0.75rem',
  },
  paletteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
    gap: '0.375rem',
  },
  swatch: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '8px',
    border: `1.5px solid ${borderColor}`,
    cursor: 'pointer',
    transition: 'transform 0.12s ease, box-shadow 0.12s ease',
    position: 'relative' as const,
  },
  emptyPalette: {
    textAlign: 'center' as const,
    color: textSecondary,
    fontSize: '0.875rem',
    padding: '1rem 0',
  },
  colorValueGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  colorValue: {
    fontFamily: monoFont,
    fontSize: '0.8125rem',
    color: textPrimary,
    background: bgSubtle,
    padding: '0.375rem 0.625rem',
    borderRadius: '6px',
    border: `1px solid ${borderColor}`,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
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
    background: '#ffffff',
    color: textSecondary,
    transition: 'all 0.15s ease',
    fontFamily,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
  },
  errorText: {
    color: '#ef4444',
    fontSize: '0.8125rem',
    marginTop: '0.25rem',
    fontWeight: 500,
  },
  inputGroup: {
    marginBottom: '0.75rem',
  },
  flexRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    alignItems: 'flex-start',
  },
  flexGrow: {
    flex: 1,
    minWidth: '150px',
  },
  sectionDivider: {
    height: '1px',
    background: borderColor,
    margin: '1rem 0',
    border: 'none',
  },
};

/* ===== ColorPicker Component ===== */

export default function ColorPicker() {
  const [hex, setHex] = useState('#6366f1');
  const [rgb, setRgb] = useState<RGB>({ r: 99, g: 102, b: 241 });
  const [hsl, setHsl] = useState<HSL>({ h: 239, s: 84, l: 67 });
  const [hexInput, setHexInput] = useState('#6366f1');
  const [hexError, setHexError] = useState(false);
  const [palette, setPalette] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load palette on mount
  useEffect(() => {
    setPalette(loadPalette());
  }, []);

  // Sync from hex
  const syncFromHex = useCallback((newHex: string) => {
    const normalized = normalizeHex(newHex);
    const rgbVal = hexToRgb(normalized);
    if (rgbVal) {
      const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
      setHex(normalized);
      setHexInput(normalized);
      setRgb(rgbVal);
      setHsl(hslVal);
      setHexError(false);
    } else {
      setHexError(true);
    }
  }, []);

  // Handle native color input
  const handleNativeColor = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    syncFromHex(e.target.value);
  }, [syncFromHex]);

  // Handle manual hex input
  const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (isValidHex(val)) {
      syncFromHex(val);
    } else {
      setHexError(val.length > 2);
    }
  }, [syncFromHex]);

  // Handle RGB input
  const handleRgbInput = useCallback((channel: 'r' | 'g' | 'b', value: string) => {
    const num = parseInt(value, 10);
    const clamped = isNaN(num) ? 0 : Math.min(255, Math.max(0, num));
    const newRgb = { ...rgb, [channel]: clamped };
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    setHex(newHex);
    setHexInput(newHex);
    setHsl(newHsl);
    setHexError(false);
  }, [rgb]);

  // Handle HSL input
  const handleHslInput = useCallback((channel: 'h' | 's' | 'l', value: string) => {
    const num = parseInt(value, 10);
    let clamped: number;
    if (channel === 'h') {
      clamped = isNaN(num) ? 0 : ((num % 360) + 360) % 360;
    } else {
      clamped = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
    }
    const newHsl = { ...hsl, [channel]: clamped };
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setRgb(newRgb);
    setHex(newHex);
    setHexInput(newHex);
    setHexError(false);
  }, [hsl]);

  // Random color
  const handleRandom = useCallback(() => {
    const newHex = generateRandomHex();
    syncFromHex(newHex);
  }, [syncFromHex]);

  // Copy to clipboard
  const handleCopy = useCallback(async (text: string, label: string) => {
    await copyToClipboard(text);
    showToast(`${label} copié`);
  }, []);

  // Toast
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
    }, 1800);
  }, []);

  // Save to palette
  const handleSave = useCallback(() => {
    const updated = [...palette, hex];
    setPalette(updated);
    savePalette(updated);
    showToast('Couleur sauvegardée');
  }, [palette, hex, showToast]);

  // Load from palette
  const handleLoadFromPalette = useCallback((color: string) => {
    syncFromHex(color);
  }, [syncFromHex]);

  // Remove from palette
  const handleRemoveFromPalette = useCallback((e: React.MouseEvent, color: string) => {
    e.stopPropagation();
    const updated = palette.filter(c => c !== color);
    setPalette(updated);
    savePalette(updated);
  }, [palette]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const previewTextColor = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 128 ? '#1e293b' : '#f8fafc';

  return (
    <div style={styles.wrapper}>
      {/* Preview Card */}
      <div style={styles.card}>
        <div
          style={{
            ...styles.previewBox,
            background: hex,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '0.75rem',
          }}
        >
          <span
            style={{
              fontFamily: monoFont,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: previewTextColor,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              padding: '0.25rem 0.625rem',
              borderRadius: '6px',
              letterSpacing: '0.02em',
            }}
          >
            {hex.toUpperCase()}
          </span>
        </div>

        {/* Color Values */}
        <div style={styles.colorValueGroup}>
          <span style={styles.colorValue}>{hex.toUpperCase()}</span>
          <button
            style={styles.copyBtn}
            onClick={() => handleCopy(hex.toUpperCase(), 'HEX')}
            aria-label="Copier la valeur HEX"
            type="button"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
              (e.currentTarget as HTMLButtonElement).style.color = primary;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
              (e.currentTarget as HTMLButtonElement).style.color = textSecondary;
            }}
          >
            Copier HEX
          </button>
        </div>
        <div style={styles.colorValueGroup}>
          <span style={styles.colorValue}>{rgbToString(rgb)}</span>
          <button
            style={styles.copyBtn}
            onClick={() => handleCopy(rgbToString(rgb), 'RGB')}
            aria-label="Copier la valeur RGB"
            type="button"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
              (e.currentTarget as HTMLButtonElement).style.color = primary;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
              (e.currentTarget as HTMLButtonElement).style.color = textSecondary;
            }}
          >
            Copier RGB
          </button>
        </div>
        <div style={styles.colorValueGroup}>
          <span style={styles.colorValue}>{hslToString(hsl)}</span>
          <button
            style={styles.copyBtn}
            onClick={() => handleCopy(hslToString(hsl), 'HSL')}
            aria-label="Copier la valeur HSL"
            type="button"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
              (e.currentTarget as HTMLButtonElement).style.color = primary;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
              (e.currentTarget as HTMLButtonElement).style.color = textSecondary;
            }}
          >
            Copier HSL
          </button>
        </div>
      </div>

      {/* Picker Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Sélecteur de couleur</h2>

        {/* Native Color Picker */}
        <div style={styles.inputGroup}>
          <label htmlFor="native-color" style={styles.label}>
            Nuancier
          </label>
          <input
            id="native-color"
            type="color"
            value={hex}
            onChange={handleNativeColor}
            style={styles.colorInput}
            title="Choisir une couleur"
          />
        </div>

        {/* HEX Input */}
        <div style={styles.inputGroup}>
          <label htmlFor="hex-input" style={styles.label}>
            HEX
          </label>
          <div style={styles.inputRow}>
            <input
              id="hex-input"
              type="text"
              value={hexInput}
              onChange={handleHexInput}
              placeholder="#6366f1"
              style={{
                ...styles.input,
                ...(hexError ? styles.inputError : {}),
              }}
              aria-invalid={hexError}
              aria-describedby={hexError ? 'hex-error' : undefined}
              maxLength={7}
            />
          </div>
          {hexError && (
            <p id="hex-error" style={styles.errorText} role="alert">
              Format HEX invalide (ex: #6366f1)
            </p>
          )}
        </div>

        {/* RGB Inputs */}
        <div style={styles.inputGroup}>
          <span style={styles.label}>RGB</span>
          <div style={styles.flexRow}>
            {(['r', 'g', 'b'] as const).map((ch) => (
              <div key={ch} style={styles.flexGrow}>
                <label
                  htmlFor={`rgb-${ch}`}
                  style={{ ...styles.labelRow, fontSize: '0.75rem', marginBottom: '0.25rem' }}
                >
                  {ch.toUpperCase()}
                </label>
                <input
                  id={`rgb-${ch}`}
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) => handleRgbInput(ch, e.target.value)}
                  style={styles.input}
                  aria-label={`Valeur RGB ${ch.toUpperCase()}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* HSL Inputs */}
        <div style={styles.inputGroup}>
          <span style={styles.label}>HSL</span>
          <div style={styles.flexRow}>
            <div style={styles.flexGrow}>
              <label
                htmlFor="hsl-h"
                style={{ ...styles.labelRow, fontSize: '0.75rem', marginBottom: '0.25rem' }}
              >
                H
              </label>
              <input
                id="hsl-h"
                type="number"
                min={0}
                max={360}
                value={hsl.h}
                onChange={(e) => handleHslInput('h', e.target.value)}
                style={styles.input}
                aria-label="Valeur HSL Teinte (H)"
              />
            </div>
            <div style={styles.flexGrow}>
              <label
                htmlFor="hsl-s"
                style={{ ...styles.labelRow, fontSize: '0.75rem', marginBottom: '0.25rem' }}
              >
                S %
              </label>
              <input
                id="hsl-s"
                type="number"
                min={0}
                max={100}
                value={hsl.s}
                onChange={(e) => handleHslInput('s', e.target.value)}
                style={styles.input}
                aria-label="Valeur HSL Saturation (S)"
              />
            </div>
            <div style={styles.flexGrow}>
              <label
                htmlFor="hsl-l"
                style={{ ...styles.labelRow, fontSize: '0.75rem', marginBottom: '0.25rem' }}
              >
                L %
              </label>
              <input
                id="hsl-l"
                type="number"
                min={0}
                max={100}
                value={hsl.l}
                onChange={(e) => handleHslInput('l', e.target.value)}
                style={styles.input}
                aria-label="Valeur HSL Luminosité (L)"
              />
            </div>
          </div>
        </div>

        <hr style={styles.sectionDivider} />

        {/* Action Buttons */}
        <div style={styles.buttonRow}>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleRandom}
            type="button"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
            }}
          >
            🎲 Aléatoire
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={handleSave}
            type="button"
            disabled={hexError}
            onMouseEnter={e => {
              if (!hexError) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
                (e.currentTarget as HTMLButtonElement).style.color = primary;
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
              (e.currentTarget as HTMLButtonElement).style.color = textPrimary;
            }}
          >
            💾 Sauvegarder
          </button>
        </div>
      </div>

      {/* Palette Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Palette sauvegardée</h2>
        {palette.length === 0 ? (
          <p style={styles.emptyPalette}>
            Aucune couleur sauvegardée. Cliquez sur « Sauvegarder » pour en ajouter.
          </p>
        ) : (
          <div style={styles.paletteGrid} role="list" aria-label="Couleurs sauvegardées">
            {palette.map((color, index) => (
              <div
                key={`${color}-${index}`}
                role="listitem"
                style={{
                  ...styles.swatch,
                  background: color,
                }}
                onClick={() => handleLoadFromPalette(color)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLoadFromPalette(color);
                  }
                }}
                tabIndex={0}
                aria-label={`Couleur ${color.toUpperCase()}, cliquer pour charger`}
                title={color.toUpperCase()}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.12)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <button
                  onClick={(e) => handleRemoveFromPalette(e, color)}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `1px solid ${borderColor}`,
                    background: '#ffffff',
                    color: textSecondary,
                    fontSize: '10px',
                    lineHeight: '14px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  className="swatch-remove-btn"
                  aria-label={`Supprimer ${color.toUpperCase()} de la palette`}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Copy Toast */}
      <CopyToast message={toastMessage} visible={toastVisible} />

      {/* Hover remove button style via inline style tag */}
      <style>{`
        .swatch-remove-btn {
          display: none !important;
        }
        [role="listitem"]:hover .swatch-remove-btn,
        [role="listitem"]:focus-within .swatch-remove-btn {
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
