'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  HARMONY_TYPES,
  getHarmonyPoints,
  drawColorWheel,
  drawHarmonyPoints,
  getHueFromPosition,
} from '../utils/wheel';
import type { HarmonyType, WheelPoint } from '../utils/wheel';
import { copyToClipboard } from '../utils/color';
import ExportModal from './ExportModal';

/* ===== Styles ===== */
const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

const s: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: '800px', margin: '0 auto', fontFamily, color: textPrimary },
  card: {
    background: 'var(--color-bg-card)', border: `1px solid ${borderColor}`,
    borderRadius: '14px', padding: '1.5rem', boxShadow: 'var(--shadow-md)',
    marginBottom: '1.25rem',
  },
  title: { fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem 0', letterSpacing: '-0.01em' },
  subtitle: { fontSize: '0.8125rem', color: textSecondary, margin: '0 0 1.25rem 0' },
  wheelRow: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap' as const, alignItems: 'flex-start' },
  wheelCanvasWrap: { flex: '0 0 320px', maxWidth: '100%' },
  wheelCanvas: { width: '100%', height: 'auto', maxWidth: 320, cursor: 'crosshair' },
  sidePanel: { flex: 1, minWidth: '200px' },
  harmonyGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '1rem' },
  harmonyBtn: (active: boolean): React.CSSProperties => ({
    padding: '0.375rem 0.625rem', borderRadius: '8px',
    border: active ? `2px solid ${primary}` : `1.5px solid ${borderColor}`,
    background: active ? '#eef2ff' : 'transparent',
    color: active ? primary : textSecondary,
    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
    fontFamily, lineHeight: 1, transition: 'all 0.15s ease',
  }),
  paletteRow: { display: 'flex', gap: '4px', flexWrap: 'wrap' as const, marginBottom: '0.75rem' },
  swatch: (hex: string, isBase: boolean): React.CSSProperties => ({
    width: isBase ? 48 : 40, height: isBase ? 48 : 40,
    borderRadius: '10px', background: hex,
    border: isBase ? `3px solid ${primary}` : `1px solid ${borderColor}`,
    cursor: 'pointer', transition: 'transform 0.12s ease',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    padding: '2px',
  }),
  valueRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' },
  valueLabel: { fontSize: '0.6875rem', fontWeight: 600, color: textSecondary, minWidth: '2rem', textTransform: 'uppercase' as const },
  valueText: { fontFamily: monoFont, fontSize: '0.8125rem', color: textPrimary, background: bgSubtle, padding: '0.25rem 0.5rem', borderRadius: '6px', flex: 1 },
  copyBtn: {
    padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${borderColor}`,
    background: 'var(--color-bg-card, #ffffff)', color: textSecondary, fontSize: '0.6875rem', fontWeight: 600,
    cursor: 'pointer', fontFamily, lineHeight: 1,
  },
  actionRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, marginTop: '1rem' },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 600,
    lineHeight: 1, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily,
  },
  btnPrimary: { background: `linear-gradient(135deg, ${primary}, #4f46e5)`, color: '#ffffff', boxShadow: `0 2px 8px rgba(99, 102, 241, 0.3)` },
  btnSecondary: { background: 'var(--color-bg-card, #ffffff)', color: textPrimary, border: `1px solid ${borderColor}` },
};

export default function ColorWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hue, setHue] = useState(239);
  const [sat, setSat] = useState(70);
  const [light, setLight] = useState(55);
  const [harmony, setHarmony] = useState<HarmonyType>('complementary');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const points = useMemo(() => getHarmonyPoints(hue, harmony, sat, light), [hue, harmony, sat, light]);

  // Draw wheel when anything changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) * 0.85;

    drawColorWheel(ctx, { cx, cy, radius, baseHue: hue, harmonyType: harmony, sat, light });
    drawHarmonyPoints(ctx, { cx, cy, radius, baseHue: hue, harmonyType: harmony, sat, light });

    // Center label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Drag to rotate', cx, cy + 4);
  }, [hue, harmony, sat, light]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy) * 0.85;
    const newHue = getHueFromPosition(e.clientX - rect.left, e.clientY - rect.top, cx, cy, radius);
    if (newHue >= 0) setHue(newHue);
  }, []);

  const handleCanvasDrag = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    handleCanvasClick(e);
  }, [handleCanvasClick]);

  const handleCopy = useCallback(async (hex: string, idx: number) => {
    const ok = await copyToClipboard(hex);
    if (ok) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    }
  }, []);

  const basePoint = points[0];

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <h2 style={s.title}>Interactive Color Wheel</h2>
        <p style={s.subtitle}>Drag on the wheel to rotate. Pick a harmony type to generate a palette.</p>

        <div style={s.wheelRow}>
          {/* Canvas */}
          <div style={s.wheelCanvasWrap}>
            <canvas
              ref={canvasRef}
              style={s.wheelCanvas}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasDrag}
              width={320}
              height={320}
            />
          </div>

          {/* Side panel */}
          <div style={s.sidePanel}>
            {/* Harmony selectors */}
            <div style={{ ...s.harmonyGrid, marginBottom: '1rem' }}>
              {HARMONY_TYPES.map(h => (
                <button
                  key={h.value}
                  type="button"
                  style={s.harmonyBtn(harmony === h.value)}
                  onClick={() => setHarmony(h.value)}
                  title={h.description}
                >
                  {h.label}
                </button>
              ))}
            </div>

            {/* Base color values */}
            {basePoint && (
              <>
                <div style={s.valueRow}>
                  <span style={s.valueLabel}>HEX</span>
                  <span style={s.valueText}>{basePoint.hex}</span>
                  <button style={{ ...s.copyBtn }} onClick={() => handleCopy(basePoint.hex, -1)} type="button">
                    {copiedIdx === -1 ? '✓' : 'Copy'}
                  </button>
                </div>
                <div style={s.valueRow}>
                  <span style={s.valueLabel}>HUE</span>
                  <input type="range" min={0} max={360} value={hue} onChange={e => setHue(Number(e.target.value))}
                    className="hue-slider" style={{ flex: 1, height: 6 }} aria-label="Hue" />
                  <span style={{ ...s.valueText, textAlign: 'center', minWidth: '2.5rem', fontFamily: 'Inter, sans-serif' }}>{hue}°</span>
                </div>
              </>
            )}

            {/* Generated palette */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: textPrimary, marginBottom: '0.5rem' }}>
                Generated Palette ({points.length})
              </div>
              <div style={s.paletteRow}>
                {points.map((p, idx) => (
                  <div key={idx} style={s.swatch(p.hex, idx === 0)}
                    onClick={() => handleCopy(p.hex, idx)}
                    title={`${p.label}: ${p.hex}`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={s.actionRow}>
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                style={{ ...s.btn, ...s.btnPrimary }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <ExportModal
        colors={points.map(p => p.hex)}
        paletteName={`ColorWheel-${basePoint?.hex.replace('#', '') || 'palette'}`}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
