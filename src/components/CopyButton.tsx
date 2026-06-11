'use client';

import React, { useCallback, useState } from 'react';
import { copyToClipboard } from '../utils/color';
import Toast from './Toast';

interface Props {
  text: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export default function CopyButton({ text, label = 'Copy', className, style, children }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(text);
    setToast(label === 'Copy' ? 'Copied!' : `${label} copied`);
  }, [text, label]);

  return (
    <>
      <button
        className={className || 'copy-btn'}
        style={style}
        onClick={handleCopy}
        type="button"
        aria-label={`Copy ${label}`}
      >
        {children || (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
        {label !== 'Copy' && <span>{label}</span>}
      </button>
      <Toast message={toast} onClose={() => setToast(null)} />
    </>
  );
}
