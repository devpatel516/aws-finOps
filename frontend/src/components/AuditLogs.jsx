import React, { useState } from 'react';
import { Activity, Search, Download, CheckCircle, Trash2, Shield, AlertTriangle, FileText } from 'lucide-react';

const ACTION_CONFIG = {
  DELETED:            { cls: 'DELETED',            icon: CheckCircle },
  MARKED_FOR_DELETION:{ cls: 'MARKED_FOR_DELETION', icon: Trash2 },
  EXEMPTED:           { cls: 'EXEMPTED',            icon: Shield },
  SCANNED:            { cls: 'SCANNED',             icon: Search },
  DETECTED:           { cls: 'DETECTED',            icon: AlertTriangle },
};

function formatTimeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function AuditLogs({ logs, compact = false }) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  let filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return (
      l.resourceId?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.resourceType?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
    );
  });

  if (filterAction !== 'all') {
    filtered = filtered.filter(l => l.action === filterAction);
  }

  const displayLogs = compact ? filtered.slice(0, 8) : filtered;

  return (
    <div className="card fade-in" style={{ animationDelay: '150ms' }}>
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-icon" style={{ background: 'rgba(168,85,247,0.12)', color: 'var(--purple)' }}>
            <Activity size={14} />
          </div>
          Compliance Audit Log
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{logs.length} events</span>
      </div>

      {!compact && (
        <div style={{ padding: '12px 24px', display: 'flex', gap: 10, borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 30, height: 34 }}
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ height: 34, fontSize: 11 }}
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="DETECTED">Detected</option>
            <option value="MARKED_FOR_DELETION">Staged</option>
            <option value="DELETED">Deleted</option>
            <option value="EXEMPTED">Exempted</option>
            <option value="SCANNED">Scanned</option>
          </select>
        </div>
      )}

      <div className="card-body" style={{ maxHeight: compact ? 300 : 480, overflowY: 'auto' }}>
        {displayLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="empty-state-text">No audit events found</div>
            <div className="empty-state-sub">Logs will appear after the first scan</div>
          </div>
        ) : (
          displayLogs.map((log, idx) => {
            const cfg = ACTION_CONFIG[log.action] || { cls: 'SCANNED', icon: Search };
            const LogIcon = cfg.icon;
            return (
              <div key={log._id || idx} className="log-entry fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className={`log-action ${cfg.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <LogIcon size={10} /> {log.action?.replace('_', ' ')}
                    </span>
                    <span className="log-resource" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                      {log.resourceId}
                    </span>
                    {log.resourceType && (
                      <span className="badge badge-type" style={{ fontSize: 9 }}>
                        {log.resourceType?.replace('AWS::', '')}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <div className="log-detail">{log.details}</div>
                  )}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div className="log-time">{formatTimeAgo(log.timestamp)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {log.savingsRealized > 0 && (
                    <div className="log-savings">+${log.savingsRealized} saved</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
