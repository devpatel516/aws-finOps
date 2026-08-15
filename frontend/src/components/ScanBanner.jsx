import React from 'react';

export default function ScanBanner({ onDismiss }) {
  return (
    <div className="scan-progress fade-in" style={{ margin: '0 28px' }}>
      <div style={{
        width: 14, height: 14,
        border: '2px solid rgba(34,211,238,0.3)',
        borderTopColor: 'var(--cyan)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }} />
      <span>Global infrastructure scan in progress — data will refresh automatically...</span>
      <button
        onClick={onDismiss}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 12 }}
      >
        ✕
      </button>
    </div>
  );
}
