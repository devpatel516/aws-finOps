import React from 'react';
import { Cloud } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div style={{ position: 'relative' }}>
        <div className="loading-spinner" />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          <Cloud size={16} style={{ color: 'var(--primary)' }} />
        </div>
      </div>
      <div className="loading-text">Aggregating FinOps intelligence...</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scanning connected AWS accounts</div>
    </div>
  );
}
