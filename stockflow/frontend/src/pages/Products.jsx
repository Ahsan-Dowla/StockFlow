import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { supplierService } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Package } from 'lucide-react';

const Products = () => {
  const { isManager } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    unitPrice: '',
    currentStock: 0,
    reorderLevel: 10,
    categoryId: '',
    supplierId: '',
  });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, productId: null, productName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDropdownData = async () => {
    try {
      const [cats, supps] = await Promise.all([
        categoryService.getCategories(true),
        supplierService.getSuppliers(true),
      ]);
      setCategories(cats);
      setSuppliers(supps);
    } catch {
      // Ignore dropdown failure
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts({
        page,
        size: 10,
        search,
        categoryId: selectedCategory,
        supplierId: selectedSupplier,
        active: activeFilter,
      });
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError('Failed to fetch product list.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedSupplier, activeFilter]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      unitPrice: '',
      currentStock: 0,
      reorderLevel: 10,
      categoryId: categories[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      unitPrice: product.unitPrice,
      currentStock: product.currentStock,
      reorderLevel: product.reorderLevel,
      categoryId: product.categoryId || '',
      supplierId: product.supplierId || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await productService.updateProduct(editingId, {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          description: formData.description,
          unitPrice: parseFloat(formData.unitPrice),
          reorderLevel: parseInt(formData.reorderLevel, 10),
          categoryId: formData.categoryId,
          supplierId: formData.supplierId ? formData.supplierId : null,
        });
        setSuccess('Product updated successfully.');
      } else {
        await productService.createProduct({
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          description: formData.description,
          unitPrice: parseFloat(formData.unitPrice),
          currentStock: parseInt(formData.currentStock, 10) || 0,
          reorderLevel: parseInt(formData.reorderLevel, 10) || 10,
          categoryId: formData.categoryId,
          supplierId: formData.supplierId ? formData.supplierId : null,
        });
        setSuccess('Product created successfully.');
      }
      setIsModalOpen(false);
      fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save product.');
    }
  };

  const handleConfirmDeactivate = async () => {
    try {
      await productService.deactivateProduct(confirmDialog.productId);
      setSuccess(`Product "${confirmDialog.productName}" deactivated successfully.`);
      fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate product.');
    }
  };

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBar
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
            placeholder="Search products by name or SKU..."
          />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedSupplier}
            onChange={(e) => { setSelectedSupplier(e.target.value); setPage(0); }}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {isManager && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} /> Add Product
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

      {/* Product Table */}
      <div className="table-container">
        {loading ? (
          <LoadingSpinner message="Fetching products..." />
        ) : products.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Price</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Status</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description}</div>
                    )}
                  </td>
                  <td><code>{p.sku}</code></td>
                  <td>{p.categoryName || '—'}</td>
                  <td>{p.supplierName || '—'}</td>
                  <td style={{ fontWeight: 600 }}>${parseFloat(p.unitPrice).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{p.currentStock}</span>
                      {p.lowStock && p.active && (
                        <span className="badge badge-danger" title="Current stock at or below reorder level">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{p.reorderLevel}</td>
                  <td>
                    <StatusBadge status={p.active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  {isManager && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(p)}
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                        {p.active && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmDialog({ isOpen: true, productId: p.id, productName: p.name })}
                            title="Deactivate Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No products match the selected criteria.
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={10}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input
                type="text"
                className="form-input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. ELEC-001"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                {isEditing ? 'Current Stock (Managed via Inventory)' : 'Initial Stock *'}
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                disabled={isEditing}
                style={isEditing ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              />
              {isEditing && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Use Inventory Adjustments to alter stock.
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Reorder Level *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select
                className="form-select"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product technical specs or notes..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, productId: null, productName: '' })}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate "${confirmDialog.productName}"? It will no longer appear in new sales orders, but historical order and inventory audit records will be preserved.`}
        confirmText="Deactivate"
      />
    </div>
  );
};

export default Products;
