'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getQueryParam, parseHexParam, setQueryParams } from '../utils/url';
import { savePalette, addRecentColor } from '../utils/storage';

/* ===== Types ===== */

type GradientType = 'linear' | 'radial' | 'conic';

interface ColorStop {
  color: string;
  position: number; // 0–100, -1 means auto-distributed
}

interface Preset {
  name: string;
  type: GradientType;
  colors: string[];
  direction: string;
}

/* ===== Constants ===== */

const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

const LINEAR_DIRECTIONS = [
  { value: 'to right', label: '\u2192 Right', angle: '90deg' },
  { value: 'to bottom', label: '\u2193 Bottom', angle: '180deg' },
  { value: 'to left', label: '\u2190 Left', angle: '270deg' },
  { value: 'to top', label: '\u2191 Top', angle: '0deg' },
  { value: '0deg', label: '0\u00b0', angle: '0deg' },
  { value: '45deg', label: '45\u00b0', angle: '45deg' },
  { value: '90deg', label: '90\u00b0', angle: '90deg' },
  { value: '135deg', label: '135\u00b0', angle: '135deg' },
];

const RADIAL_POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top left', label: 'Top Left' },
  { value: 'top right', label: 'Top Right' },
  { value: 'bottom left', label: 'Bottom Left' },
  { value: 'bottom right', label: 'Bottom Right' },
];

const DEFAULT_STOPS: ColorStop[] = [
  { color: '#6366f1', position: -1 },
  { color: '#a855f7', position: -1 },
];

const PRESETS: Preset[] = [
  { name: 'Sunset', type: 'linear', colors: ['#ff6b6b', '#feca57', '#48dbfb'], direction: 'to right' },
  { name: 'Ocean', type: 'linear', colors: ['#0c3483', '#a2b6df', '#6b8cce'], direction: 'to bottom' },
  { name: 'Forest', type: 'linear', colors: ['#134e5e', '#71b280', '#a8e6cf'], direction: '135deg' },
  { name: 'Lavender', type: 'linear', colors: ['#7c3aed', '#a855f7', '#d8b4fe'], direction: '90deg' },
  { name: 'Radial Glow', type: 'radial', colors: ['#6366f1', '#a855f7', '#ec4899'], direction: 'center' },
  { name: 'Midnight', type: 'linear', colors: ['#0f172a', '#1e293b', '#475569'], direction: 'to bottom' },
  { name: 'Conic Sunset', type: 'conic', colors: ['#ff6b6b', '#feca57', '#48dbfb'], direction: '0deg' },
];

/* ===== Helpers ===== */

function isValidHex(hex: string): boolean {
  const h = hex.replace(/^#/, '');
  if (h.length !== 3 && h.length !== 6) return false;
  return /^[0-9a-fA-F]+$/.test(h);
}

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0');
}

function formatGradientCss(
  type: GradientType,
  stops: ColorStop[],
  direction: string,
): string {
  const stopStrings = stops.map((s) => {
    const c = s.color;
    if (s.position >= 0) {
      return `${c} ${s.position}%`;
    }
    return c;
  });

  if (type === 'radial') {
    const shapeDir = direction === 'center' ? 'circle' : `ellipse at ${direction}`;
    return `background: radial-gradient(${shapeDir}, ${stopStrings.join(', ')});`;
  }

  if (type === 'conic') {
    return `background: conic-gradient(from ${direction}, ${stopStrings.join(', ')});`;
  }

  return `background: linear-gradient(${direction}, ${stopStrings.join(', ')});`;
}

function formatPreviewBackground(
  type: GradientType,
  stops: ColorStop[],
  direction: string,
): string {
  const stopStrings = stops.map((s) => {
    const c = s.color;
    if (s.position >= 0) {
      return `${c} ${s.position}%`;
    }
    return c;
  });

  if (type === 'radial') {
    const shapeDir = direction === 'center' ? 'circle' : `ellipse at ${direction}`;
    return `radial-gradient(${shapeDir}, ${stopStrings.join(', ')})`;
  }

  if (type === 'conic') {
    return `conic-gradient(from ${direction}, ${stopStrings.join(', ')})`;
  }

  return `linear-gradient(${direction}, ${stopStrings.join(', ')})`;
}

