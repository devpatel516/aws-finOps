import React, { useState, useEffect, useCallback } from 'react';
import { fetchResources, fetchLogs, markForDeletion, exemptResource, onboardAccount, triggerManualScan, deleteResourceOnTheSpot, fetchAccounts, disconnectAccount } from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Lock } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import MetricsRow from '../components/MetricsRow';
import ResourceTable from '../components/ResourceTable';
import AuditLogs from '../components/AuditLogs';
import AccountForm from '../components/AccountForm';
import ChartsRow from '../components/ChartsRow';
import LoadingScreen from '../components/LoadingScreen';
import ScanBanner from '../components/ScanBanner';

const PAGE_META = {
  dashboard: {
    title: 'FinOps Dashboard',
    subtitle: 'Real-time cloud cost intelligence across all connected AWS accounts',
  },
  resources: {
    title: 'Waste Inventory',
    subtitle: 'Browse, filter and act on detected resource waste',
  },
  logs: {
    title: 'Audit Log',
    subtitle: 'Complete operational history and compliance trail',
  },
  accounts: {
    title: 'Connect Account',
    subtitle: 'Onboard a new AWS account for automated FinOps scanning',
  },
};

export default function Dashboard() {
  const { logout } = useAuth();
  const [resources, setResources] = useState([]);
  const [logs, setLogs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [activePage, setActivePage] = useState('dashboard');
  const [scanning, setScanning] = useState(false);
  const [showScanBanner, setShowScanBanner] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setDataError('');
      const [resourceData, logData, accountData] = await Promise.all([
        fetchResources(),
        fetchLogs(),
        fetchAccounts()
      ]);
      setResources(resourceData);
      setLogs(logData);
      setAccounts(accountData);
    } catch (err) {
      const msg = err.message || '';
      const isAuthError = msg.includes('No token') || msg.includes('Invalid token') || msg.includes('Session expired');
      if (isAuthError) {
        logout();
      } else {
        setDataError(msg || 'Could not reach backend. Is the server running?');
        console.error('Failed to load dashboard data:', err);
      }
    }
  }, [logout]);

  useEffect(() => {
    const init = async () => {
      await loadData();
      setLoading(false);
    };
    init();
  }, [loadData]);

  useEffect(() => {
    const id = setInterval(loadData, 60000);
    return () => clearInterval(id);
  }, [loadData]);

  const handleForceScan = async () => {
    if (scanning) return;
    setScanning(true);
    setShowScanBanner(true);
    try {
      await triggerManualScan();
      setTimeout(async () => {
        await loadData();
        setScanning(false);
        setTimeout(() => setShowScanBanner(false), 3000);
      }, 4000);
    } catch (err) {
      alert('Scan trigger failed: ' + err.message);
      setScanning(false);
      setShowScanBanner(false);
    }
  };

  const handleResourceAction = async (id, type) => {
    try {
      if (type === 'stage') await markForDeletion(id);
      if (type === 'delete') await deleteResourceOnTheSpot(id);
      if (type === 'exempt') await exemptResource(id);
      await loadData();
    } catch (err) {
      alert('Action failed: ' + err.message);
    }
  };

  const handleOnboard = async (formData) => {
    await onboardAccount(formData);
    await triggerManualScan();
    setTimeout(loadData, 3000);
  };

  const handleDisconnect = async () => {
    try {
      await disconnectAccount();
      await loadData();
    } catch (err) {
      alert('Failed to disconnect account: ' + err.message);
    }
  };

  const meta = PAGE_META[activePage];
  const stagedCount = resources.filter(r => r.status === 'marked_for_deletion').length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="app-layout">
      <div className="bg-orbs" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        resourceCount={resources.length}
        stagedCount={stagedCount}
      />

      <div className="main-content">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onScan={handleForceScan}
          scanning={scanning}
          connectedAccount={accounts[0]}
        />

        {showScanBanner && (
          <div style={{ padding: '12px 28px 0' }}>
            <ScanBanner onDismiss={() => setShowScanBanner(false)} />
          </div>
        )}

        {dataError && (
          <div style={{ padding: '12px 28px 0' }}>
            <div className="alert alert-error" style={{ gap: 10 }}>
              <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <span>{dataError}</span>
              <button
                onClick={loadData}
                style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--red)', borderRadius: 6, color: 'var(--red)', cursor: 'pointer', fontSize: 11, padding: '2px 10px', fontFamily: 'var(--font-sans)' }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <main className="page-content">
          {activePage === 'dashboard' && (
            <>
              <MetricsRow resources={resources} />
              <ChartsRow resources={resources} />
              <div className="two-col-grid">
                <ResourceTable
                  resources={resources.slice(0, 10)}
                  onAction={handleResourceAction}
                />
                <AuditLogs logs={logs} compact />
              </div>
            </>
          )}

          {activePage === 'resources' && (
            <ResourceTable
              resources={resources}
              onAction={handleResourceAction}
            />
          )}

          {activePage === 'logs' && (
            <AuditLogs logs={logs} compact={false} />
          )}

          {activePage === 'accounts' && (
            <div style={{ maxWidth: 540 }}>
              <AccountForm 
                onSubmit={handleOnboard} 
                loading={actionLoading} 
                connectedAccount={accounts[0]} 
                onDisconnect={handleDisconnect} 
              />

              <div className="card fade-in" style={{ marginTop: 16, animationDelay: '200ms' }}>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={13} style={{ color: 'var(--primary)' }} /> Required IAM Permissions
                  </div>
                  {[
                    'ec2:DescribeInstances',
                    'ec2:DescribeVolumes',
                    'rds:DescribeDBInstances',
                    'elasticloadbalancing:DescribeLoadBalancers',
                    'ce:GetCostAndUsage',
                  ].map(perm => (
                    <div key={perm} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)',
                      padding: '3px 8px', background: 'var(--cyan-dim)', borderRadius: 5,
                      display: 'inline-block', margin: '2px 3px',
                    }}>
                      {perm}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
