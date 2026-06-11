'use client';

import { type RGB, type HSL, hexToRgb, rgbToHsl, rgbToHex, copyToClipboard } from '../utils/color';
import { useState, useRef, useCallback } from 'react';
import { savePalette, addRecentColor, formatCSSVariables, formatJSON } from '../utils/storage';
import { toolLinks } from '../utils/url';
import Toast from './Toast';

type ColorPick = {
  hex: string;
  rgb: RGB;
  hsl: HSL;
};

/* ===== Shared Design Tokens ===== */
const primary = '#6366f1';
const primaryGradient = 'linear-gradient(135deg, #6366f1, #4f46e5)';
const borderColor = '#e2e8f0';
const textPrimary = '#1e293b';
const textSecondary = '#64748b';
const bgSubtle = '#f8fafc';
const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

/* ===== Inline Styles ===== */

const wrapperStyle: React.CSSProperties = {
  maxWidth: '700px',
  margin: '0 auto',
  fontFamily,
  color: textPrimary,
};

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: `1px solid ${borderColor}`,
  borderRadius: '14px',
  padding: '1.5rem',
  marginBottom: '1.25rem',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: textPrimary,
  marginBottom: '1rem',
  letterSpacing: '-0.01em',
};

const uploadAreaStyle: React.CSSProperties = {
  border: '2px dashed #cbd5e1',
  borderRadius: '12px',
  padding: '48px 24px',
  textAlign: 'center',
  cursor: 'pointer',
  background: '#fafbff',
  transition: 'border-color 0.2s, background 0.2s',
  marginBottom: 0,
};

const uploadAreaDragging: React.CSSProperties = {
  borderColor: primary,
  background: '#eef2ff',
};

const canvasWrapStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  maxWidth: '100%',
  borderRadius: '10px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

const canvasStyle: React.CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  cursor: 'crosshair',
};

/* ===== Buttons ===== */
const btnBase: React.CSSProperties = {
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
};

const primaryBtnStyle: React.CSSProperties = {
  ...btnBase,
  background: primaryGradient,
  color: '#ffffff',
  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
};

const secondaryBtnStyle: React.CSSProperties = {
  ...btnBase,
  background: '#ffffff',
  color: textPrimary,
  border: `1px solid ${borderColor}`,
};

/* ===== Result Card ===== */
const colorCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '1rem',
  background: bgSubtle,
  borderRadius: '10px',
  border: `1px solid ${borderColor}`,
};

const swatchStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  border: `2px solid ${borderColor}`,
  flexShrink: 0,
  transition: 'transform 0.12s ease',
};

const valueRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  alignItems: 'center',
  marginBottom: '6px',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  minWidth: '36px',
  fontSize: '0.8125rem',
  color: textSecondary,
};

const valueStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.8125rem',
  background: '#ffffff',
  padding: '4px 10px',
  borderRadius: '6px',
  border: `1px solid ${borderColor}`,
  minWidth: '80px',
  textAlign: 'center' as const,
};

const copyBtnStyle: React.CSSProperties = {
  ...btnBase,
  background: '#ffffff',
  color: textSecondary,
  border: `1px solid ${borderColor}`,
  fontSize: '0.75rem',
  padding: '4px 10px',
};

const copyBtnCopiedStyle: React.CSSProperties = {
  ...copyBtnStyle,
  background: '#10b981',
  borderColor: '#10b981',
  color: '#ffffff',
};

const privacyNoteStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: textSecondary,
  textAlign: 'center',
  marginTop: '0',
  padding: '0.75rem',
  background: bgSubtle,
  borderRadius: '8px',
  border: `1px solid ${borderColor}`,
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: textPrimary,
  marginBottom: '0.75rem',
};

const dominantSwatch: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  border: `1.5px solid ${borderColor}`,
  cursor: 'pointer',
  transition: 'transform 0.12s ease, box-shadow 0.12s ease',
};

const dominantLabel: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontFamily: monoFont,
  marginTop: '2px',
  color: textSecondary,
};

const actionLinkStyle: React.CSSProperties = {
  ...btnBase,
  background: '#f0fdf4',
  color: '#166534',
  border: '1px solid #86efac',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontSize: '0.75rem',
  padding: '0.375rem 0.75rem',
};