/* ===== Styles ===== */

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '560px',
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
    gap: '8px',
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
    width: '90px',
    padding: '0.625rem 0.5rem',
    fontSize: '0.8125rem',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    background: 'var(--color-bg-card, #ffffff)',
    color: textPrimary,
    fontFamily: monoFont,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    flexShrink: 0,
  },
  hexInputError: {
    borderColor: '#ef4444',
    background: '#fef2f2',
  },
  positionSlider: {
    flex: 1,
    minWidth: '60px',
    height: '4px',
    accentColor: primary,
    cursor: 'pointer',
  },
  positionInput: {
    width: '48px',
    padding: '0.4rem 0.3rem',
    fontSize: '0.75rem',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '8px',
    outline: 'none',
    background: 'var(--color-bg-card, #ffffff)',
    color: textPrimary,
    fontFamily: monoFont,
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  removeBtn: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '8px',
    background: '#fef2f2',
    color: '#ef4444',
    fontSize: '16px',
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
    padding: '0.5rem 0.875rem',
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
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: `1.5px solid ${borderColor}`,
    background: 'var(--color-bg-card, #ffffff)',
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
  typeToggle: {
    display: 'flex',
    gap: '4px',
    marginBottom: '1rem',
    background: '#f1f5f9',
    borderRadius: '10px',
    padding: '3px',
  },
  typeBtn: {
    flex: 1,
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: textSecondary,
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily,
    lineHeight: 1,
  },
  typeBtnActive: {
    background: 'var(--color-bg-card, #ffffff)',
    color: primary,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
    fontSize: '0.75rem',
    fontFamily: monoFont,
    lineHeight: '20px',
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
  actionRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1.25rem',
    flexWrap: 'wrap' as const,
  },
  actionBtn: {
    padding: '0.5rem 0.875rem',
    borderRadius: '8px',
    border: `1.5px solid ${borderColor}`,
    background: 'var(--color-bg-card, #ffffff)',
    color: textSecondary,
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily,
    lineHeight: 1,
  },
  actionBtnPrimary: {
    borderColor: primary,
    color: primary,
    background: '#eef2ff',
  },
  saveRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1.25rem',
    alignItems: 'center',
  },
  saveInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    fontSize: '0.8125rem',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    background: 'var(--color-bg-card, #ffffff)',
    color: textPrimary,
    fontFamily,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  saveBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    border: 'none',
    background: primary,
    color: '#ffffff',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
  },
  saveBtnSaved: {
    background: '#10b981',
  },
  presetsSection: {
    marginBottom: '1.25rem',
  },
  presetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  presetCard: {
    borderRadius: '10px',
    padding: '0.625rem',
    cursor: 'pointer',
    border: `1.5px solid ${borderColor}`,
    transition: 'all 0.15s ease',
    background: 'var(--color-bg-card, #ffffff)',
    textAlign: 'center' as const,
  },
  presetPreview: {
    width: '100%',
    height: '48px',
    borderRadius: '6px',
    marginBottom: '4px',
  },
  presetName: {
    fontSize: '0.6875rem',
    color: textSecondary,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  toast: {
    position: 'fixed' as const,
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.625rem 1.25rem',
    borderRadius: '10px',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: '0.8125rem',
    fontWeight: 600,
    fontFamily,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 9999,
    transition: 'opacity 0.3s ease',
  },
};

/* ===== Component ===== */

