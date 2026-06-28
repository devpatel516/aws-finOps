import React from 'react';
import { DollarSign, Trash2, Layers, TrendingDown } from 'lucide-react';

function MetricCard({ icon: Icon, iconClass, label, value, unit, change, changeDir, barPercent, barClass, delay = 0 }) {
  return (
    <div className={`metric-card ${iconClass} fade-in`} style={{ animationDelay: `${delay}ms` }}>
      <div className={`metric-icon ${iconClass}`}>
        <Icon size={18} />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value}
        {unit && <span className="metric-unit"> {unit}</span>}
      </div>
      {change !== undefined && (
        <div className={`metric-change ${changeDir}`}>
          <TrendingDown size={11} style={{ transform: changeDir === 'up' ? 'scaleY(-1)' : 'none' }} />
          {change}
        </div>
      )}
      {barPercent !== undefined && (
        <div className="progress-bar">
          <div
            className={`progress-fill ${barClass}`}
            style={{ width: `${Math.min(barPercent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function MetricsRow({ resources }) {
  const totalWaste = resources.reduce((a, r) => a + r.monthlyCost, 0);
  const stagedCount = resources.filter(r => r.status === 'marked_for_deletion').length;
  const totalCount = resources.length;
  const avgCost = totalCount > 0 ? totalWaste / totalCount : 0;
  const stagedPct = totalCount > 0 ? (stagedCount / totalCount) * 100 : 0;

  return (
    <div className="metrics-grid">
      <MetricCard
        icon={DollarSign}
        iconClass="red"
        label="Monthly Waste Leakage"
        value={`$${totalWaste.toFixed(2)}`}
        unit=""
        change={`$${avgCost.toFixed(2)} avg / resource`}
        changeDir="up"
        barPercent={Math.min((totalWaste / 500) * 100, 100)}
        barClass="red"
        delay={0}
      />
      <MetricCard
        icon={Trash2}
        iconClass="amber"
        label="Staged for Deletion"
        value={stagedCount}
        unit="assets"
        change={`${stagedPct.toFixed(0)}% of inventory`}
        changeDir={stagedCount > 0 ? 'up' : 'down'}
        barPercent={stagedPct}
        barClass="amber"
        delay={80}
      />
      <MetricCard
        icon={Layers}
        iconClass="cyan"
        label="Detected Resources"
        value={totalCount}
        unit="leaking"
        barPercent={totalCount > 0 ? 60 : 0}
        barClass="cyan"
        delay={160}
      />
      <MetricCard
        icon={TrendingDown}
        iconClass="emerald"
        label="Potential Annual Savings"
        value={`$${(totalWaste * 12).toFixed(0)}`}
        unit="/ yr"
        change="If all waste resolved"
        changeDir="down"
        barPercent={70}
        barClass="emerald"
        delay={240}
      />
    </div>
  );
}
