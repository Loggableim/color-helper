'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { isValidHex, normalizeHex, hexToRgb, rgbToHsl, getContrastRatio, copyToClipboard } from '../utils/color';
import Toast from './Toast';

/* ===== Design Tokens ===== */
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', monospace";

/* ===== Helpers ===== */
function pickInitialHex(): string {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

interface ColorSide {
  hex: string;
}

const sharedRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  marginBottom: '0.5rem',
  flexWrap: 'wrap' as const,
};

const sharedInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '100px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  fontFamily: monoFont,
  color: textPrimary,
  background: 'var(--color-bg-card, #ffffff)',
  border: `1.5px solid ${borderColor}`,
  borderRadius: '8px',
  outline: 'none',
};

const sharedLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: textSecondary,
  marginBottom: '0.375rem',
};

function ColorColumn({ title, value, onChange, accentVar }: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  accentVar: string;
}) {
  const [draft, setDraft] = useState(value);
  const [err, setErr] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDraft(v);
    if (isValidHex(v)) {
      onChange(normalizeHex(v));
      setErr(false);
    } else {
      setErr(v.length > 2);
    }
  }, [onChange]);

  const rgb = useMemo(() => hexToRgb(value), [value]);
  const hsl = useMemo(() => rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null, [rgb]);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <h3 style={{ ...sharedLabelStyle, fontSize: '0.875rem', textTransform: 'none', letterSpacing: 0, fontWeight: 700, color: textPrimary, marginBottom: '0.625rem' }}>
        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: accentVar, marginRight: '0.375rem', verticalAlign: 'middle' }}></span>
        {title}
      </h3>
      <div style={{
        height: '120px',
        borderRadius: '10px',
        border: `2px solid ${borderColor}`,
        marginBottom: '0.75rem',
        background: value,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0.5rem',
      }}>
        <span style={{
          fontFamily: monoFont,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: getContrastRatio(value, '#000000') > getContrastRatio(value, '#ffffff') ? '#000' : '#fff',
          background: getContrastRatio(value, '#000000') > getContrastRatio(value, '#ffffff') ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
        }}>
          {value.toUpperCase()}
        </span>
      </div>
      <div style={sharedRowStyle}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(normalizeHex(e.target.value))}
          style={{ width: '38px', height: '38px', border: `1.5px solid ${borderColor}`, borderRadius: '8px', cursor: 'pointer', background: 'none', padding: 0, flexShrink: 0 }}
        />
        <input
          type="text"
          value={draft}
          onChange={handleInput}
          spellCheck={false}
          style={{ ...sharedInputStyle, borderColor: err ? '#ef4444' : borderColor }}
        />
        <button
          type="button"
          onClick={() => { onChange(pickInitialHex()); }}
          style={{ padding: '0.4rem 0.625rem', fontSize: '0.75rem', fontWeight: 600, background: 'var(--color-bg-card, #ffffff)', color: textSecondary, border: `1.5px solid ${borderColor}`, borderRadius: '8px', cursor: 'pointer', lineHeight: 1 }}
          title="Random color"
        >
          🎲
        </button>
      </div>
      {rgb && hsl && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', fontSize: '0.75rem' }}>
          <div><span style={{ color: textSecondary, display: 'block' }}>RGB</span><span style={{ fontFamily: monoFont, fontWeight: 600 }}>{rgb.r}, {rgb.g}, {rgb.b}</span></div>
          <div><span style={{ color: textSecondary, display: 'block' }}>HSL</span><span style={{ fontFamily: monoFont, fontWeight: 600 }}>{hsl.h}°, {hsl.s}%, {hsl.l}%</span></div>
        </div>
      )}
    </div>
  );
}

