'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  message: string | null;
  onClose?: () => void;
  duration?: number;
}

const style: Record<string, React.CSSProperties> = {
  toast: {
    position: 'fixed',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#0F172A',
    color: '#fff',
    padding: '0.625rem 1.25rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: 500,
    zIndex: 9999,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -4px rgba(0,0,0,0.1)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    animation: 'toastIn 0.25s ease, toastOut 0.2s ease 1.5s forwards',
    pointerEvents: 'none' as const,
  },
};

export default function Toast({ message, onClose, duration = 1800 }: Props) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setText(message);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setText(null);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setText(null);
    }
  }, [message, duration, onClose]);

  if (!visible || !text) return null;

  return (
    <div style={style.toast} role="status" aria-live="polite">
      {text}
    </div>
  );
}
