import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Clock
} from 'lucide-react';

const Inventory = () => {
  const { isManager } = useAuth();

  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedProductFilter, setSelectedProductFilter] = useState('');

  // Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    movementType: 'STOCK_IN',
    quantity: 1,
    notes: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSummaryAndProducts = async () => {
    try {
      const [sum, prodPage] = await Promise.all([
        inventoryService.getSummary(),
        productService.getProducts({ size: 100, active: 'true' }),
      ]);
      setSummary(sum);
      setProducts(prodPage.content);
    } catch {
      // Ignore
    }
  };

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getMovements({
        page,
        size: 15,
        productId: selectedProductFilter,
      });
      setMovements(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError('Failed to fetch stock movements ledger.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedProductFilter]);

  useEffect(() => {
    fetchSummaryAndProducts();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleOpenAdjustmentModal = () => {
    setFormData({
      productId: products[0]?.id || '',
      movementType: 'STOCK_IN',
      quantity: 1,
      notes: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.notes.trim()) {
      setError('A reason or audit note is strictly required for inventory adjustments.');
      return;
    }

    try {
      await inventoryService.adjustStock({
        productId: formData.productId,
        movementType: formData.movementType,
        quantity: parseInt(formData.quantity, 10),
        notes: formData.notes.trim(),
      });
      setSuccess('Inventory adjustment processed successfully.');
      setIsModalOpen(false);
      fetchSummaryAndProducts();
      fetchMovements();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to process inventory adjustment.');
    }
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Real-time inventory ledger and auditable stock movement history.
        </p>
        {isManager && (
          <button className="btn btn-primary" onClick={handleOpenAdjustmentModal}>
            <PlusCircle size={18} /> Adjust Inventory
          </button>
        )}
      </div>

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-title">Total Products</div>
            <div className="stat-value">{summary?.totalProducts || 0}</div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Boxes size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Total Stock Units</div>
            <div className="stat-value">{summary?.totalInventoryUnits?.toLocaleString() || 0}</div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--indigo-light)', color: 'var(--indigo)' }}>
            <ArrowLeftRight size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Low Stock Alert Count</div>
            <div className="stat-value">{summary?.lowStockCount || 0}</div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: summary?.lowStockCount > 0 ? 'var(--danger-light)' : 'var(--success-light)', color: summary?.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Movements Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="var(--primary)" />
            <h2 className="card-title">Movement Audit Log</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Filter by product:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={selectedProductFilter}
              onChange={(e) => { setSelectedProductFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <LoadingSpinner message="Loading movement history..." />
          ) : movements.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Quantity Change</th>
                  <th>Reference</th>
                  <th>Reason / Notes</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.productName}</td>
                      <td><code>{m.productSku}</code></td>
                      <td>
                        <StatusBadge status={m.movementType} />
                      </td>
                      <td style={{ fontWeight: 700, color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {m.referenceType ? (
                          <span style={{ color: 'var(--text-muted)' }}>
                            {m.referenceType} {m.referenceId ? `#${m.referenceId}` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ maxWidth: '240px', fontSize: '0.8125rem' }}>
                        {m.notes || <span style={{ color: 'var(--text-light)' }}>No notes</span>}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {m.performedByName || 'System'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No inventory movements recorded yet.
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={15}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Inventory Adjustment"
      >
        <form onSubmit={handleSubmitAdjustment}>
          {error && (
            <div className="alert alert-danger">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              className="form-select"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">Select Product to Adjust</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Type *</label>
              <select
                className="form-select"
                value={formData.movementType}
                onChange={(e) => setFormData({ ...formData, movementType: e.target.value })}
                required
              >
                <option value="STOCK_IN">Stock In (Add)</option>
                <option value="STOCK_OUT">Stock Out (Deduct)</option>
                <option value="ADJUSTMENT">Manual Adjustment</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Units Quantity *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Audit Reason / Note *</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Explain why this adjustment is taking place (e.g. physical inventory recount, damaged stock write-off)..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