export default function ColorComparison() {
  const [colorA, setColorA] = useState('#6366f1');
  const [colorB, setColorB] = useState('#ec4899');
  const [toast, setToast] = useState<string | null>(null);

  // Read URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const a = params.get('a');
    const b = params.get('b');
    if (a && isValidHex(a)) setColorA(normalizeHex(a));
    if (b && isValidHex(b)) setColorB(normalizeHex(b));
  }, []);

  const handleSwap = useCallback(() => {
    setColorA(colorB);
    setColorB(colorA);
  }, [colorA, colorB]);

  const contrast = getContrastRatio(colorA, colorB);

  const handleCopyValues = useCallback(async () => {
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);
    if (!rgbA || !rgbB) return;
    const text = `Color A: ${colorA.toUpperCase()}  (rgb(${rgbA.r}, ${rgbA.g}, ${rgbA.b}))\nColor B: ${colorB.toUpperCase()}  (rgb(${rgbB.r}, ${rgbB.g}, ${rgbB.b}))\nContrast Ratio: ${contrast}:1`;
    await copyToClipboard(text);
    setToast('Comparison copied to clipboard');
  }, [colorA, colorB, contrast]);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', fontFamily }}>
      {/* Side-by-side */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ColorColumn title="Color A" value={colorA} onChange={setColorA} accentVar={colorA} />
        <button
          type="button"
          onClick={handleSwap}
          title="Swap colors"
          style={{
            marginTop: '4.5rem',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--color-bg-card, #ffffff)',
            color: textSecondary,
            border: `1.5px solid ${borderColor}`,
            cursor: 'pointer',
            fontSize: '1.125rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ⇄
        </button>
        <ColorColumn title="Color B" value={colorB} onChange={setColorB} accentVar={colorB} />
      </div>

      {/* Comparison results */}
      <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: bgSubtle, border: `1px solid ${borderColor}`, borderRadius: '12px' }}>
        <h3 style={{ ...sharedLabelStyle, fontSize: '0.9375rem', textTransform: 'none', letterSpacing: 0, color: textPrimary, marginBottom: '1rem', fontWeight: 700 }}>Comparison</h3>

        {/* Contrast ratio — the key metric */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: '0.875rem', color: textSecondary }}>Contrast Ratio (A on B)</span>
          <span style={{ fontFamily: monoFont, fontSize: '1.125rem', fontWeight: 700, color: contrast >= 4.5 ? '#22c55e' : contrast >= 3 ? '#eab308' : '#ef4444' }}>
            {contrast}:1
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: '0.875rem', color: textSecondary }}>WCAG AA (Normal Text)</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: contrast >= 4.5 ? '#22c55e' : '#ef4444' }}>
            {contrast >= 4.5 ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: '0.875rem', color: textSecondary }}>WCAG AA (Large Text)</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: contrast >= 3 ? '#22c55e' : '#ef4444' }}>
            {contrast >= 3 ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: '0.875rem', color: textSecondary }}>WCAG AAA (Normal)</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: contrast >= 7 ? '#22c55e' : '#ef4444' }}>
            {contrast >= 7 ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
          <span style={{ fontSize: '0.875rem', color: textSecondary }}>Δ Hue / Sat / Light</span>
          <span style={{ fontFamily: monoFont, fontSize: '0.75rem', color: textPrimary }}>
            {(() => {
              const a = hexToRgb(colorA), b = hexToRgb(colorB);
              if (!a || !b) return '—';
              const ha = rgbToHsl(a.r, a.g, a.b), hb = rgbToHsl(b.r, b.g, b.b);
              const dh = Math.min(Math.abs(ha.h - hb.h), 360 - Math.abs(ha.h - hb.h));
              return `Δ${dh.toFixed(0)}° / ${Math.abs(ha.s - hb.s).toFixed(0)}% / ${Math.abs(ha.l - hb.l).toFixed(0)}%`;
            })()}
          </span>
        </div>
      </div>

      {/* Preview on real UI elements */}
      <div style={{ marginTop: '1rem', padding: '1.25rem', border: `1px solid ${borderColor}`, borderRadius: '12px' }}>
        <h3 style={{ ...sharedLabelStyle, fontSize: '0.875rem', textTransform: 'none', letterSpacing: 0, color: textPrimary, marginBottom: '1rem', fontWeight: 700 }}>Live Preview</h3>
        <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${borderColor}` }}>
          <div style={{ flex: 1, padding: '1.25rem', background: colorA, color: getContrastRatio(colorA, '#000000') > getContrastRatio(colorA, '#ffffff') ? '#000' : '#fff' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Background A</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Headline on A</div>
            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0' }}>Body text on the first color background.</p>
          </div>
          <div style={{ flex: 1, padding: '1.25rem', background: colorB, color: getContrastRatio(colorB, '#000000') > getContrastRatio(colorB, '#ffffff') ? '#000' : '#fff' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Background B</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Headline on B</div>
            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0' }}>Body text on the second color background.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleCopyValues}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
            background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
          }}
        >
          📋 Copy Comparison
        </button>
        <button
          type="button"
          onClick={() => { setColorA(pickInitialHex()); setColorB(pickInitialHex()); }}
          style={{
            padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
            background: 'var(--color-bg-card, #ffffff)', color: textPrimary,
            border: `1px solid ${borderColor}`, borderRadius: '10px', cursor: 'pointer',
          }}
        >
          🎲 Random Both
        </button>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
