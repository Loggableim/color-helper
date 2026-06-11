'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { colors } from '../data/colors';
import { getQueryParam, setQueryParam } from '../utils/url';
import { addRecentColor } from '../utils/storage';

/* ===== Design Tokens ===== */
const primary = '#6366f1';
const borderColor = '#e2e8f0';
const textPrimary = '#1e293b';
const textSecondary = '#64748b';
const bgAlt = '#f8fafc';
const errorBg = '#fef2f2';
const errorBorder = '#fecaca';
const errorText = '#dc2626';
const successColor = '#22c55e';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Inline Styles ===== */

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '540px',
    margin: '0 auto',
    fontFamily,
  },
  card: {
    background: '#ffffff',
    border: `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
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
    background: '#ffffff',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    letterSpacing: '0.02em',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: errorText,
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
  detectBadgeDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#94a3b8',
  },
  detectBadgeDotSuccess: {
    background: successColor,
  },
  detectBadgeDotError: {
    background: errorText,
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
  namedColorName: {
    fontSize: '0.8125rem',
    color: textSecondary,
    marginTop: '0.25rem',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  resultCard: {
    background: bgAlt,
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    padding: '0.75rem',
  },
  resultCardFull: {
    gridColumn: '1 / -1',
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
  },
  copyAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    fontFamily,
    color: '#ffffff',
    background: primary,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  errorMsg: {
    background: errorBg,
    border: `1px solid ${errorBorder}`,
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: errorText,
    fontSize: '0.8125rem',
    fontWeight: 500,
    marginBottom: '1rem',
  },
  errorDetail: {
    fontSize: '0.75rem',
    color: errorText,
    opacity: 0.8,
    marginTop: '0.375rem',
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
  copyAllRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '1rem',
  },
};

/* ===== Detection Types ===== */

type DetectedFormat = 'HEX' | 'RGB' | 'RGBA' | 'HSL' | 'HSLA' | 'Named';

interface DetectResult {
  format: DetectedFormat | null;
  raw: string;
  rgba: { r: number; g: number; b: number; a: number };
  error: string | null;
  namedColor: string | null;
}

/* ===== Color Lookup ===== */

function findNamedColor(name: string): { hex: string; r: number; g: number; b: number } | null {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '');
  for (const c of colors) {
    if (c.name.toLowerCase() === normalized || c.slug.toLowerCase() === normalized) {
      return { hex: c.hex, r: c.r, g: c.g, b: c.b };
    }
  }
  // Also try matching the CSS keyword directly
  const cssName = normalized.replace(/[\s-]/g, '');
  for (const c of colors) {
    const colorSlug = c.slug.replace(/[\s-]/g, '').toLowerCase();
    if (colorSlug === cssName) {
      return { hex: c.hex, r: c.r, g: c.g, b: c.b };
    }
  }
  return null;
}

/* ===== Color Detection ===== */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function detectColor(input: string): DetectResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { format: null, raw: '', rgba: { r: 0, g: 0, b: 0, a: 1 }, error: null, namedColor: null };
  }

  // 1. Named color detection
  const named = findNamedColor(trimmed);
  if (named) {
    return {
      format: 'Named',
      raw: named.hex,
      rgba: { r: named.r, g: named.g, b: named.b, a: 1 },
      error: null,
      namedColor: trimmed.trim(),
    };
  }

  // 2. HEX detection: #fff, #ffffff, fff, ffffff
  let hexStr = trimmed;
  if (hexStr.startsWith('#')) hexStr = hexStr.slice(1);
  if (/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hexStr)) {
    const hex = normalizeHex(trimmed);
    if (isValidHex(hex)) {
      const rgb = hexToRgb(hex);
      if (rgb) {
        return {
          format: 'HEX',
          raw: hex,
          rgba: { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 },
          error: null,
          namedColor: null,
        };
      }
    }
    return {
      format: 'HEX',
      raw: trimmed,
      rgba: { r: 0, g: 0, b: 0, a: 1 },
      error: 'Invalid hex code — use 3 or 6 hex digits (e.g., #ff6600 or #f60).',
      namedColor: null,
    };
  }

  // 3. RGB / RGBA detection: rgb(r,g,b), rgba(r,g,b,a), or r,g,b or r,g,b,a
  let rgbMatch: RegExpMatchArray | null = null;
  let hasAlpha = false;

  // rgba(r, g, b, a)
  rgbMatch = trimmed.match(
    /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i
  );
  if (rgbMatch) hasAlpha = true;

  if (!rgbMatch) {
    // rgb(r, g, b)
    rgbMatch = trimmed.match(
      /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i
    );
  }

  if (!rgbMatch) {
    // bare r,g,b,a or r,g,b
    const bareMatch = trimmed.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?$/);
    if (bareMatch) {
      const r = parseInt(bareMatch[1], 10);
      const g = parseInt(bareMatch[2], 10);
      const b = parseInt(bareMatch[3], 10);

      // Check if this looks like RGB (all values ≤ 255)
      if (r <= 255 && g <= 255 && b <= 255) {
        rgbMatch = bareMatch;
        hasAlpha = bareMatch[4] !== undefined;
      }
    }
  }

  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const a = hasAlpha ? parseFloat(rgbMatch[4]) : 1;

    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      return {
        format: hasAlpha ? 'RGBA' : 'RGB',
        raw: trimmed,
        rgba: { r: 0, g: 0, b: 0, a: 1 },
        error: 'RGB values must be between 0 and 255.',
        namedColor: null,
      };
    }
    if (a < 0 || a > 1) {
      return {
        format: 'RGBA',
        raw: trimmed,
        rgba: { r, g, b, a: 1 },
        error: 'Alpha must be between 0 and 1.',
        namedColor: null,
      };
    }

    return {
      format: hasAlpha ? 'RGBA' : 'RGB',
      raw: hasAlpha ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`,
      rgba: { r, g, b, a: clamp(a * 100, 0, 100) / 100 },
      error: null,
      namedColor: null,
    };
  }

  // 4. HSL / HSLA detection
  let hslMatch: RegExpMatchArray | null = null;
  let hslHasAlpha = false;

  // hsla(h, s%, l%, a)
  hslMatch = trimmed.match(
    /^hsla\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([0-9.]+)\s*\)$/i
  );
  if (hslMatch) hslHasAlpha = true;

  if (!hslMatch) {
    hslMatch = trimmed.match(
      /^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i
    );
  }

  if (!hslMatch) {
    // hsl(h, s, l) without % signs
    hslMatch = trimmed.match(
      /^hsl\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i
    );
  }

  if (!hslMatch) {
    // bare h, s%, l% or h, s, l
    const bareHsl = trimmed.match(
      /^(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%$/
    );
    if (bareHsl) {
      hslMatch = bareHsl;
    }
  }

  if (!hslMatch) {
    // bare h, s, l (no %) — but only if values look like HSL
    const bareNums = trimmed.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
    if (bareNums) {
      const h = parseInt(bareNums[1], 10);
      const s = parseInt(bareNums[2], 10);
      const l = parseInt(bareNums[3], 10);
      // If first value > 255 or second/third look like percentages (> 100), treat as HSL
      // Or if any RGB value would be > 255 and it looks more like HSL
      if (h <= 360 && (s > 100 || l > 100)) {
        // not HSL — this is probably RGB values out of range
      } else if (h <= 360 && s <= 100 && l <= 100) {
        // Could be either, but if first is ≤ 360 and all ≤ 100, it's likely HSL
        hslMatch = bareNums;
      }
    }
  }

  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10);
    const s = parseInt(hslMatch[2], 10);
    const l = parseInt(hslMatch[3], 10);
    const a = hslHasAlpha ? parseFloat(hslMatch[4]) : 1;

    if (h < 0 || h > 360) {
      return {
        format: hslHasAlpha ? 'HSLA' : 'HSL',
        raw: trimmed,
        rgba: { r: 0, g: 0, b: 0, a: 1 },
        error: 'Hue must be between 0 and 360.',
        namedColor: null,
      };
    }
    if (s < 0 || s > 100 || l < 0 || l > 100) {
      return {
        format: hslHasAlpha ? 'HSLA' : 'HSL',
        raw: trimmed,
        rgba: { r: 0, g: 0, b: 0, a: 1 },
        error: 'Saturation and lightness must be between 0% and 100%.',
        namedColor: null,
      };
    }
    if (a < 0 || a > 1) {
      return {
        format: 'HSLA',
        raw: trimmed,
        rgba: { r: 0, g: 0, b: 0, a: 1 },
        error: 'Alpha must be between 0 and 1.',
        namedColor: null,
      };
    }

    const rgb = hslToRgb(h, s, l);
    return {
      format: hslHasAlpha ? 'HSLA' : 'HSL',
      raw: hslHasAlpha
        ? `hsla(${h}, ${s}%, ${l}%, ${a})`
        : `hsl(${h}, ${s}%, ${l}%)`,
      rgba: { r: rgb.r, g: rgb.g, b: rgb.b, a: clamp(a * 100, 0, 100) / 100 },
      error: null,
      namedColor: null,
    };
  }

  // 5. Not detected
  return {
    format: null,
    raw: trimmed,
    rgba: { r: 0, g: 0, b: 0, a: 1 },
    error:
      'Could not detect color format. Try #ff6600, rgb(255,102,0), hsl(30,100%,50%), or a named color like "coral" or "rebeccapurple".',
    namedColor: null,
  };
}

