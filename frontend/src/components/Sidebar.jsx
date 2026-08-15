import React from 'react';
import {
  LayoutDashboard, Layers, Activity, PlusCircle,
  Shield, Settings, ChevronRight, TrendingDown
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'OVERVIEW' },
  { id: 'resources', icon: Layers, label: 'Waste Inventory', section: 'OPERATIONS', badgeKey: 'resources' },
  { id: 'logs', icon: Activity, label: 'Audit Logs', section: 'OPERATIONS' },
  { id: 'accounts', icon: PlusCircle, label: 'Connect Account', section: 'CONFIGURATION' },
];

export default function Sidebar({ activePage, onNavigate, resourceCount, stagedCount }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <TrendingDown size={18} color="#fff" />
          </div>
          <span className="logo-text">CloudWaste</span>
        </div>
        <div className="logo-sub">FinOps Control Portal</div>
      </div>

      <nav className="sidebar-nav">
        {['OVERVIEW', 'OPERATIONS', 'CONFIGURATION'].map(section => {
          const items = navItems.filter(i => i.section === section);
          return (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {items.map(item => {
                const Icon = item.icon;
                const badge = item.badgeKey === 'resources' ? resourceCount : null;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    style={{ width: '100%', background: 'none', border: activePage === item.id ? undefined : '1px solid transparent' }}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                    {badge > 0 && (
                      <span className={`nav-badge ${stagedCount > 0 ? 'amber' : ''}`}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className="status-dot" />
          <div>
            <div className="status-text">Systems Operational</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 1 }}>Engine v2.1 · Active</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
