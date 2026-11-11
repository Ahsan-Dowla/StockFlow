import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { ShieldCheck, UserCheck, UserX, Edit2, CheckCircle, AlertTriangle } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('EMPLOYEE');

  // Toggle Status Confirm
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    targetStatus: false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch {
      setError('Failed to fetch user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenRoleModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setError('');
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await userService.updateUserRole(selectedUser.id, newRole);
      setSuccess(`Updated role for ${selectedUser.fullName} to ${newRole}.`);
      setIsRoleModalOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update user role.');
    }
  };

  const handleConfirmStatusToggle = async () => {
    try {
      await userService.updateUserStatus(confirmDialog.userId, confirmDialog.targetStatus);
      setSuccess(`Account for ${confirmDialog.userName} has been ${confirmDialog.targetStatus ? 'enabled' : 'disabled'}.`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update user status.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage user accounts, assign system roles, and control application access.
        </p>
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
          <LoadingSpinner message="Fetching user accounts..." />
        ) : users.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                      {isSelf && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          (Current User)
                        </span>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <StatusBadge status={u.role} />
                    </td>
                    <td>
                      <span className={`badge ${u.enabled ? 'badge-success' : 'badge-danger'}`}>
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenRoleModal(u)}
                          title="Change Role"
                        >
                          <Edit2 size={14} /> Change Role
                        </button>
                        <button
                          className={`btn ${u.enabled ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            userId: u.id,
                            userName: u.fullName,
                            targetStatus: !u.enabled,
                          })}
                          disabled={isSelf}
                          title={u.enabled ? 'Disable Account' : 'Enable Account'}
                        >
                          {u.enabled ? (
                            <>
                              <UserX size={14} /> Disable
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} /> Enable
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No users registered in the system.
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={`Change Role: ${selectedUser?.fullName || ''}`}
        maxWidth="440px"
      >
        <form onSubmit={handleSaveRole}>
          {error && (
            <div className="alert alert-danger">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">System Role *</label>
            <select
              className="form-select"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              required
            >
              <option value="EMPLOYEE">EMPLOYEE (View inventory, create sales orders)</option>
              <option value="MANAGER">MANAGER (Manage inventory, products, orders)</option>
              <option value="ADMIN">ADMIN (Full system administration & user access)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, userId: null, userName: '', targetStatus: false })}
        onConfirm={handleConfirmStatusToggle}
        title={confirmDialog.targetStatus ? 'Enable User Account' : 'Disable User Account'}
        message={`Are you sure you want to ${confirmDialog.targetStatus ? 'enable' : 'disable'} account access for "${confirmDialog.userName}"?`}
        confirmText={confirmDialog.targetStatus ? 'Enable Account' : 'Disable Account'}
        isDanger={!confirmDialog.targetStatus}
      />
    </div>
  );
};

export default Users;
