import React, { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/customerService';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit2, Trash2, CheckCircle, AlertTriangle, Mail, Phone } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, customerId: null, customerName: '' });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      if (search.trim()) {
        data = await customerService.searchCustomers(search.trim(), { page, size: 10 });
      } else {
        data = await customerService.getCustomers({ page, size: 10 });
      }
      setCustomers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError('Failed to fetch customers.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setIsEditing(true);
    setEditingId(c.id);
    setFormData({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await customerService.updateCustomer(editingId, formData);
        setSuccess('Customer updated successfully.');
      } else {
        await customerService.createCustomer(formData);
        setSuccess('Customer created successfully.');
      }
      setIsModalOpen(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save customer.');
    }
  };

  const handleConfirmDeactivate = async () => {
    try {
      await customerService.deactivateCustomer(confirmDialog.customerId);
      setSuccess(`Customer "${confirmDialog.customerName}" deactivated successfully.`);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate customer.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <SearchBar
          value={search}
          onChange={(val) => { setSearch(val); setPage(0); }}
          placeholder="Search by customer name, email, or phone..."
        />
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} /> Add Customer
        </button>
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
          <LoadingSpinner message="Fetching customers..." />
        ) : customers.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    {c.email ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={14} color="var(--text-muted)" /> {c.email}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {c.phone ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={14} color="var(--text-muted)" /> {c.phone}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{c.address || <span style={{ color: 'var(--text-light)' }}>No address</span>}</td>
                  <td>
                    <StatusBadge status={c.active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEditModal(c)}
                        title="Edit Customer"
                      >
                        <Edit2 size={14} />
                      </button>
                      {c.active && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmDialog({ isOpen: true, customerId: c.id, customerName: c.name })}
                          title="Deactivate Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No customer accounts found.
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name / Company *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sterling Industries"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="purchasing@company.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0144"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Billing / Shipping Address</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address details..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, customerId: null, customerName: '' })}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate "${confirmDialog.customerName}"? Existing sales orders placed by this customer will remain intact in the system.`}
        confirmText="Deactivate"
      />
    </div>
  );
};

export default Customers;
