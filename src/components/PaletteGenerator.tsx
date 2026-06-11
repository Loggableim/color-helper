'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  generateComplementaryPalette,
  generateAnalogousPalette,
  generateTriadicPalette,
  generateMonochromePalette,
  generateTintsPalette,
  generateShadesPalette,
  generateSplitComplementaryPalette,
  generateTetradicPalette,
  copyToClipboard,
  normalizeHex,
  isValidHex,
  hexToRgb,
  getRelativeLuminance,
  type Palette,
} from '../utils/color';
import {
  savePalette as savePaletteToStorage,
  addRecentColor,
  formatCSSVariables,
  formatJSON,
  formatSCSSVariables,
} from '../utils/storage';
import { getQueryParam, parseHexParam, toolLinks } from '../utils/url';

/* ===== Types ===== */

type PaletteType =
  | 'all'
  | 'complementary'
  | 'split-complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'monochromatic'
  | 'tints'
  | 'shades';

const PALETTE_TYPES: { value: PaletteType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'split-complementary', label: 'Split Complementary' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'tetradic', label: 'Tetradic' },
  { value: 'monochromatic', label: 'Monochromatic' },
  { value: 'tints', label: 'Tints' },
  { value: 'shades', label: 'Shades' },
];

/* ===== Helpers ===== */

function textColorForBg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.5 ? '#111111' : '#f0f0f0';
}

