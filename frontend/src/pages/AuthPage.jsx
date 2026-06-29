import React, { useState } from 'react';
import {
  CloudLightning, Eye, EyeOff, Mail, Lock, User,
  Hash, Key, Cloud, ChevronDown, ChevronUp,
  TrendingDown, Shield, Zap, BarChart2, CheckCircle, AlertCircle,
  Search, DollarSign, FileText
} from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

// ── Brand Panel ───────────────────────────────────────────────────────────────
function BrandPanel() {
  const features = [
    { icon: Search, text: 'Auto-detect idle EC2, unattached EBS & orphaned Elastic IPs' },
    { icon: DollarSign, text: 'Real-time monthly waste cost aggregation across all accounts' },
    { icon: Shield, text: 'Role-based access — Admin and Viewer permissions' },
    { icon: FileText, text: 'Full compliance audit log with savings tracking' },
    { icon: Zap, text: 'One-click staging and automated cleanup pipelines' },
  ];

  return (
    <div className="auth-brand">
      <div className="auth-brand-logo">
        <div className="auth-brand-icon">
          <CloudLightning size={22} color="#fff" />
        </div>
        <span className="auth-brand-name">CloudWaste AI</span>
      </div>

      <h1 className="auth-brand-tagline">
        Stop paying for<br /><span>unused AWS resources</span>
      </h1>

      <p className="auth-brand-sub">
        CloudWaste AI automatically discovers and helps you eliminate idle cloud
        resources across all your AWS accounts — saving thousands per month.
      </p>

      <div className="auth-features">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div className="auth-feature" key={i}>
              <div className="auth-feature-dot" style={{ background: 'rgba(236,114,17,0.08)', border: '1px solid rgba(236,114,17,0.15)' }}>
                <Icon size={12} style={{ color: 'var(--primary)' }} />
              </div>
              {f.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.login(form.email, form.password);
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-subtitle">Sign in to your CloudWaste AI account</p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 18 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">
          <Mail size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
          Email Address
        </label>
        <input
          id="login-email"
          className="form-input"
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <Lock size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="login-password"
            className="form-input"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            autoComplete="current-password"
            style={{ paddingRight: 40 }}
            required
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw(s => !s)}
            style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <button
        id="login-submit"
        type="submit"
        className="btn btn-primary btn-lg"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        disabled={loading}
      >
        {loading ? (
          <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
        ) : 'Sign In'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-sans)' }}
        >
          Create one →
        </button>
      </p>
    </form>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitchToLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    accountName: '', awsAccountId: '', accessKeyId: '', secretAccessKey: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showAWS, setShowAWS] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  // Validation helpers
  const pwMatch = form.password && form.confirmPassword && form.password !== form.confirmPassword;
  const pwStrong = form.password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (form.awsAccountId && !form.awsAccountId.match(/^\d{12}$/)) {
      return setError('AWS Account ID must be exactly 12 digits.');
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };

      // Include AWS credentials only if all three are provided
      if (form.awsAccountId && form.accessKeyId && form.secretAccessKey) {
        payload.accountName = form.accountName || `${form.name}'s AWS Account`;
        payload.awsAccountId = form.awsAccountId;
        payload.accessKeyId = form.accessKeyId;
        payload.secretAccessKey = form.secretAccessKey;
      }

      const data = await authAPI.register(payload);
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ overflowY: 'auto', maxHeight: '80vh', paddingRight: 4 }}>
      <h2 className="auth-title">Create your account</h2>
      <p className="auth-subtitle">Start eliminating AWS waste in minutes</p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 18 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Personal details */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            <User size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Full Name
          </label>
          <input
            id="reg-name"
            className="form-input"
            placeholder="Jane Smith"
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            <Mail size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Email
          </label>
          <input
            id="reg-email"
            className="form-input"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            <Lock size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="reg-password"
              className="form-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Min 8 chars"
              value={form.password}
              onChange={set('password')}
              style={{ paddingRight: 36 }}
              required
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(s => !s)}
              style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          {form.password && (
            <div className="form-hint" style={{ color: pwStrong ? 'var(--emerald)' : 'var(--amber)' }}>
              {pwStrong ? '✓ Strong enough' : '✗ Min 8 characters'}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">
            <Lock size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Confirm Password
          </label>
          <input
            id="reg-confirm-password"
            className="form-input"
            type="password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            style={{ borderColor: pwMatch ? 'var(--red)' : undefined }}
            required
          />
          {pwMatch && (
            <div className="form-hint" style={{ color: 'var(--red)' }}>✗ Passwords don't match</div>
          )}
        </div>
      </div>

      {/* AWS Credentials section — collapsible */}
      <div className="aws-credentials-section">
        <div
          className="aws-credentials-header"
          onClick={() => setShowAWS(s => !s)}
          role="button"
          aria-expanded={showAWS}
        >
          <Cloud size={14} />
          AWS Account Credentials
          <span className="aws-optional-badge">OPTIONAL</span>
          {showAWS ? <ChevronUp size={14} style={{ marginLeft: 4 }} /> : <ChevronDown size={14} style={{ marginLeft: 4 }} />}
        </div>

        {showAWS && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
              Connect your AWS account now to immediately start scanning for waste.
              You can also skip this and connect accounts later from the dashboard.
            </div>

            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Account Alias</label>
                <input
                  id="reg-account-name"
                  className="form-input"
                  placeholder="e.g., Production"
                  value={form.accountName}
                  onChange={set('accountName')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Hash size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  AWS Account ID
                </label>
                <input
                  id="reg-aws-account-id"
                  className="form-input mono"
                  placeholder="123456789012"
                  value={form.awsAccountId}
                  onChange={set('awsAccountId')}
                  maxLength={12}
                />
                {form.awsAccountId && !form.awsAccountId.match(/^\d{12}$/) && (
                  <div className="form-hint" style={{ color: 'var(--red)' }}>Must be 12 digits</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Key size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Access Key ID
              </label>
              <input
                id="reg-access-key"
                className="form-input mono"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={form.accessKeyId}
                onChange={set('accessKeyId')}
              />
              {form.accessKeyId && !form.accessKeyId.startsWith('AKIA') && (
                <div className="form-hint" style={{ color: 'var(--amber)' }}>Access keys start with AKIA</div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Lock size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Secret Access Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-secret-key"
                  className="form-input mono"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="wJalrXUtnFEMI/K7MDENG..."
                  value={form.secretAccessKey}
                  onChange={set('secretAccessKey')}
                  style={{ paddingRight: 40 }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowSecret(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <button
        id="register-submit"
        type="submit"
        className="btn btn-emerald btn-lg"
        style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
        disabled={loading || !!pwMatch}
      >
        {loading ? (
          <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating account...</>
        ) : 'Create Account & Get Started'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-sans)' }}
        >
          Sign in →
        </button>
      </p>
    </form>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState('login');

  return (
    <div className="auth-page">
      <BrandPanel />

      <div className="auth-form-panel">
        <div className="auth-form-card fade-in">
          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
              id="tab-login"
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => setTab('register')}
              id="tab-register"
            >
              Create Account
            </button>
          </div>

          {tab === 'login' ? (
            <LoginForm onSwitchToRegister={() => setTab('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setTab('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
