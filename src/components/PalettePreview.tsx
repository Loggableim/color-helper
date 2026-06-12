'use client';

import { useState, useCallback, useMemo } from 'react';
import { isValidHex, normalizeHex } from '../utils/color';
import ExportModal from './ExportModal';

type PreviewMode = 'buttons' | 'cards' | 'dashboard' | 'hero' | 'mobile';

const PREVIEW_MODES: { value: PreviewMode; label: string }[] = [
  { value: 'buttons', label: 'Buttons' },
  { value: 'cards', label: 'Cards' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'hero', label: 'Hero' },
  { value: 'mobile', label: 'Mobile UI' },
];

const borderColor = 'var(--color-border)';
const textPrimary = 'var(--color-text-primary)';
const textSecondary = 'var(--color-text-secondary)';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

export default function PalettePreview() {
  const [input, setInput] = useState('#7C3AED, #06B6D4, #EC4899, #F97316, #10B981');
  const [mode, setMode] = useState<PreviewMode>('buttons');
  const [exportOpen, setExportOpen] = useState(false);

  const colors = useMemo(() => {
    return input
      .split(',')
      .map(c => c.trim().replace(/^#/, ''))
      .filter(c => /^[0-9a-fA-F]{3,6}$/.test(c))
      .map(c => normalizeHex(c.startsWith('#') ? c : '#' + c))
      .filter(c => isValidHex(c));
  }, [input]);

  const primary = colors[0] || '#6366f1';
  const secondary = colors[1] || '#a855f7';
  const accent = colors[2] || '#ec4899';
  const bg = colors[3] || '#f8fafc';
  const text = colors[4] || '#1e293b';

  // Lighten/darken helper
  const shade = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };

  const isLight = (hex: string) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = num >> 16, g = (num >> 8) & 0xFF, b = num & 0xFF;
    return (r * 0.299 + g * 0.587 + b * 0.114) > 128;
  };

  const textOn = (hex: string) => isLight(hex) ? '#111111' : '#f0f0f0';

  const previewStyle: React.CSSProperties = {
    background: bg, color: text, fontFamily,
    borderRadius: '12px', padding: '1.5rem',
    border: `1px solid ${borderColor}`,
    minHeight: '200px', transition: 'all 0.2s ease',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', fontFamily, color: textPrimary }}>
      {/* Input */}
      <div style={{
        background: 'var(--color-bg-card)', border: `1px solid ${borderColor}`,
        borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem',
        boxShadow: 'var(--shadow-md)',
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem 0', letterSpacing: '-0.01em' }}>
          Palette Preview
        </h2>
        <p style={{ fontSize: '0.8125rem', color: textSecondary, margin: '0 0 1rem 0' }}>
          Enter comma-separated hex colors to see them on real UI components.
        </p>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '0.375rem' }}>
          Colors (comma-separated)
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '0.625rem 0.875rem',
              fontSize: '0.875rem', fontFamily: "'JetBrains Mono', monospace",
              border: `1.5px solid ${borderColor}`, borderRadius: '10px',
              outline: 'none', background: 'var(--color-bg-card)', color: textPrimary,
            }}
            placeholder="#6366f1, #a855f7, #ec4899"
          />
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {colors.slice(0, 5).map((c, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '6px', background: c, border: `1px solid ${borderColor}` }} title={c} />
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '1rem' }}>
          {PREVIEW_MODES.map(m => (
            <button
              key={m.value}
              type="button"
              style={{
                padding: '0.375rem 0.75rem', borderRadius: '8px',
                border: mode === m.value ? `2px solid ${primary}` : `1.5px solid ${borderColor}`,
                background: mode === m.value ? '#eef2ff' : 'transparent',
                color: mode === m.value ? primary : textSecondary,
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                fontFamily, lineHeight: 1,
              }}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            style={{
              marginLeft: 'auto',
              padding: '0.375rem 0.75rem', borderRadius: '8px',
              border: `1.5px solid ${primary}`, background: '#eef2ff',
              color: primary, fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', fontFamily, lineHeight: 1,
            }}
          >
            Export Palette
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div style={previewStyle}>
        {mode === 'buttons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ padding: '0.625rem 1.375rem', borderRadius: 10, background: primary, color: textOn(primary), fontWeight: 600, fontSize: '0.875rem' }}>Primary</span>
              <span style={{ padding: '0.625rem 1.375rem', borderRadius: 10, background: secondary, color: textOn(secondary), fontWeight: 600, fontSize: '0.875rem' }}>Secondary</span>
              <span style={{ padding: '0.625rem 1.375rem', borderRadius: 10, background: accent, color: textOn(accent), fontWeight: 600, fontSize: '0.875rem' }}>Accent</span>
              <span style={{ padding: '0.625rem 1.375rem', borderRadius: 10, border: `1.5px solid ${borderColor}`, color: text, fontWeight: 600, fontSize: '0.875rem', background: 'transparent' }}>Outline</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: textSecondary }}>Hover:</span>
              <span style={{ padding: '0.5rem 1rem', borderRadius: 8, background: shade(primary, -20), color: textOn(primary), fontWeight: 600, fontSize: '0.8125rem' }}>Primary</span>
              <span style={{ padding: '0.5rem 1rem', borderRadius: 8, background: shade(secondary, -20), color: textOn(secondary), fontWeight: 600, fontSize: '0.8125rem' }}>Secondary</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: textSecondary, margin: 0 }}>
              Button styles using your palette — primary, secondary, accent, outline, and hover states.
            </p>
          </div>
        )}

        {mode === 'cards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {[0, 1, 2].map(i => {
              const cardBg = i === 0 ? primary : i === 1 ? secondary : accent;
              const isDark = !isLight(cardBg);
              return (
                <div key={i} style={{
                  background: cardBg, color: isDark ? '#f1f5f9' : '#0f172a',
                  borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', marginBottom: '0.75rem' }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.375rem' }}>Card {i + 1}</div>
                  <div style={{ fontSize: '0.8125rem', opacity: 0.8, marginBottom: '1rem' }}>Preview your palette applied to card components in context.</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.375rem 0.75rem', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', fontSize: '0.75rem', fontWeight: 600 }}>Action</span>
                    <span style={{ padding: '0.375rem 0.75rem', borderRadius: 6, background: 'transparent', border: `1px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`, fontSize: '0.75rem', fontWeight: 600 }}>Link</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Sidebar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{
                width: 160, background: primary, borderRadius: 12, padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem', color: textOn(primary),
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Sidebar</div>
                {['Dashboard', 'Analytics', 'Settings', 'Users'].map(item => (
                  <div key={item} style={{
                    padding: '0.375rem 0.5rem', borderRadius: 6,
                    background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', fontWeight: 500,
                  }}>{item}</div>
                ))}
              </div>
              {/* Main */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Revenue', value: '$12.4k', color: primary },
                    { label: 'Users', value: '1,892', color: secondary },
                    { label: 'Growth', value: '+23%', color: accent },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, minWidth: 100, background: 'var(--color-bg-card)',
                      borderRadius: 10, padding: '0.75rem', border: `1px solid ${borderColor}`,
                    }}>
                      <div style={{ fontSize: '0.6875rem', color: textSecondary, fontWeight: 600, marginBottom: '0.25rem' }}>{s.label}</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {/* Chart placeholder */}
                <div style={{
                  background: 'var(--color-bg-card)', borderRadius: 10,
                  border: `1px solid ${borderColor}`, padding: '1rem',
                  display: 'flex', alignItems: 'flex-end', gap: '4px', height: 100,
                }}>
                  {[40, 60, 35, 80, 55, 90, 45].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, height: `${h}%`, background: [primary, secondary, accent][i % 3],
                      borderRadius: '4px 4px 0 0', opacity: 0.7 + (i / 14),
                    }} />
                  ))}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: textSecondary, margin: 0, textAlign: 'center' }}>
              Dashboard layout with sidebar, stat cards, and chart — all using your palette colors.
            </p>
          </div>
        )}

        {mode === 'hero' && (
          <div style={{
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            borderRadius: 14, padding: '2.5rem', textAlign: 'center', color: '#ffffff',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.25rem 0.75rem', borderRadius: 999, background: 'rgba(255,255,255,0.15)',
              fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem',
            }}>
              Your Brand
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Your Hero Headline Here
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.85, maxWidth: 400, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Subtitle text describing what your product or service does.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.625rem 1.5rem', borderRadius: 10, background: 'var(--color-bg-card, #ffffff)',
                color: primary, fontWeight: 700, fontSize: '0.875rem',
              }}>Get Started</span>
              <span style={{
                padding: '0.625rem 1.5rem', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.4)',
                color: '#ffffff', fontWeight: 600, fontSize: '0.875rem',
              }}>Learn More</span>
            </div>
          </div>
        )}

        {mode === 'mobile' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 240, background: `linear-gradient(180deg, ${primary}, ${shade(primary, -30)})`,
              borderRadius: 24, padding: '1rem', color: '#ffffff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}>
              {/* Status bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '1rem', opacity: 0.8 }}>
                <span>9:41</span>
                <span>📶 🔋</span>
              </div>
              {/* Header */}
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>App Name</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '1.5rem' }}>Welcome back!</div>
              {/* Card */}
              <div style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 12,
                padding: '0.75rem', marginBottom: '0.75rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Balance</span>
                  <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>$2,450</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[40, 70, 50].map((w, i) => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: [accent, secondary, '#ffffff'][i],
                      opacity: 0.6,
                    }} />
                  ))}
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{
                  flex: 1, padding: '0.5rem', borderRadius: 8,
                  background: accent, textAlign: 'center', fontWeight: 700, fontSize: '0.75rem',
                }}>Send</div>
                <div style={{
                  flex: 1, padding: '0.5rem', borderRadius: 8,
                  background: 'rgba(255,255,255,0.2)', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem',
                }}>Request</div>
              </div>
              {/* Nav */}
              <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                {['Home', 'Stats', 'Profile'].map(nav => (
                  <div key={nav} style={{ fontSize: '0.6875rem', opacity: nav === 'Home' ? 1 : 0.5, fontWeight: 600 }}>{nav}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ExportModal
        colors={colors}
        paletteName="Preview-Palette"
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
