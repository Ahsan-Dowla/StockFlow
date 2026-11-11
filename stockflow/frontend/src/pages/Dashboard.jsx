import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  Package,
  Users,
  Truck,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Boxes,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [sumRes, revRes, catRes, topRes, ordRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRevenue(),
          dashboardService.getCategoryDistribution(),
          dashboardService.getTopProducts(),
          dashboardService.getRecentOrders(),
        ]);

        setSummary(sumRes);
        setRevenueData(revRes.map(r => ({
          month: r.month,
          revenue: parseFloat(r.revenue) || 0
        })));
        setCategoryData(catRes.map(c => ({
          name: c.categoryName,
          value: parseInt(c.stockQuantity, 10) || 0
        })));
        setTopProducts(topRes);
        setRecentOrders(ordRes);
      } catch (err) {
        setError('Failed to load dashboard data from backend server.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading live business metrics..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <AlertTriangle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div>
      {/* KPI Stat Cards */}
      <div className="stat-grid">
        <StatCard
          title="Confirmed Revenue"
          value={`$${summary?.totalConfirmedRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={summary?.totalOrders || 0}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Total Inventory Units"
          value={summary?.totalInventoryUnits?.toLocaleString() || 0}
          icon={Boxes}
          color="indigo"
        />
        <StatCard
          title="Low Stock Alert"
          value={summary?.lowStockCount || 0}
          icon={AlertTriangle}
          color={summary?.lowStockCount > 0 ? 'red' : 'green'}
          subtitle={summary?.lowStockCount > 0 ? 'Action required' : 'Stock levels optimal'}
        />
        <StatCard
          title="Active Products"
          value={summary?.totalProducts || 0}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Active Customers"
          value={summary?.totalCustomers || 0}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Suppliers"
          value={summary?.totalSuppliers || 0}
          icon={Truck}
          color="blue"
        />
      </div>

      {/* Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Monthly Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--primary)" />
              <h2 className="card-title">Confirmed Sales Revenue</h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical trends</span>
          </div>
          {revenueData.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No confirmed revenue recorded yet.
            </div>
          )}
        </div>

        {/* Category Inventory Distribution */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieIcon size={20} color="var(--indigo)" />
              <h2 className="card-title">Stock Units by Category</h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inventory breakdown</span>
          </div>
          {categoryData.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} units`, 'Stock']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No inventory assigned to categories yet.
            </div>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Orders</h2>
          </div>
          {recentOrders.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>${parseFloat(order.totalAmount).toFixed(2)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No recent orders found.
            </div>
          )}
        </div>

        {/* Top-Selling Products */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Selling Products</h2>
          </div>
          {topProducts.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty Sold</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td style={{ fontWeight: 600 }}>{p.productName}</td>
                      <td><code>{p.sku}</code></td>
                      <td>{p.totalQuantitySold}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                        ${parseFloat(p.totalRevenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No confirmed product sales recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
