import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Eye, Ban, CheckCircle, AlertTriangle, FileText, ShoppingCart } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null, orderNumber: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders({
        page,
        size: 10,
        orderNumber: searchOrderNumber,
        status: selectedStatus,
      });
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError('Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  }, [page, searchOrderNumber, selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetailModal = async (orderId) => {
    try {
      const order = await orderService.getOrderById(orderId);
      setSelectedOrder(order);
      setIsDetailModalOpen(true);
    } catch {
      setError('Failed to fetch order details.');
    }
  };

  const handleConfirmCancel = async () => {
    try {
      await orderService.cancelOrder(confirmDialog.orderId);
      setSuccess(`Order ${confirmDialog.orderNumber} cancelled successfully. Inventory balances have been restored.`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === confirmDialog.orderId) {
        setIsDetailModalOpen(false);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to cancel order.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBar
            value={searchOrderNumber}
            onChange={(val) => { setSearchOrderNumber(val); setPage(0); }}
            placeholder="Search by order number (e.g. ORD-...)"
          />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        <Link to="/orders/new" className="btn btn-primary">
          <Plus size={18} /> Create New Order
        </Link>
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
          <LoadingSpinner message="Fetching sales orders..." />
        ) : orders.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Created By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>
                    <div>{o.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customerEmail}</div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    ${parseFloat(o.totalAmount).toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {o.createdByName || 'System'}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenDetailModal(o.id)}
                        title="View Order Details"
                      >
                        <Eye size={14} /> View
                      </button>
                      {o.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmDialog({ isOpen: true, orderId: o.id, orderNumber: o.orderNumber })}
                          title="Cancel Order"
                        >
                          <Ban size={14} /> Cancel
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
            No sales orders found matching your search.
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

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber || ''}`}
        maxWidth="680px"
      >
        {selectedOrder && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Customer</span>
                <strong>{selectedOrder.customerName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Order Date</span>
                <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Status</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Created By</span>
                <span>{selectedOrder.createdByName || 'System'}</span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Line Items</h4>
            <div className="table-container" style={{ marginBottom: '1rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Unit Price Snapshot</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.productName}</td>
                      <td><code>{item.productSku}</code></td>
                      <td>{item.quantity}</td>
                      <td>${parseFloat(item.unitPrice).toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>${parseFloat(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginRight: '1rem' }}>Order Total:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  ${parseFloat(selectedOrder.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              {selectedOrder.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmDialog({ isOpen: true, orderId: selectedOrder.id, orderNumber: selectedOrder.orderNumber })}
                >
                  <Ban size={14} /> Cancel Order & Restore Stock
                </button>
              ) : <div />}

              <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, orderId: null, orderNumber: '' })}
        onConfirm={handleConfirmCancel}
        title="Cancel Sales Order"
        message={`Are you sure you want to cancel order "${confirmDialog.orderNumber}"? All line item product quantities will be automatically restored to the current inventory balance.`}
        confirmText="Cancel Order"
      />
    </div>
  );
};

export default Orders;
