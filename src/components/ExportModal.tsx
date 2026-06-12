'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { EXPORT_FORMATS, formatExport, downloadExport, copyToClipboard } from '../utils/export';
import type { ExportFormat } from '../utils/export';

interface ExportModalProps {
  colors: string[];
  paletteName?: string;
  isOpen: boolean;
  onClose: () => void;
  show?: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '1rem',
};

const modalStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  padding: '1.5rem',
  maxWidth: '560px',
  width: '100%',
  maxHeight: '80vh',
  overflow: 'auto',
  boxShadow: 'var(--shadow-2xl)',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.25rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.01em',
  margin: 0,
};

const closeBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '1.125rem',
  color: 'var(--color-text-secondary)',
  lineHeight: 1,
};

const formatGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const formatBtnStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.625rem 0.75rem',
  borderRadius: '10px',
  border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
  background: active ? 'var(--color-primary-subtle)' : 'transparent',
  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 0.15s ease',
  lineHeight: 1,
});

const codeBlockStyle: React.CSSProperties = {
  background: '#0f172a',
  color: '#e2e8f0',
  padding: '1rem',
  borderRadius: '10px',
  fontSize: '0.75rem',
  fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  lineHeight: '20px',
  overflow: 'auto',
  maxHeight: '240px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  margin: '0 0 1rem 0',
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const actionBtnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '120px',
  padding: '0.625rem 1rem',
  borderRadius: '10px',
  border: 'none',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  lineHeight: 1,
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
};

const copyBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  background: 'var(--color-primary)',
  color: '#ffffff',
  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
};

const downloadBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-primary)',
  border: '1.5px solid var(--color-border)',
};

export default function ExportModal({ colors, paletteName, isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const content = formatExport({ colors, format, paletteName: paletteName || 'Export' });

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    downloadExport(colors, format, paletteName);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1500);
  }, [colors, format, paletteName]);

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={modalRef} style={modalStyle} role="dialog" aria-modal="true" aria-label="Export palette">
        <div style={headerStyle}>
          <h3 style={titleStyle}>Export {paletteName ? `"${paletteName}"` : 'Palette'}</h3>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {/* Format selector */}
        <div style={formatGridStyle}>
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              style={formatBtnStyle(format === fmt.value)}
              onClick={() => { setFormat(fmt.value); setCopied(false); setDownloaded(false); }}
              type="button"
            >
              <span>{fmt.icon}</span>
              <span>{fmt.label}</span>
            </button>
          ))}
        </div>

        {/* Code preview */}
        <pre style={codeBlockStyle}>{content}</pre>

        {/* Actions */}
        <div style={actionRowStyle}>
          <button style={copied ? { ...copyBtnStyle, background: '#10b981' } : copyBtnStyle} onClick={handleCopy} type="button">
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button style={downloaded ? { ...downloadBtnStyle, background: '#10b981', color: '#fff', borderColor: '#10b981' } : downloadBtnStyle} onClick={handleDownload} type="button">
            {downloaded ? '✓ Downloaded' : '⬇ Download'}
          </button>
        </div>
      </div>
    </div>
  );
}
