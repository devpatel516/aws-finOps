import React, { useState } from 'react';
import { PlusCircle, Cloud, Key, Lock, Hash, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AccountForm({ onSubmit, loading, connectedAccount, onDisconnect }) {
  const [form, setForm] = useState({
    accountName: '',
    awsAccountId: '',
    accessKeyId: '',
    secretAccessKey: '',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onSubmit(form);
      setMsg({ type: 'success', text: 'Account onboarded! Background scan initiated.' });
      setForm({ accountName: '', awsAccountId: '', accessKeyId: '', secretAccessKey: '' });
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Onboarding failed. Please verify credentials.' });
    }
  };

  const isValid = form.accountName && form.awsAccountId.match(/^\d{12}$/) && form.accessKeyId.startsWith('AKIA') && form.secretAccessKey.length > 20;

  if (connectedAccount) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <div className="card-title">
            <div className="card-title-icon" style={{ background: 'var(--emerald-dim)', color: 'var(--emerald)' }}>
              <CheckCircle size={14} />
            </div>
            AWS Account Integration
          </div>
        </div>

        <div className="card-body">
          <div style={{
            padding: '16px 20px',
            background: 'rgba(29,129,2,0.06)',
            border: '1px solid rgba(29,129,2,0.15)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 20,
            lineHeight: 1.6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--emerald)', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              <Cloud size={15} /> AWS Connected Successfully
            </div>
            Your FinOps scanning engine is actively querying waste inventory metrics for this environment. Only one active AWS account connection is permitted per profile.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Account Name</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{connectedAccount.accountName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>AWS Account ID</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--blue)', fontSize: 12 }}>{connectedAccount.awsAccountId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Status</span>
              <span style={{
                textTransform: 'uppercase', fontSize: 10, fontWeight: 700,
                color: connectedAccount.status === 'active' ? 'var(--emerald)' : 'var(--amber)',
                background: connectedAccount.status === 'active' ? 'var(--emerald-dim)' : 'var(--amber-dim)',
                padding: '2px 6px', borderRadius: 4
              }}>{connectedAccount.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Connected Since</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                {new Date(connectedAccount.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
          </div>

          {msg && (
            <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }}>
              {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {msg.text}
            </div>
          )}

          <button
            type="button"
            className="btn btn-danger btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
            onClick={async () => {
              setMsg(null);
              if (confirm('Are you sure you want to disconnect and delete your connected AWS account? This will also purge its scanned resources.')) {
                try {
                  await onDisconnect();
                  setMsg({ type: 'success', text: 'AWS Account successfully disconnected.' });
                } catch (err) {
                  setMsg({ type: 'error', text: err.message || 'Disconnect failed.' });
                }
              }
            }}
          >
            {loading ? 'Disconnecting...' : 'Disconnect AWS Account'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-icon" style={{ background: 'var(--emerald-dim)', color: 'var(--emerald)' }}>
            <PlusCircle size={14} />
          </div>
          Connect AWS Account
        </div>
      </div>

      <div className="card-body">
        {/* Info banner */}
        <div style={{
          padding: '10px 14px',
          background: 'rgba(59,130,246,0.07)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 10,
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginBottom: 20,
          lineHeight: 1.6,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start'
        }}>
          <Cloud size={13} style={{ color: 'var(--blue)', marginTop: 1, flexShrink: 0 }} />
          <span>Provide read-only IAM credentials. CloudWaste only reads cost data — no destructive actions are performed automatically.</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Cloud size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Account Alias
            </label>
            <input
              className="form-input"
              placeholder="e.g., Production-US-East"
              value={form.accountName}
              onChange={set('accountName')}
              required
            />
            <div className="form-hint">A human-friendly name to identify this account</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Hash size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              AWS Account ID
            </label>
            <input
              className="form-input mono"
              placeholder="123456789012"
              value={form.awsAccountId}
              onChange={set('awsAccountId')}
              maxLength={12}
              required
            />
            {form.awsAccountId && !form.awsAccountId.match(/^\d{12}$/) && (
              <div className="form-hint" style={{ color: 'var(--red)' }}>Must be exactly 12 digits</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Key size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Access Key ID
            </label>
            <input
              className="form-input mono"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={form.accessKeyId}
              onChange={set('accessKeyId')}
              required
            />
            {form.accessKeyId && !form.accessKeyId.startsWith('AKIA') && (
              <div className="form-hint" style={{ color: 'var(--amber)' }}>Access keys typically start with AKIA</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Secret Access Key
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input mono"
                type={showSecret ? 'text' : 'password'}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                value={form.secretAccessKey}
                onChange={set('secretAccessKey')}
                style={{ paddingRight: 38 }}
                required
              />
              <button
                type="button"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowSecret(s => !s)}
                tabIndex={-1}
              >
                {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {msg && (
            <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }}>
              {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-emerald btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading || !isValid}
          >
            {loading ? (
              <>
                <PlusCircle size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Connecting...
              </>
            ) : (
              <>
                <PlusCircle size={14} />
                Onboard AWS Account
              </>
            )}
          </button>

          {!isValid && form.accountName && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              Complete all fields with valid values to enable submit
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