function generateRandomHex(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  return `#${[r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}

/* ===== Design Tokens ===== */

const primary = '#6366f1';
const primaryGradient = 'linear-gradient(135deg, #6366f1, #4f46e5)';
const borderColor = '#e2e8f0';
const textPrimary = '#1e293b';
const textSecondary = '#64748b';
const bgSubtle = '#f8fafc';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Styles ===== */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: 800,
    margin: '0 auto',
    fontFamily,
    color: textPrimary,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: textSecondary,
    marginBottom: '1.5rem',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
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
    width: 130,
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
  errorText: {
    fontSize: '0.8rem',
    color: '#ef4444',
    margin: '0.25rem 0 0 0',
  } as React.CSSProperties,
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
    whiteSpace: 'nowrap' as const,
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
  btnSmall: {
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
  },
  typeSelector: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    marginBottom: '1.5rem',
  },
  typeRadio: {
    display: 'none',
  } as React.CSSProperties,
  typeLabel: {
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
    userSelect: 'none' as const,
  },
  typeLabelActive: {
    borderColor: primary,
    background: '#eef2ff',
    color: primary,
  },
  card: {
    background: '#ffffff',
    borderRadius: '14px',
    padding: '1.25rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    border: `1px solid ${borderColor}`,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  paletteName: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
  },
  actionRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  colorRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  colorBlock: {
    flex: '1 0 56px',
    height: 80,
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
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
    gap: '2px',
  },
  colorHex: {
    fontSize: '0.7rem',
    lineHeight: 1.2,
  },
  copyIcon: {
    fontSize: '0.6rem',
    opacity: 0.7,
    lineHeight: 1,
  },
  contrastLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8125rem',
    color: primary,
    textDecoration: 'none',
    fontWeight: 600,
    fontFamily,
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    border: `1px solid ${primary}`,
    background: '#ffffff',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
  },
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
  },
};

/* ===== Component ===== */

export default function PaletteGenerator() {
  const [baseColor, setBaseColor] = useState('#3B82F6');
  const [hexInput, setHexInput] = useState('3B82F6');
  const [hexError, setHexError] = useState('');
  const [selectedType, setSelectedType] = useState<PaletteType>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  /* ---- Toast ---- */
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

  /* ---- Read URL param on mount ---- */
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    const param = getQueryParam('base');
    const parsed = parseHexParam(param);
    if (parsed) {
      setBaseColor(parsed);
      setHexInput(parsed.replace('#', ''));
      setHexError('');
    }
  }, []);

  /* ---- Hex input handling ---- */
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
      addRecentColor(v);
    },
    [],
  );

  /* ---- Random / Regenerate ---- */
  const handleRandom = useCallback(() => {
    const hex = generateRandomHex();
    setBaseColor(hex);
    setHexInput(hex.replace('#', ''));
    setHexError('');
    showFeedback('New random color generated');
  }, [showFeedback]);

  /* ---- Generate palettes ---- */
  const allPalettes = useMemo<Palette[]>(() => {
    const valid = isValidHex(baseColor);
    if (!valid) return [];
    return [
      generateComplementaryPalette(baseColor),
      generateSplitComplementaryPalette(baseColor),
      generateAnalogousPalette(baseColor),
      generateTriadicPalette(baseColor),
      generateTetradicPalette(baseColor),
      generateMonochromePalette(baseColor),
      generateTintsPalette(baseColor),
      generateShadesPalette(baseColor),
    ];
  }, [baseColor]);

  const visiblePalettes = useMemo<Palette[]>(() => {
    if (selectedType === 'all') return allPalettes;
    const map: Record<PaletteType, string> = {
      all: '',
      complementary: 'Complementary',
      'split-complementary': 'Split Complementary',
      analogous: 'Analogous',
      triadic: 'Triadic',
      tetradic: 'Tetradic',
      monochromatic: 'Monochromatic',
      tints: 'Tints',
      shades: 'Shades',
    };
    const targetName = map[selectedType];
    return allPalettes.filter(p => p.name === targetName);
  }, [allPalettes, selectedType]);

  /* ---- Copy individual color ---- */
  const handleCopyColor = useCallback(
    async (hex: string) => {
      const ok = await copyToClipboard(hex);
      if (ok) {
        addRecentColor(hex);
        showFeedback(`Copied ${hex}`);
      }
    },
    [showFeedback],
  );

  /* ---- Export handlers ---- */
  const handleCopyAll = useCallback(
    async (colors: string[]) => {
      const text = colors.join(', ');
      const ok = await copyToClipboard(text);
      if (ok) showFeedback(`Copied palette (${colors.length} colors)`);
    },
    [showFeedback],
  );

  const handleExportCss = useCallback(
    async (colors: string[]) => {
      const css = `:root {\n${formatCSSVariables(colors)}\n}`;
      const ok = await copyToClipboard(css);
      if (ok) showFeedback(`Copied CSS variables (${colors.length} colors)`);
    },
    [showFeedback],
  );

  const handleExportJson = useCallback(
    async (colors: string[]) => {
      const json = formatJSON(colors);
      const ok = await copyToClipboard(json);
      if (ok) showFeedback(`Copied JSON (${colors.length} colors)`);
    },
    [showFeedback],
  );

  const handleExportScss = useCallback(
    async (colors: string[]) => {
      const scss = formatSCSSVariables(colors);
      const ok = await copyToClipboard(scss);
      if (ok) showFeedback(`Copied SCSS variables (${colors.length} colors)`);
    },
    [showFeedback],
  );

  /* ---- Save palette ---- */
  const handleSavePalette = useCallback(
    (palette: Palette) => {
      savePaletteToStorage(palette.name, palette.colors, 'generator');
      showFeedback(`Saved "${palette.name}" palette`);
    },
    [showFeedback],
  );

  /* ---- Contrast link ---- */
  const contrastHref = useMemo(
    () => toolLinks.contrastChecker(baseColor, '#ffffff'),
    [baseColor],
  );

  /* ---- Button hover handlers ---- */
  const btnHoverIn = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderColor = primary;
    el.style.color = primary;
    el.style.background = '#eef2ff';
  }, []);

  const btnHoverOut = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderColor = borderColor;
    el.style.color = textSecondary;
    el.style.background = '#ffffff';
  }, []);

  const swatchHoverIn = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = 'scale(1.04)';
    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  }, []);

  const swatchHoverOut = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = 'scale(1)';
    el.style.boxShadow = 'none';
  }, []);

  const linkHoverIn = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.background = '#eef2ff';
  }, []);

  const linkHoverOut = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.background = '#ffffff';
  }, []);

  /* ---- Render ---- */
  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Color Palette Generator</h1>
      <p style={styles.subtitle}>
        Pick a base color and explore harmony palettes. Click any swatch to copy its hex value.
      </p>

      {/* Color Input Controls */}
      <div style={styles.controlsRow}>
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
            placeholder="HEX value (e.g. 7c3aed)"
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
        <button
          type="button"
          onClick={handleRandom}
          style={{ ...styles.btn, ...styles.btnSecondary }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = primary;
            (e.currentTarget as HTMLElement).style.color = primary;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = borderColor;
            (e.currentTarget as HTMLElement).style.color = textPrimary;
          }}
          aria-label="Generate random color"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          Regenerate
        </button>
      </div>

      {/* Palette Type Selector */}
      <div style={styles.typeSelector} role="radiogroup" aria-label="Palette type">
        {PALETTE_TYPES.map(({ value, label }) => (
          <label
            key={value}
            style={{
              ...styles.typeLabel,
              ...(selectedType === value ? styles.typeLabelActive : {}),
            }}
          >
            <input
              type="radio"
              name="palette-type"
              value={value}
              checked={selectedType === value}
              onChange={() => setSelectedType(value)}
              style={styles.typeRadio}
            />
            {label}
          </label>
        ))}
      </div>

      {/* Palettes */}
      {visiblePalettes.length === 0 && (
        <div style={styles.card}>
          <p style={{ color: textSecondary, margin: 0, textAlign: 'center' }}>
            Enter a valid hex color to generate palettes.
          </p>
        </div>
      )}

      {visiblePalettes.map((palette) => (
        <div key={palette.name} style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.paletteName}>{palette.name}</h2>
            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={() => handleExportCss(palette.colors)}
                style={styles.btnSmall}
                aria-label={`Export ${palette.name} as CSS variables`}
                onMouseEnter={btnHoverIn}
                onMouseLeave={btnHoverOut}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
                CSS
              </button>
              <button
                type="button"
                onClick={() => handleExportJson(palette.colors)}
                style={styles.btnSmall}
                aria-label={`Export ${palette.name} as JSON`}
                onMouseEnter={btnHoverIn}
                onMouseLeave={btnHoverOut}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <line x1="9" y1="10" x2="15" y2="10" />
                </svg>
                JSON
              </button>
              <button
                type="button"
                onClick={() => handleExportScss(palette.colors)}
                style={styles.btnSmall}
                aria-label={`Export ${palette.name} as SCSS variables`}
                onMouseEnter={btnHoverIn}
                onMouseLeave={btnHoverOut}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                SCSS
              </button>
              <button
                type="button"
                onClick={() => handleCopyAll(palette.colors)}
                style={styles.btnSmall}
                aria-label={`Copy all ${palette.name} colors`}
                onMouseEnter={btnHoverIn}
                onMouseLeave={btnHoverOut}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy All
              </button>
              <button
                type="button"
                onClick={() => handleSavePalette(palette)}
                style={{ ...styles.btnSmall, color: '#10b981' }}
                aria-label={`Save ${palette.name} palette`}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#10b981';
                  (e.currentTarget as HTMLElement).style.background = '#ecfdf5';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = borderColor;
                  (e.currentTarget as HTMLElement).style.background = '#ffffff';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Save
              </button>
            </div>
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
                  onMouseEnter={swatchHoverIn}
                  onMouseLeave={swatchHoverOut}
                  aria-label={`Copy ${color}`}
                  title={color}
                >
                  <span style={styles.colorHex}>{color}</span>
                  <span style={styles.copyIcon}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Contrast Check Link */}
      <a
        href={contrastHref}
        style={styles.contrastLink}
        onMouseEnter={linkHoverIn}
        onMouseLeave={linkHoverOut}
        aria-label="Check contrast of base color"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        Check Contrast of {baseColor}
      </a>

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
