import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
  let badgeClass = 'badge-info';
  const val = String(status).toUpperCase();

  if (val === 'CONFIRMED' || val === 'ACTIVE' || val === 'ADMIN' || val === 'STOCK_IN') {
    badgeClass = 'badge-success';
  } else if (val === 'PENDING' || val === 'MANAGER' || val === 'ADJUSTMENT') {
    badgeClass = 'badge-warning';
  } else if (val === 'CANCELLED' || val === 'INACTIVE' || val === 'LOW_STOCK' || val === 'STOCK_OUT') {
    badgeClass = 'badge-danger';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {val}
    </span>
  );
};

export default StatusBadge;
