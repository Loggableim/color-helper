'use client';

import { useState, useCallback, useEffect } from 'react';
import { getPalettes, deletePalette, renamePalette } from '../utils/storage';
import { copyToClipboard } from '../utils/color';
import ExportModal from './ExportModal';
import type { SavedPalette } from '../utils/storage';

/* ===== Styles ===== */
const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const bgSubtle = 'var(--color-bg-alt)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
  padding: '0.5rem 0.875rem', fontSize: '0.75rem', fontWeight: 600,
  lineHeight: 1, border: `1.5px solid ${borderColor}`, borderRadius: '8px',
  background: 'var(--color-bg-card, #ffffff)', color: textSecondary, cursor: 'pointer',
  fontFamily, transition: 'all 0.15s ease',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: `1px solid ${borderColor}`,
  borderRadius: '14px',
  padding: '1rem',
  boxShadow: 'var(--shadow-sm)',
};

export default function PaletteLibrary() {
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportColors, setExportColors] = useState<string[]>([]);
  const [exportName, setExportName] = useState('');

  useEffect(() => {
    setPalettes(getPalettes());
  }, []);

  const refresh = useCallback(() => {
    setPalettes(getPalettes());
  }, []);

  const handleDelete = useCallback((id: string) => {
    deletePalette(id);
    refresh();
  }, [refresh]);

  const handleRenameStart = useCallback((p: SavedPalette) => {
    setRenameId(p.id);
    setRenameVal(p.name);
  }, []);

  const handleRenameDone = useCallback(() => {
    if (renameId && renameVal.trim()) {
      renamePalette(renameId, renameVal.trim());
      refresh();
    }
    setRenameId(null);
  }, [renameId, renameVal, refresh]);

  const handleExport = useCallback((colors: string[], name: string) => {
    setExportColors(colors);
    setExportName(name);
    setExportOpen(true);
  }, []);

  const handleShareUrl = useCallback(async (colors: string[]) => {
    const encoded = btoa(colors.join(','));
    const url = `${window.location.origin}/?palette=${encoded}`;
    await copyToClipboard(url);
  }, []);

  const handleCopyAll = useCallback(async (colors: string[]) => {
    await copyToClipboard(colors.join(', '));
  }, []);

  const sourceLabel = (s: SavedPalette['source']): string => {
    return { picker: '🎨 Picker', image: '🖼️ Image', generator: '⚙️ Generator', random: '🎲 Random', brand: '🏷️ Brand', converter: '🔄 Converter', gradient: '🌈 Gradient' }[s] || s;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', fontFamily, color: textPrimary }}>
      {/* Header */}
      <div style={{ ...cardStyle, marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
              My Palettes
            </h2>
            <p style={{ fontSize: '0.8125rem', color: textSecondary, margin: '0.25rem 0 0' }}>
              {palettes.length} saved {palettes.length === 1 ? 'palette' : 'palettes'} stored in your browser.
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {palettes.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎨</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.375rem' }}>No saved palettes yet</h3>
          <p style={{ fontSize: '0.875rem', color: textSecondary, margin: '0 0 1rem' }}>
            Use any color tool and click "Save" to build your collection.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/color-picker/" style={{ textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '10px', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.8125rem' }}>Open Color Picker</a>
            <a href="/generate/color-wheel/" style={{ textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '10px', border: `1.5px solid ${borderColor}`, color: textPrimary, fontWeight: 600, fontSize: '0.8125rem' }}>Try Color Wheel</a>
          </div>
        </div>
      )}

      {/* Palette grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {palettes.map(p => (
          <div key={p.id} style={cardStyle}>
            {/* Color swatches */}
            <div style={{ display: 'flex', gap: '3px', borderRadius: '8px', overflow: 'hidden', height: 48, marginBottom: '0.75rem' }}>
              {p.colors.slice(0, 8).map((c, i) => (
                <div key={i} style={{ flex: 1, background: c }} title={c} />
              ))}
            </div>

            {/* Name */}
            {renameId === p.id ? (
              <input
                type="text"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={handleRenameDone}
                onKeyDown={e => { if (e.key === 'Enter') handleRenameDone(); }}
                style={{
                  width: '100%', padding: '0.375rem 0.5rem', fontSize: '0.875rem',
                  fontFamily, border: `1.5px solid #6366f1`, borderRadius: '6px',
                  outline: 'none', marginBottom: '0.25rem',
                  background: 'var(--color-bg-card)', color: textPrimary,
                }}
                autoFocus
              />
            ) : (
              <div
                style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.125rem', cursor: 'pointer' }}
                onClick={() => handleRenameStart(p)}
                title="Click to rename"
              >
                {p.name}
              </div>
            )}

            {/* Meta */}
            <div style={{ fontSize: '0.6875rem', color: textSecondary, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span>{sourceLabel(p.source)}</span>
              <span>·</span>
              <span>{p.colors.length} colors</span>
              <span>·</span>
              <span>{new Date(p.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              <button type="button" style={btnStyle} onClick={() => handleExport(p.colors, p.name)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderColor; (e.currentTarget as HTMLElement).style.color = textSecondary; }}
              >
                Export
              </button>
              <button type="button" style={btnStyle} onClick={() => handleCopyAll(p.colors)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderColor; (e.currentTarget as HTMLElement).style.color = textSecondary; }}
              >
                Copy All
              </button>
              <button type="button" style={btnStyle} onClick={() => handleShareUrl(p.colors)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderColor; (e.currentTarget as HTMLElement).style.color = textSecondary; }}
              >
                Share
              </button>
              <button type="button" style={{ ...btnStyle, color: '#ef4444', borderColor: '#fecaca', marginLeft: 'auto' }}
                onClick={() => handleDelete(p.id)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ffffff'; }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <ExportModal
        colors={exportColors}
        paletteName={exportName}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
