'use client';

import { useState, useCallback, useMemo } from 'react';
import { generateTailwindScale, textColorForBg } from '../utils/scale';
import { isValidHex, normalizeHex } from '../utils/color';
import { copyToClipboard } from '../utils/export';
import ExportModal from './ExportModal';
import type { ScaleStep } from '../utils/scale';

/* ===== Design Tokens ===== */
const primary = '#6366f1';
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Inline Styles ===== */
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '720px',
    margin: '0 auto',
    fontFamily,
    color: textPrimary,
  },
  card: {
    background: 'var(--color-bg-card)',
    border: `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-md)',
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
    margin: '0 0 0.25rem 0',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.8125rem',
    color: textSecondary,
    margin: '0 0 1.25rem 0',
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  colorPicker: {
    width: '48px',
    height: '48px',
    padding: 0,
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    cursor: 'pointer',
    background: 'none',
    flexShrink: 0,
  },
  hexInput: {
    width: '140px',
    padding: '0.625rem 0.75rem',
    fontSize: '0.9rem',
    fontFamily: monoFont,
    border: `1.5px solid ${borderColor}`,
    borderRadius: '10px',
    outline: 'none',
    background: 'var(--color-bg-card)',
    color: textPrimary,
  },
  hexInputError: {
    borderColor: '#ef4444',
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
    fontFamily,
  },
  btnPrimary: {
    background: `linear-gradient(135deg, ${primary}, #4f46e5)`,
    color: '#ffffff',
    boxShadow: `0 2px 8px rgba(99, 102, 241, 0.3)`,
  },
  btnSecondary: {
    background: 'var(--color-bg-card, #ffffff)',
    color: textPrimary,
    border: `1px solid ${borderColor}`,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableRow: {
    borderBottom: `1px solid ${borderColor}`,
  },
  tableCell: {
    padding: '0.625rem 0.5rem',
    fontSize: '0.8125rem',
    fontFamily: monoFont,
    color: textPrimary,
    verticalAlign: 'middle' as const,
  },
  swatch: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    flexShrink: 0,
  },
  copyBtn: {
    padding: '0.25rem 0.625rem',
    borderRadius: '6px',
    border: `1px solid ${borderColor}`,
    background: 'var(--color-bg-card, #ffffff)',
    color: textSecondary,
    fontSize: '0.6875rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily,
    lineHeight: 1,
  },
  exportRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${borderColor}`,
  },
  errorText: {
    color: '#ef4444',
    fontSize: '0.8125rem',
    marginTop: '0.25rem',
    fontWeight: 500,
  },
};

export default function ColorScaleGenerator() {
  const [baseHex, setBaseHex] = useState('#6366f1');
  const [hexInput, setHexInput] = useState('6366f1');
  const [hexError, setHexError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const scale = useMemo<ScaleStep[]>(() => {
    if (!isValidHex(baseHex)) return [];
    return generateTailwindScale(baseHex);
  }, [baseHex]);

  const handleColorPicker = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setBaseHex(v);
    setHexInput(v.replace('#', ''));
    setHexError('');
  }, []);

  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/^#/, '');
    setHexInput(raw);
    const withHash = '#' + raw;
    if (raw.length === 3 || raw.length === 6) {
      if (isValidHex(withHash)) {
        setHexError('');
        setBaseHex(normalizeHex(withHash));
        return;
      }
    }
    if (raw.length >= 6) {
      setHexError('Invalid hex value');
    } else {
      setHexError('');
    }
  }, []);

  const handleRandom = useCallback(() => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const hex = `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
    setBaseHex(hex);
    setHexInput(hex.replace('#', ''));
    setHexError('');
  }, []);

  const handleCopy = useCallback(async (hex: string, idx: number) => {
    const ok = await copyToClipboard(hex);
    if (ok) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    }
  }, []);

  const scaleColors = scale.map(s => s.hex);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Color Scale Generator</h2>
        <p style={styles.subtitle}>
          Generate a Tailwind CSS v3/v4-style color scale from a single base color.
        </p>

        {/* Controls */}
        <div style={styles.controlRow}>
          <input
            type="color"
            value={baseHex}
            onChange={handleColorPicker}
            style={styles.colorPicker}
            aria-label="Base color"
          />
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="6366f1"
            style={{
              ...styles.hexInput,
              ...(hexError ? styles.hexInputError : {}),
            }}
            maxLength={6}
            aria-label="Hex value"
          />
          <button
            type="button"
            onClick={handleRandom}
            style={{ ...styles.btn, ...styles.btnSecondary }}
          >
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

        {hexError && <p style={styles.errorText}>{hexError}</p>}

        {/* Scale Table */}
        {scale.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableRow}>
                <th style={{ ...styles.tableCell, fontWeight: 700, fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>Step</th>
                <th style={{ ...styles.tableCell, fontWeight: 700, fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>Swatch</th>
                <th style={{ ...styles.tableCell, fontWeight: 700, fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>HEX</th>
                <th style={{ ...styles.tableCell, fontWeight: 700, fontFamily: 'Inter, sans-serif', textAlign: 'right' }}>Luminance</th>
                <th style={{ ...styles.tableCell, width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {scale.map((step, idx) => (
                <tr key={step.name} style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{step.name}</td>
                  <td style={styles.tableCell}>
                    <div style={{ ...styles.swatch, background: step.hex }} />
                  </td>
                  <td style={styles.tableCell}>{step.hex}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'right', fontFamily: 'Inter, sans-serif', color: textSecondary }}>
                    {step.luminance.toFixed(3)}
                  </td>
                  <td style={styles.tableCell}>
                    <button
                      type="button"
                      onClick={() => handleCopy(step.hex, idx)}
                      style={copiedIdx === idx ? { ...styles.copyBtn, background: '#10b981', color: '#fff', borderColor: '#10b981' } : styles.copyBtn}
                    >
                      {copiedIdx === idx ? '✓' : 'Copy'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Export Row */}
        {scale.length > 0 && (
          <div style={styles.exportRow}>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              style={{ ...styles.btn, ...styles.btnPrimary }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Scale
            </button>
          </div>
        )}
      </div>

      <ExportModal
        colors={scaleColors}
        paletteName={`Scale-${baseHex.replace('#', '')}`}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
