import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Truck,
  Users,
  ArrowLeftRight,
  ShoppingCart,
  ShieldCheck,
  Boxes
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/categories', label: 'Categories', icon: FolderTree },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/inventory', label: 'Inventory', icon: ArrowLeftRight },
    { to: '/orders', label: 'Orders', icon: ShoppingCart },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <Boxes size={20} />
        </div>
        <span className="brand-title">StockFlow</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {isAdmin && (
          <>
            <div style={{ padding: '0.75rem 0.75rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
              Administration
            </div>
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <ShieldCheck size={18} />
              <span>User Management</span>
            </NavLink>
          </>
        )}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', fontSize: '0.75rem', color: '#64748b' }}>
        StockFlow v1.0.0
      </div>
    </aside>
  );
};

export default Sidebar;