/* ===== Quick Sample Colors ===== */

const quickSamples = [
  { value: '#ff6b6b', label: '#ff6b6b', isHex: true },
  { value: '#4ecdc4', label: '#4ecdc4', isHex: true },
  { value: '#6366f1', label: '#6366f1', isHex: true },
  { value: '#f59e0b', label: '#f59e0b', isHex: true },
  { value: '#22c55e', label: '#22c55e', isHex: true },
  { value: 'coral', label: 'coral', isHex: false },
  { value: 'rebeccapurple', label: 'rebeccapurple', isHex: false },
];

/* ===== Component ===== */

export default function ColorConverter() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<DetectResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Parse URL param on mount
  useEffect(() => {
    const colorParam = getQueryParam('color');
    if (colorParam) {
      // Try as hex-first, then as named color
      let val = colorParam;
      if (/^[0-9a-fA-F]{3,6}$/.test(val) && !val.startsWith('#')) {
        val = '#' + val;
      }
      setInput(val);
    } else {
      // Default example
      setInput('#ff6600');
    }
  }, []);

  // Detect on input change
  useEffect(() => {
    if (!input || input.trim() === '') {
      setResult(null);
      return;
    }
    const detected = detectColor(input);
    setResult(detected);

    // Update URL param
    if (detected.format && !detected.error && detected.rgba) {
      const hex = rgbToHex(detected.rgba.r, detected.rgba.g, detected.rgba.b);
      setQueryParam('color', hex.replace('#', ''));
    } else {
      setQueryParam('color', null);
    }
  }, [input]);

  // Track recent colors on successful conversion
  useEffect(() => {
    if (result && result.format && !result.error && result.rgba) {
      const hex = rgbToHex(result.rgba.r, result.rgba.g, result.rgba.b);
      addRecentColor(hex);
    }
  }, [result]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleQuickSample = useCallback((color: string) => {
    setInput(color);
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (!result || result.error || !result.rgba) return;
    const outputs = generateOutputs(result);
    const text = Object.entries(outputs)
      .filter(([, v]) => v !== '—')
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    await copyToClipboard(text);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 1200);
  }, [result]);

  const bgColor = result?.rgba
    ? `rgba(${result.rgba.r}, ${result.rgba.g}, ${result.rgba.b}, ${result.rgba.a})`
    : '#e2e8f0';

  // Determine text contrast for border
  const bgLum = result?.rgba
    ? getRelativeLuminance(result.rgba.r, result.rgba.g, result.rgba.b)
    : 0.5;
  const isLight = bgLum > 0.5;

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <h2 style={s.subtitle}>Universal Color Converter</h2>
        <p style={s.desc}>
          Enter any color — HEX, RGB, HSL, or named — and get instant conversions to all formats.
        </p>

        {/* Input */}
        <div style={s.inputGroup}>
          <label htmlFor="color-input" style={s.inputLabel}>
            Enter color value
          </label>
          <input
            id="color-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="#ff6600, rgb(255,102,0), hsl(30,100%,50%), coral …"
            spellCheck={false}
            autoComplete="off"
            style={{
              ...s.input,
              ...(result?.error ? s.inputError : {}),
            }}
          />
          <div style={s.detectBadge}>
            <span
              style={{
                ...s.detectBadgeDot,
                ...(result?.format && !result.error
                  ? s.detectBadgeDotSuccess
                  : result?.error
                  ? s.detectBadgeDotError
                  : {}),
              }}
            />
            {!input || input.trim() === ''
              ? 'Waiting for input…'
              : result?.error
              ? 'Error'
              : result?.format
              ? `${result.format} detected`
              : 'Unknown format'}
          </div>
        </div>

        {/* Preview */}
        <div style={s.previewRow}>
          <div
            style={{
              ...s.preview,
              backgroundColor: bgColor,
              borderColor: input && result && !result.error ? (isLight ? '#cbd5e1' : '#334155') : borderColor,
            }}
          />
          <div style={s.previewInfo}>
            <div style={s.detectedFormat}>
              {result?.format || '—'}
            </div>
            {result?.namedColor && (
              <div style={s.namedColorName}>
                Named color: <strong>{result.namedColor}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {result?.error && (
          <div style={s.errorMsg}>
            <div>{result.error}</div>
            {result.format && (
              <div style={s.errorDetail}>
                Detected as {result.format} but values are invalid.
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && result.format && !result.error && result.rgba && (
          <OutputCards
            result={result}
            copiedIndex={copiedIndex}
            setCopiedIndex={setCopiedIndex}
            onCopyAll={handleCopyAll}
          />
        )}

        {/* Quick Samples */}
        <div style={s.quickSamples}>
          <span style={s.quickLabel}>Try an example:</span>
          <div style={s.quickBtns}>
            {quickSamples.map((sample, i) => (
              <button
                key={i}
                style={{
                  ...s.quickBtn,
                  backgroundColor: sample.isHex ? sample.value : 'transparent',
                  ...(sample.isHex
                    ? {}
                    : {
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: textPrimary,
                        background: bgAlt,
                        border: `2px solid ${borderColor}`,
                        width: 'auto',
                        padding: '0 0.5rem',
                      }),
                }}
                onClick={() => handleQuickSample(sample.value)}
                title={sample.label}
              >
                {sample.isHex ? '' : sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Output Generation ===== */

interface Outputs {
  HEX: string;
  RGB: string;
  RGBA: string;
  HSL: string;
  HSLA: string;
  'CSS Variable': string;
  'Tailwind': string;
}

function generateOutputs(result: DetectResult): Outputs {
  const { r, g, b, a } = result.rgba;
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);

  return {
    HEX: hex,
    RGB: `rgb(${r}, ${g}, ${b})`,
    RGBA: `rgba(${r}, ${g}, ${b}, ${a})`,
    HSL: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    HSLA: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`,
    'CSS Variable': `--color: ${hex};`,
    'Tailwind': `bg-[${hex}]`,
  };
}

/* ===== Output Cards ===== */

function OutputCards({
  result,
  copiedIndex,
  setCopiedIndex,
  onCopyAll,
}: {
  result: DetectResult;
  copiedIndex: number | null;
  setCopiedIndex: (i: number | null) => void;
  onCopyAll: () => void;
}) {
  const outputs = useMemo(() => generateOutputs(result), [result]);
  const entries = Object.entries(outputs);

  const handleCopy = useCallback(
    async (text: string, index: number) => {
      await copyToClipboard(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1200);
    },
    [setCopiedIndex]
  );

  return (
    <>
      {/* Copy All */}
      <div style={s.copyAllRow}>
        <button
          style={{
            ...s.copyAllBtn,
            opacity: copiedIndex === -1 ? 0.7 : 1,
          }}
          onClick={onCopyAll}
          type="button"
        >
          {copiedIndex === -1 ? '✓ Copied!' : 'Copy All'}
        </button>
      </div>

      {/* Result Cards */}
      <div style={s.resultsGrid}>
        {entries.map(([label, value], i) => {
          const isFullWidth = label === 'CSS Variable' || label === 'Tailwind';
          return (
            <div
              key={label}
              style={{
                ...s.resultCard,
                ...(isFullWidth ? s.resultCardFull : {}),
              }}
            >
              <div style={s.resultLabel}>{label}</div>
              <div style={s.resultRow}>
                <code style={s.resultValue}>{value}</code>
                <button
                  style={{
                    ...s.copyBtn,
                    color: copiedIndex === i ? successColor : textSecondary,
                    background:
                      copiedIndex === i
                        ? 'rgba(34, 197, 94, 0.1)'
                        : 'transparent',
                  }}
                  onClick={() => handleCopy(value, i)}
                  title={`Copy ${label}`}
                  type="button"
                >
                  {copiedIndex === i ? '✓' : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
