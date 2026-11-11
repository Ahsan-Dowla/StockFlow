import React, { useState, useEffect } from 'react';
import { supplierService } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit2, Trash2, CheckCircle, AlertTriangle, Mail, Phone, MapPin } from 'lucide-react';

const Suppliers = () => {
  const { isManager } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, supplierId: null, supplierName: '' });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch {
      setError('Failed to fetch suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setIsEditing(true);
    setEditingId(s.id);
    setFormData({
      name: s.name,
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await supplierService.updateSupplier(editingId, formData);
        setSuccess('Supplier updated successfully.');
      } else {
        await supplierService.createSupplier(formData);
        setSuccess('Supplier created successfully.');
      }
      setIsModalOpen(false);
      fetchSuppliers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save supplier.');
    }
  };

  const handleConfirmDeactivate = async () => {
    try {
      await supplierService.deactivateSupplier(confirmDialog.supplierId);
      setSuccess(`Supplier "${confirmDialog.supplierName}" deactivated successfully.`);
      fetchSuppliers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate supplier.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage your component and product suppliers and vendor relationships.
        </p>
        {isManager && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} /> Add Supplier
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
          <LoadingSpinner message="Fetching suppliers..." />
        ) : suppliers.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Contact Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>
                    {s.email ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={14} color="var(--text-muted)" /> {s.email}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {s.phone ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={14} color="var(--text-muted)" /> {s.phone}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {s.address ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={14} color="var(--text-muted)" /> {s.address}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <StatusBadge status={s.active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  {isManager && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(s)}
                          title="Edit Supplier"
                        >
                          <Edit2 size={14} />
                        </button>
                        {s.active && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmDialog({ isOpen: true, supplierId: s.id, supplierName: s.name })}
                            title="Deactivate Supplier"
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
            No suppliers found.
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Supplier' : 'Add New Supplier'}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Supplier Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Apex Industrial Components"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@supplier.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0199"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Address</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Warehouse address, street, city, country..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, supplierId: null, supplierName: '' })}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Supplier"
        message={`Are you sure you want to deactivate "${confirmDialog.supplierName}"? Historical products previously supplied will retain their supplier references.`}
        confirmText="Deactivate"
      />
    </div>
  );
};

export default Suppliers;
