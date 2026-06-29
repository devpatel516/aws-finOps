import React, { useState } from 'react';
import { Layers, Trash2, Shield, Search, Filter, ChevronDown, CheckCircle, Clock } from 'lucide-react';

const STATUS_LABELS = {
  detected: { label: 'Detected', cls: 'badge-detected' },
  marked_for_deletion: { label: 'Staged', cls: 'badge-staged' },
  exempt: { label: 'Exempt', cls: 'badge-exempt' },
};

export default function ResourceTable({ resources, onAction, loading }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('cost');
  const [confirmId, setConfirmId] = useState(null);

  let filtered = resources.filter(r => {
    const q = search.toLowerCase();
    return (
      r.resourceId?.toLowerCase().includes(q) ||
      r.resourceType?.toLowerCase().includes(q) ||
      r.region?.toLowerCase().includes(q) ||
      r.awsAccountId?.toLowerCase().includes(q)
    );
  });

  if (filterStatus !== 'all') {
    filtered = filtered.filter(r => r.status === filterStatus);
  }

  if (sortBy === 'cost') {
    filtered = [...filtered].sort((a, b) => b.monthlyCost - a.monthlyCost);
  } else if (sortBy === 'id') {
    filtered = [...filtered].sort((a, b) => a.resourceId?.localeCompare(b.resourceId));
  }

  const handleAction = (id, type) => {
    if (type === 'delete' && confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setConfirmId(null);
    onAction(id, type);
  };

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-icon" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)' }}>
            <Layers size={14} />
          </div>
          Active Waste Inventory
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filtered.length} of {resources.length} resources</span>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '12px 24px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 30, height: 34 }}
            placeholder="Search resources, regions, account IDs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter */}
        <div style={{ position: 'relative' }}>
          <select
            className="form-input"
            style={{ height: 34, paddingRight: 28, appearance: 'none', cursor: 'pointer', fontSize: 11 }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="detected">Detected</option>
            <option value="marked_for_deletion">Staged</option>
            <option value="exempt">Exempt</option>
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>

        {/* Sort */}
        <div style={{ position: 'relative' }}>
          <select
            className="form-input"
            style={{ height: 34, paddingRight: 28, appearance: 'none', cursor: 'pointer', fontSize: 11 }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="cost">Sort: Highest Cost</option>
            <option value="id">Sort: Resource ID</option>
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ margin: 24 }}>
            <div className="empty-state-icon">
              <CheckCircle size={28} style={{ color: 'var(--emerald)' }} />
            </div>
            <div className="empty-state-text">No resource waste detected</div>
            <div className="empty-state-sub">Run a scan to discover leaking AWS resources</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Resource ID</th>
                  <th>Type</th>
                  <th>Region</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Cost/mo</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const st = STATUS_LABELS[item.status] || STATUS_LABELS.detected;
                  const isConfirming = confirmId === item.resourceId;
                  return (
                    <tr key={item.resourceId} style={{ animationDelay: `${idx * 30}ms` }}>
                      <td>
                        <div className="td-mono">{item.resourceId}</div>
                      </td>
                      <td>
                        <span className="badge badge-type">
                          {item.resourceType?.replace('AWS::', '') || item.resourceType}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-region">{item.region}</span>
                      </td>
                      <td>
                        <div className="td-mono" style={{ fontSize: 10 }}>{item.awsAccountId}</div>
                      </td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="cost-value">${item.monthlyCost?.toFixed(2)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {item.status === 'marked_for_deletion' ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <span className="badge badge-staged" style={{ fontSize: 9, display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
                              <Clock size={10} /> Staged
                            </span>
                            {isConfirming ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleAction(item.resourceId, 'delete')}
                                >
                                  Confirm
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setConfirmId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleAction(item.resourceId, 'delete')}
                                title="Delete immediately on AWS"
                              >
                                <Trash2 size={11} /> Delete Now
                              </button>
                            )}
                          </div>
                        ) : item.status === 'exempt' ? (
                          <span className="badge badge-exempt" style={{ fontSize: 9, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Shield size={10} /> Whitelisted
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => onAction(item.resourceId, 'exempt')}
                              title="Exempt from automation"
                            >
                              <Shield size={11} /> Exempt
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => onAction(item.resourceId, 'stage')}
                              title="Stage for cleanup"
                            >
                              <Trash2 size={11} /> Stage
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