export default function GradientGenerator() {
  const [stops, setStops] = useState<ColorStop[]>(DEFAULT_STOPS);
  const [type, setType] = useState<GradientType>('linear');
  const [direction, setDirection] = useState('to right');
  const [errors, setErrors] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read URL params on mount
  useEffect(() => {
    const fromParam = getQueryParam('from');
    const toParam = getQueryParam('to');
    const angleParam = getQueryParam('angle');
    const typeParam = getQueryParam('type');

    const from = parseHexParam(fromParam);
    const to = parseHexParam(toParam);

    const newStops: ColorStop[] = [];
    if (from) newStops.push({ color: from, position: -1 });
    if (to) {
      if (!from) newStops.push({ color: DEFAULT_STOPS[0].color, position: -1 });
      newStops.push({ color: to, position: -1 });
    }

    if (newStops.length >= 2) {
      setStops(newStops);
    }

    if (typeParam === 'radial' || typeParam === 'linear' || typeParam === 'conic') {
      setType(typeParam);
    }

    if (angleParam) {
      const angleVal = angleParam.replace(/[^0-9]/g, '');
      if (angleVal) {
        const match = LINEAR_DIRECTIONS.find(
          (d) => d.angle === `${angleVal}deg` || d.value === `${angleVal}deg`,
        );
        if (match) setDirection(match.value);
      }
    }
  }, []);

  // Update URL when state changes
  useEffect(() => {
    const from = stops[0]?.color?.replace('#', '') ?? '';
    const to = stops[stops.length - 1]?.color?.replace('#', '') ?? '';
    const angleDeg = LINEAR_DIRECTIONS.find((d) => d.value === direction)?.angle?.replace('deg', '') ?? '';
    setQueryParams({
      from: from || null,
      to: to || null,
      angle: angleDeg || null,
      type: type,
    });
  }, [stops, direction, type]);

  const gradientCss = formatGradientCss(type, stops, direction);
  const previewBackground = formatPreviewBackground(type, stops, direction);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleColorChange = useCallback(
    (index: number, value: string) => {
      setStops((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], color: value };
        return next;
      });
      if (value && !isValidHex(value)) {
        setErrors((prev) => ({ ...prev, [index]: true }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
    },
    [],
  );

  const handleColorPickerChange = useCallback(
    (index: number, value: string) => {
      setStops((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], color: value };
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    },
    [],
  );

  const handlePositionChange = useCallback(
    (index: number, value: number) => {
      const clamped = Math.max(0, Math.min(100, value));
      setStops((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], position: clamped };
        return next;
      });
    },
    [],
  );

  const addColor = useCallback(() => {
    setStops((prev) => [...prev, { color: '#8b5cf6', position: -1 }]);
  }, []);

  const removeColor = useCallback(
    (index: number) => {
      if (stops.length <= 2) return;
      setStops((prev) => prev.filter((_, i) => i !== index));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    },
    [stops.length],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(gradientCss);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = gradientCss;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    showToast('CSS copied to clipboard!');
    setTimeout(() => setCopied(false), 1800);
  }, [gradientCss, showToast]);

  const handleRandom = useCallback(() => {
    const count = Math.max(2, Math.min(5, Math.floor(Math.random() * 4) + 2));
    const newStops: ColorStop[] = [];
    for (let i = 0; i < count; i++) {
      newStops.push({ color: randomHex(), position: -1 });
    }
    setStops(newStops);
    setErrors({});

    // Randomly switch between linear, radial, and conic
    const rand = Math.random();
    if (rand > 0.8) {
      setType('radial');
      setDirection(RADIAL_POSITIONS[Math.floor(Math.random() * RADIAL_POSITIONS.length)].value);
    } else if (rand > 0.6) {
      setType('conic');
      const dirs = LINEAR_DIRECTIONS;
      setDirection(dirs[Math.floor(Math.random() * dirs.length)].value);
    } else {
      setType('linear');
      const dirs = LINEAR_DIRECTIONS;
      setDirection(dirs[Math.floor(Math.random() * dirs.length)].value);
    }
    showToast('Random gradient generated!');
  }, [showToast]);

  const applyPreset = useCallback((preset: Preset) => {
    const newStops: ColorStop[] = preset.colors.map((c) => ({
      color: c,
      position: -1,
    }));
    setStops(newStops);
    setType(preset.type);
    setDirection(preset.direction);
    setErrors({});
  }, []);

  const handleSave = useCallback(() => {
    const name = saveName.trim() || `Gradient ${new Date().toLocaleDateString()}`;
    const colors = stops.map((s) => s.color);
    savePalette(name, colors, 'gradient');
    setSaved(true);
    showToast(`Gradient "${name}" saved!`);
    setTimeout(() => setSaved(false), 1800);
  }, [saveName, stops, showToast]);

  // Add colors to recent
  useEffect(() => {
    stops.forEach((s) => {
      if (isValidHex(s.color)) {
        addRecentColor(s.color);
      }
    });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Gradient Generator</h2>
        <p style={styles.subtitle}>
          Create beautiful {type} gradients with custom colors and stops
        </p>

        {/* Type Toggle */}
        <div style={styles.typeToggle}>
          <button
            onClick={() => {
              setType('linear');
              if (direction && !LINEAR_DIRECTIONS.find((d) => d.value === direction)) {
                setDirection('to right');
              }
            }}
            style={{
              ...styles.typeBtn,
              ...(type === 'linear' ? styles.typeBtnActive : {}),
            }}
          >
            Linear
          </button>
          <button
            onClick={() => {
              setType('radial');
              if (!RADIAL_POSITIONS.find((p) => p.value === direction)) {
                setDirection('center');
              }
            }}
            style={{
              ...styles.typeBtn,
              ...(type === 'radial' ? styles.typeBtnActive : {}),
            }}
          >
            Radial
          </button>
          <button
            onClick={() => {
              setType('conic');
              if (direction && !LINEAR_DIRECTIONS.find((d) => d.value === direction)) {
                setDirection('0deg');
              }
            }}
            style={{
              ...styles.typeBtn,
              ...(type === 'conic' ? styles.typeBtnActive : {}),
            }}
          >
            Conic
          </button>
        </div>

        {/* Live Preview */}
        <div
          style={{
            ...styles.preview,
            background: previewBackground,
          }}
          role="img"
          aria-label={`Gradient preview: ${gradientCss}`}
        />

        {/* Action Buttons */}
        <div style={styles.actionRow}>
          <button onClick={handleRandom} style={styles.actionBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
            Random
          </button>
        </div>

        {/* Color Inputs */}
        <div style={styles.colorsSection}>
          <div style={styles.sectionLabel}>
            Color Stops ({stops.length})
          </div>
          {stops.map((stop, index) => (
            <div key={index} style={styles.colorRow}>
              <input
                type="color"
                value={stop.color}
                onChange={(e) => handleColorPickerChange(index, e.target.value)}
                aria-label={`Color ${index + 1} picker`}
                style={styles.colorPicker}
              />
              <input
                type="text"
                value={stop.color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                placeholder="#000000"
                maxLength={7}
                aria-label={`Color ${index + 1} hex value`}
                style={{
                  ...styles.hexInput,
                  ...(errors[index] ? styles.hexInputError : {}),
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={stop.position >= 0 ? stop.position : 50}
                onChange={(e) => handlePositionChange(index, parseInt(e.target.value, 10))}
                aria-label={`Color ${index + 1} position`}
                style={styles.positionSlider}
                title={`Position: ${stop.position >= 0 ? stop.position : 'auto'}%`}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={stop.position >= 0 ? stop.position : ''}
                placeholder="auto"
                onChange={(e) => {
                  const val = e.target.value;
                  handlePositionChange(index, val ? parseInt(val, 10) : -1);
                }}
                aria-label={`Color ${index + 1} position percent`}
                style={styles.positionInput}
              />
              {stops.length > 2 && (
                <button
                  onClick={() => removeColor(index)}
                  style={styles.removeBtn}
                  aria-label={`Remove color ${index + 1}`}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {stops.length < 8 && (
            <button
              onClick={addColor}
              style={styles.addColorBtn}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
                (e.currentTarget as HTMLButtonElement).style.color = primary;
                (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e1';
                (e.currentTarget as HTMLButtonElement).style.color = textSecondary;
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Stop
            </button>
          )}
        </div>

        {/* Direction Selector */}
        <div style={styles.directionSection}>
          <div style={styles.directionLabel}>
            {type === 'radial' ? 'Position' : 'Direction / Angle'}
          </div>
          <div style={styles.directionGrid}>
            {(type === 'radial' ? RADIAL_POSITIONS : LINEAR_DIRECTIONS).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDirection(opt.value)}
                style={{
                  ...styles.directionBtn,
                  ...(direction === opt.value ? styles.directionBtnActive : {}),
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div style={styles.presetsSection}>
          <div style={styles.sectionLabel}>Presets</div>
          <div style={styles.presetsGrid}>
            {PRESETS.map((preset) => {
              const stopStr = preset.colors.join(', ');
              const bg =
                preset.type === 'radial'
                  ? `radial-gradient(circle, ${stopStr})`
                  : preset.type === 'conic'
                  ? `conic-gradient(from ${preset.direction}, ${stopStr})`
                  : `linear-gradient(${preset.direction}, ${stopStr})`;
              return (
                <div
                  key={preset.name}
                  style={styles.presetCard}
                  onClick={() => applyPreset(preset)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = primary;
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 2px 8px rgba(99,102,241,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                >
                  <div style={{ ...styles.presetPreview, background: bg }} />
                  <div style={styles.presetName}>{preset.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Gradient */}
        <div style={styles.saveRow}>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Gradient name (optional)"
            style={styles.saveInput}
            maxLength={50}
          />
          <button
            onClick={handleSave}
            style={{
              ...styles.saveBtn,
              ...(saved ? styles.saveBtnSaved : {}),
            }}
          >
            {saved ? '\u2713 Saved' : 'Save'}
          </button>
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

      {/* Toast notification */}
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
