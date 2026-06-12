'use client';

import { useState, useCallback, useMemo } from 'react';
import { copyToClipboard } from '../utils/color';
import ExportModal from './ExportModal';
import galleryData from '../data/gallery.json';

interface GalleryItem {
  name: string;
  colors: string[];
  category: string;
  tags: string[];
  description: string;
}

const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const CATEGORIES = ['All', 'Warm', 'Cool', 'Dark', 'Purple', 'Green', 'Pink', 'Vibrant', 'Red', 'Yellow', 'Neutral'];

export default function PaletteGallery() {
  const [activeCat, setActiveCat] = useState('All');
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportColors, setExportColors] = useState<string[]>([]);
  const [exportName, setExportName] = useState('');

  const palettes = galleryData as GalleryItem[];

  const filtered = useMemo(() => {
    if (activeCat === 'All') return palettes;
    return palettes.filter(p => p.category === activeCat);
  }, [activeCat]);

  const handleCopy = useCallback(async (colors: string[], name: string) => {
    await copyToClipboard(colors.join(', '));
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 1200);
  }, []);

  const handleExport = useCallback((colors: string[], name: string) => {
    setExportColors(colors);
    setExportName(name);
    setExportOpen(true);
  }, []);

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    border: `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding: '1rem',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', fontFamily, color: textPrimary }}>
      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.75rem 0', letterSpacing: '-0.01em' }}>
          Curated Palettes
        </h2>
        <p style={{ fontSize: '0.8125rem', color: textSecondary, margin: '0 0 1rem 0' }}>
          Hand-picked color palettes for every mood and brand. Click to copy, export, or save.
        </p>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              style={{
                padding: '0.375rem 0.75rem', borderRadius: '8px',
                border: activeCat === cat ? `2px solid #6366f1` : `1.5px solid ${borderColor}`,
                background: activeCat === cat ? '#eef2ff' : 'transparent',
                color: activeCat === cat ? '#6366f1' : textSecondary,
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                fontFamily, lineHeight: 1, transition: 'all 0.15s ease',
              }}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
        {filtered.map(p => (
          <div key={p.name} style={cardStyle}>
            {/* Swatches */}
            <div style={{ display: 'flex', gap: '3px', borderRadius: '8px', overflow: 'hidden', height: 56, marginBottom: '0.75rem' }}>
              {p.colors.map((c, i) => (
                <div key={i} style={{ flex: 1, background: c, cursor: 'pointer' }}
                  onClick={() => copyToClipboard(c)}
                  title={`Copy ${c}`}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scaleY(1.15)'; (e.currentTarget as HTMLElement).style.zIndex = '1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scaleY(1)'; (e.currentTarget as HTMLElement).style.zIndex = '0'; }}
                />
              ))}
            </div>

            {/* Info */}
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.125rem' }}>{p.name}</div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>{p.description}</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {p.tags.map(tag => (
                <span key={tag} style={{
                  padding: '0.125rem 0.5rem', borderRadius: '999px',
                  background: 'var(--color-primary-subtle)', color: '#6366f1',
                  fontSize: '0.625rem', fontWeight: 600,
                }}>{tag}</span>
              ))}
            </div>

            {/* Hex values */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {p.colors.map((c, i) => (
                <span key={i} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem',
                  color: textSecondary, background: 'var(--color-bg-alt)',
                  padding: '0.125rem 0.375rem', borderRadius: '4px',
                }}>{c}</span>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleExport(p.colors, p.name)} style={{
                padding: '0.375rem 0.75rem', borderRadius: '8px',
                border: `1.5px solid ${borderColor}`, background: 'var(--color-bg-card, #ffffff)',
                color: textSecondary, fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', fontFamily, lineHeight: 1,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderColor; (e.currentTarget as HTMLElement).style.color = textSecondary; }}
              >
                Export
              </button>
              <button type="button" onClick={() => handleCopy(p.colors, p.name)} style={{
                padding: '0.375rem 0.75rem', borderRadius: '8px',
                border: `1.5px solid ${borderColor}`, background: 'var(--color-bg-card, #ffffff)',
                color: textSecondary, fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', fontFamily, lineHeight: 1,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderColor; (e.currentTarget as HTMLElement).style.color = textSecondary; }}
              >
                {copiedName === p.name ? '✓ Copied!' : 'Copy All'}
              </button>
              <button type="button" onClick={() => {
                const url = `/preview/?colors=${p.colors.join(',')}`;
                window.open(url, '_blank');
              }} style={{
                padding: '0.375rem 0.75rem', borderRadius: '8px',
                border: `1.5px solid ${borderColor}`, background: 'var(--color-bg-card, #ffffff)',
                color: textSecondary, fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', fontFamily, lineHeight: 1,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderColor; (e.currentTarget as HTMLElement).style.color = textSecondary; }}
              >
                Preview
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
