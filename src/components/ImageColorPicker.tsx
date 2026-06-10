'use client';

import { type RGB, type HSL, hexToRgb, rgbToHsl, rgbToHex, copyToClipboard } from '../utils/color';
import { useState, useRef, useCallback } from 'react';

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

export default function ImageColorPicker() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [colorPick, setColorPick] = useState<ColorPick | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

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

    setColorPick({ hex, rgb: { r, g, b }, hsl });
  }, []);

  const extractDominantColors = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridX = 5;
    const gridY = 5;
    const cellW = Math.floor(canvas.width / gridX);
    const cellH = Math.floor(canvas.height / gridY);
    const colors: string[] = [];

    for (let gy = 0; gy < gridY; gy++) {
      for (let gx = 0; gx < gridX; gx++) {
        let totalR = 0, totalG = 0, totalB = 0, count = 0;

        for (let py = gy * cellH; py < (gy + 1) * cellH && py < canvas.height; py++) {
          for (let px = gx * cellW; px < (gx + 1) * cellW && px < canvas.width; px++) {
            const pixel = ctx.getImageData(px, py, 1, 1).data;
            totalR += pixel[0];
            totalG += pixel[1];
            totalB += pixel[2];
            count++;
          }
        }

        if (count > 0) {
          const avgR = Math.round(totalR / count);
          const avgG = Math.round(totalG / count);
          const avgB = Math.round(totalB / count);
          colors.push(rgbToHex(avgR, avgG, avgB));
        }
      }
    }

    const deduped = [...new Set(colors)];
    setDominantColors(deduped);
  }, []);

  return (
    <div style={wrapperStyle}>
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
            onClick={() => document.getElementById('image-upload-input')?.click()}
          >
            <input
              id="image-upload-input"
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
                onClick={() => document.getElementById('image-upload-input')?.click()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Change Image
              </button>
              <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
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
                </div>
              </div>
            )}

            {/* Dominant colors */}
            {dominantColors.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={sectionLabel}>Dominant Colors</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
