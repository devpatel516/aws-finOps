import React from 'react';
import { RefreshCw, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, subtitle, onScan, scanning }) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>

      <div className="topbar-actions">
        {/* Clock */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', lineHeight: 1.4 }}>
          <div style={{ fontFamily: 'var(--font-mono)' }}>{timeStr}</div>
          <div>{dateStr}</div>
        </div>

        {/* Force scan */}
        <button
          id="force-scan-btn"
          className={`btn btn-ghost ${scanning ? 'btn-loading' : ''}`}
          onClick={onScan}
          disabled={scanning}
          title="Trigger global infrastructure scan"
        >
          <RefreshCw size={13} style={scanning ? { animation: 'spin 1s linear infinite' } : {}} />
          {scanning ? 'Scanning...' : 'Force Scan'}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        {/* User menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--cyan), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>
            {initials}
          </div>

          {/* Name + role */}
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: user?.role === 'admin' ? 'var(--cyan)' : 'var(--purple)',
                background: user?.role === 'admin' ? 'var(--cyan-dim)' : 'var(--purple-dim)',
                padding: '1px 5px', borderRadius: 4,
              }}>
                {user?.role || 'viewer'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            id="logout-btn"
            className="btn btn-ghost btn-sm"
            onClick={logout}
            title="Sign out"
            style={{ padding: '6px 8px' }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}