export default function ImageColorPicker() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [colorPick, setColorPick] = useState<ColorPick | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    showToast(`${field.toUpperCase()} copied!`);
    setTimeout(() => setCopiedField(null), 1500);
  }, [showToast]);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageUrl(url);

      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        setImageLoaded(true);
        setColorPick(null);
        setDominantColors([]);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    addRecentColor(hex);

    setColorPick({ hex, rgb: { r, g, b }, hsl });
  }, []);

  const extractDominantColors = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const totalPixels = w * h;

    // Sample up to 200 random points across the image
    const NUM_SAMPLES = Math.min(200, totalPixels);
    const samples: RGB[] = [];

    const gridSize = Math.ceil(Math.sqrt(NUM_SAMPLES));
    const stepX = Math.max(1, Math.floor(w / gridSize));
    const stepY = Math.max(1, Math.floor(h / gridSize));

    for (let gy = 0; gy < gridSize && samples.length < NUM_SAMPLES; gy++) {
      for (let gx = 0; gx < gridSize && samples.length < NUM_SAMPLES; gx++) {
        const baseX = gx * stepX + Math.floor(Math.random() * stepX * 0.6);
        const baseY = gy * stepY + Math.floor(Math.random() * stepY * 0.6);
        const x = Math.min(baseX, w - 1);
        const y = Math.min(baseY, h - 1);
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        samples.push({ r: pixel[0], g: pixel[1], b: pixel[2] });
      }
    }

    // Simple distance-based clustering
    const CLUSTER_DIST = 40;
    const clusters: { avg: RGB; count: number; colors: number[][] }[] = [];

    for (const sample of samples) {
      let found = false;
      for (const cluster of clusters) {
        const dr = cluster.avg.r - sample.r;
        const dg = cluster.avg.g - sample.g;
        const db = cluster.avg.b - sample.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < CLUSTER_DIST) {
          const total = cluster.count + 1;
          cluster.avg.r = Math.round((cluster.avg.r * cluster.count + sample.r) / total);
          cluster.avg.g = Math.round((cluster.avg.g * cluster.count + sample.g) / total);
          cluster.avg.b = Math.round((cluster.avg.b * cluster.count + sample.b) / total);
          cluster.count++;
          found = true;
          break;
        }
      }
      if (!found) {
        clusters.push({ avg: { ...sample }, count: 1, colors: [[sample.r, sample.g, sample.b]] });
      }
    }

    // Sort by cluster size descending, take top 12
    clusters.sort((a, b) => b.count - a.count);
    const top = clusters.slice(0, 12);

    // Deduplicate by hex value
    const seen = new Set<string>();
    const colors: string[] = [];
    for (const cluster of top) {
      const hex = rgbToHex(cluster.avg.r, cluster.avg.g, cluster.avg.b);
      if (!seen.has(hex)) {
        seen.add(hex);
        colors.push(hex);
      }
    }

    setDominantColors(colors);
    showToast(`Extracted ${colors.length} dominant colors`);
  }, [showToast]);

  const handleSavePalette = useCallback(() => {
    if (dominantColors.length === 0) {
      if (colorPick) {
        savePalette(`Image Color - ${colorPick.hex}`, [colorPick.hex], 'image');
        showToast('Color saved!');
      }
      return;
    }
    const name = `Image Palette ${new Date().toLocaleDateString()}`;
    savePalette(name, dominantColors, 'image');
    dominantColors.forEach(c => addRecentColor(c));
    showToast(`Palette "${name}" saved!`);
  }, [dominantColors, colorPick, showToast]);

  const handleCopyAll = useCallback(async () => {
    if (dominantColors.length === 0) return;
    const text = dominantColors.join('\n');
    await copyToClipboard(text);
    showToast('All colors copied!');
  }, [dominantColors, showToast]);

  const handleExportCSS = useCallback(async () => {
    if (dominantColors.length === 0) return;
    const css = ':root {\n' + formatCSSVariables(dominantColors, 'img') + '\n}';
    await copyToClipboard(css);
    showToast('CSS variables copied!');
  }, [dominantColors, showToast]);

  const handleExportJSON = useCallback(async () => {
    if (dominantColors.length === 0) return;
    const json = formatJSON(dominantColors);
    await copyToClipboard(json);
    showToast('JSON copied!');
  }, [dominantColors, showToast]);

  return (
    <div style={wrapperStyle}>
      {/* Toast */}
      {toast && <Toast message={toast} />}

      {/* Upload Card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Image Color Picker</h2>

        {!imageLoaded && (
          <div
            style={{
              ...uploadAreaStyle,
              ...(isDragging ? uploadAreaDragging : {}),
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('image-upload-input-picker')?.click()}
          >
            <input
              id="image-upload-input-picker"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={{ fontSize: '40px', marginBottom: '12px', lineHeight: 1 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '1rem', color: textPrimary }}>
              Drop an image here or click to browse
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: textSecondary }}>
              Supports JPG, PNG, WebP, GIF, SVG
            </p>
          </div>
        )}

        {imageLoaded && imageUrl && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={canvasWrapStyle}>
                <canvas
                  ref={canvasRef}
                  style={canvasStyle}
                  onClick={handleCanvasClick}
                />
              </div>
              <p style={{ fontSize: '0.8125rem', color: textSecondary, margin: '8px 0 0' }}>
                Click anywhere on the image to pick a color
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <button
                style={secondaryBtnStyle}
                onClick={() => document.getElementById('image-upload-input-picker')?.click()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Change Image
              </button>
              <button style={primaryBtnStyle} onClick={extractDominantColors}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                </svg>
                Extract Dominant Colors
              </button>
            </div>

            {/* Color pick result */}
            {colorPick && (
              <div style={colorCardStyle}>
                <div
                  style={{ ...swatchStyle, background: colorPick.hex }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={valueRowStyle}>
                    <span style={labelStyle}>HEX</span>
                    <span style={valueStyle}>{colorPick.hex}</span>
                    <button
                      style={copiedField === 'hex' ? copyBtnCopiedStyle : copyBtnStyle}
                      onClick={() => handleCopy(colorPick.hex, 'hex')}
                    >
                      {copiedField === 'hex' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={valueRowStyle}>
                    <span style={labelStyle}>RGB</span>
                    <span style={valueStyle}>
                      rgb({colorPick.rgb.r}, {colorPick.rgb.g}, {colorPick.rgb.b})
                    </span>
                    <button
                      style={copiedField === 'rgb' ? copyBtnCopiedStyle : copyBtnStyle}
                      onClick={() =>
                        handleCopy(
                          `rgb(${colorPick.rgb.r}, ${colorPick.rgb.g}, ${colorPick.rgb.b})`,
                          'rgb'
                        )
                      }
                    >
                      {copiedField === 'rgb' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={valueRowStyle}>
                    <span style={labelStyle}>HSL</span>
                    <span style={valueStyle}>
                      hsl({colorPick.hsl.h}°, {colorPick.hsl.s}%, {colorPick.hsl.l}%)
                    </span>
                    <button
                      style={copiedField === 'hsl' ? copyBtnCopiedStyle : copyBtnStyle}
                      onClick={() =>
                        handleCopy(
                          `hsl(${colorPick.hsl.h}°, ${colorPick.hsl.s}%, ${colorPick.hsl.l}%)`,
                          'hsl'
                        )
                      }
                    >
                      {copiedField === 'hsl' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Save and open in tools */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <button style={secondaryBtnStyle} onClick={handleSavePalette}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      Save Color
                    </button>
                    <a
                      href={toolLinks.paletteGenerator(colorPick.hex)}
                      style={actionLinkStyle}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Open in Palette Generator
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Dominant colors */}
            {dominantColors.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={sectionLabel}>Dominant Colors ({dominantColors.length})</div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button style={secondaryBtnStyle} onClick={handleCopyAll}>
                      Copy All
                    </button>
                    <button style={secondaryBtnStyle} onClick={handleExportCSS}>
                      Export CSS
                    </button>
                    <button style={secondaryBtnStyle} onClick={handleExportJSON}>
                      Export JSON
                    </button>
                    <button style={primaryBtnStyle} onClick={handleSavePalette}>
                      Save Palette
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '0.75rem' }}>
                  {dominantColors.map((color, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <div
                        style={dominantSwatch}
                        onClick={() => {
                          const rgb = hexToRgb(color);
                          if (rgb) {
                            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                            setColorPick({ hex: color, rgb, hsl });
                          }
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.12)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        }}
                        title={`Click to select ${color}`}
                      />
                      <div style={dominantLabel}>{color}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reset button */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                style={secondaryBtnStyle}
                onClick={() => {
                  setImageLoaded(false);
                  setImageUrl(null);
                  setColorPick(null);
                  setDominantColors([]);
                  imgRef.current = null;
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Reset
              </button>
            </div>
          </>
        )}
      </div>

      {/* Privacy note */}
      <div style={privacyNoteStyle}>
        🔒 Your image stays on your device. No upload to any server.
      </div>
    </div>
  );
}
