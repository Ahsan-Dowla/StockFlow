import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname.startsWith('/products')) return 'Product Inventory';
    if (pathname.startsWith('/categories')) return 'Categories';
    if (pathname.startsWith('/suppliers')) return 'Suppliers';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/inventory')) return 'Stock Movements & Ledger';
    if (pathname.startsWith('/orders/new')) return 'Create Sales Order';
    if (pathname.startsWith('/orders')) return 'Sales Orders';
    if (pathname.startsWith('/users')) return 'User Administration';
    return 'StockFlow';
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'ADMIN') return { backgroundColor: 'var(--danger-light)', color: 'var(--danger)' };
    if (role === 'MANAGER') return { backgroundColor: 'var(--warning-light)', color: 'var(--warning)' };
    return { backgroundColor: 'var(--primary-light)', color: 'var(--primary)' };
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <header className="top-navbar">
          <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
          <div className="user-profile">
            <div className="user-info">
              <div className="user-name">{user?.fullName || 'User'}</div>
              <span className="user-role-badge" style={getRoleBadgeStyle(user?.role)}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Logout"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
