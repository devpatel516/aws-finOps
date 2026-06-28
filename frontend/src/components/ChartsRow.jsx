import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart2, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#f43f5e', '#f59e0b', '#3b82f6', '#a855f7', '#22d3ee', '#10b981'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      {label && <div className="label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="value" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name?.includes('$')
            ? `$${p.value.toFixed(2)}`
            : p.value}
        </div>
      ))}
    </div>
  );
}

export default function ChartsRow({ resources }) {
  // Group by type for bar chart
  const byType = resources.reduce((acc, r) => {
    acc[r.resourceType] = (acc[r.resourceType] || 0) + r.monthlyCost;
    return acc;
  }, {});

  const barData = Object.entries(byType)
    .map(([type, cost]) => ({ type: type.replace('AWS::', '').slice(0, 14), cost: parseFloat(cost.toFixed(2)) }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8);

  // Pie data by region
  const byRegion = resources.reduce((acc, r) => {
    acc[r.region] = (acc[r.region] || 0) + r.monthlyCost;
    return acc;
  }, {});

  const pieData = Object.entries(byRegion)
    .map(([region, cost]) => ({ name: region, value: parseFloat(cost.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  const noData = resources.length === 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Bar Chart */}
      <div className="card fade-in" style={{ animationDelay: '100ms' }}>
        <div className="card-header">
          <div className="card-title">
            <div className="card-title-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--blue)' }}>
              <BarChart2 size={14} />
            </div>
            Waste by Resource Type
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Monthly cost (USD)</span>
        </div>
        <div className="card-body">
          {noData ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-text">No data to display</div>
            </div>
          ) : (
            <div className="chart-container" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,152,255,0.08)" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,152,255,0.05)' }} />
                  <Bar dataKey="cost" name="$Cost" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Pie Chart */}
      <div className="card fade-in" style={{ animationDelay: '200ms' }}>
        <div className="card-header">
          <div className="card-title">
            <div className="card-title-icon" style={{ background: 'rgba(168,85,247,0.12)', color: 'var(--purple)' }}>
              <PieIcon size={14} />
            </div>
            Distribution by Region
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Cost allocation</span>
        </div>
        <div className="card-body">
          {noData || pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-text">No data to display</div>
            </div>
          ) : (
            <div className="chart-container" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(v) => <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{v}</span>}
                    iconSize={8}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
