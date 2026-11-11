import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit2, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

const Categories = () => {
  const { isManager } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, categoryName: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch {
      setError('Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await categoryService.updateCategory(editingId, { name: name.trim(), description });
        setSuccess('Category updated successfully.');
      } else {
        await categoryService.createCategory({ name: name.trim(), description });
        setSuccess('Category created successfully.');
      }
      setIsModalOpen(false);
      fetchCategories();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save category.');
    }
  };

  const handleConfirmDeactivate = async () => {
    try {
      await categoryService.deactivateCategory(confirmDialog.categoryId);
      setSuccess(`Category "${confirmDialog.categoryName}" deactivated successfully.`);
      fetchCategories();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate category.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Organize your product catalog into structured categories.
        </p>
        {isManager && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} /> Add Category
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

      <div className="table-container">
        {loading ? (
          <LoadingSpinner message="Fetching categories..." />
        ) : categories.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.description || <span style={{ color: 'var(--text-light)' }}>No description</span>}</td>
                  <td>
                    <StatusBadge status={c.active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  {isManager && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(c)}
                          title="Edit Category"
                        >
                          <Edit2 size={14} />
                        </button>
                        {c.active && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmDialog({ isOpen: true, categoryId: c.id, categoryName: c.name })}
                            title="Deactivate Category"
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
            No categories created yet.
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Storage Hardware"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, categoryId: null, categoryName: '' })}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Category"
        message={`Are you sure you want to deactivate "${confirmDialog.categoryName}"? Notice: Categories associated with existing products cannot be deactivated.`}
        confirmText="Deactivate"
      />
    </div>
  );
};

export default Categories;
