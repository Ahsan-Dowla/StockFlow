import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorMap = {
    blue: { bg: 'var(--primary-light)', text: 'var(--primary)' },
    indigo: { bg: 'var(--indigo-light)', text: 'var(--indigo)' },
    green: { bg: 'var(--success-light)', text: 'var(--success)' },
    amber: { bg: 'var(--warning-light)', text: 'var(--warning)' },
    red: { bg: 'var(--danger-light)', text: 'var(--danger)' },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="stat-card">
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</div>}
      </div>
      {Icon && (
        <div className="stat-icon" style={{ backgroundColor: scheme.bg, color: scheme.text }}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
