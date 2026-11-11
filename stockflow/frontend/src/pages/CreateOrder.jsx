import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Trash2, ArrowLeft, CheckCircle, AlertTriangle, ShoppingCart } from 'lucide-react';

const CreateOrder = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderLines, setOrderLines] = useState([
    { productId: '', quantity: 1, unitPrice: 0, currentStock: 0, subtotal: 0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        setLoading(true);
        const [custRes, prodRes] = await Promise.all([
          customerService.getCustomers({ allActive: true }),
          productService.getProducts({ size: 100, active: 'true' }),
        ]);
        setCustomers(custRes);
        setProducts(prodRes.content);
        if (custRes.length > 0) {
          setSelectedCustomerId(custRes[0].id);
        }
      } catch {
        setError('Failed to load customers or active products.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrerequisites();
  }, []);

  const handleProductChange = (index, productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    const newLines = [...orderLines];
    if (product) {
      newLines[index] = {
        ...newLines[index],
        productId: product.id,
        unitPrice: parseFloat(product.unitPrice) || 0,
        currentStock: product.currentStock,
        subtotal: (parseFloat(product.unitPrice) || 0) * newLines[index].quantity,
      };
    } else {
      newLines[index] = {
        ...newLines[index],
        productId: '',
        unitPrice: 0,
        currentStock: 0,
        subtotal: 0,
      };
    }
    setOrderLines(newLines);
  };

  const handleQuantityChange = (index, quantity) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const newLines = [...orderLines];
    newLines[index] = {
      ...newLines[index],
      quantity: qty,
      subtotal: newLines[index].unitPrice * qty,
    };
    setOrderLines(newLines);
  };

  const handleAddLine = () => {
    setOrderLines([
      ...orderLines,
      { productId: '', quantity: 1, unitPrice: 0, currentStock: 0, subtotal: 0 }
    ]);
  };

  const handleRemoveLine = (index) => {
    if (orderLines.length === 1) return;
    setOrderLines(orderLines.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return orderLines.reduce((acc, line) => acc + (line.subtotal || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer for this order.');
      return;
    }

    const invalidLines = orderLines.filter((line) => !line.productId);
    if (invalidLines.length > 0) {
      setError('Please select a valid product for every line item.');
      return;
    }

    const overStockLines = orderLines.filter((line) => line.quantity > line.currentStock);
    if (overStockLines.length > 0) {
      setError('One or more order lines exceed currently available inventory stock.');
      return;
    }

    setSubmitting(true);
    try {
      await orderService.createOrder({
        customerId: selectedCustomerId,
        items: orderLines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      });

      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit order.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading customer and product catalog..." />;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/orders" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>New Customer Sales Order</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Create an order with server-calculated price snapshots and real-time inventory validation.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Customer Selection Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Customer Details</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Active Customer *</label>
            {customers.length > 0 ? (
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>
                No active customers available. Please add a customer first.
              </div>
            )}
          </div>
        </div>

        {/* Line Items Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Order Line Items</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddLine}
            >
              <Plus size={16} /> Add Item Line
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product</th>
                  <th style={{ width: '15%' }}>Unit Price</th>
                  <th style={{ width: '15%' }}>Stock Avail</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th style={{ width: '10%' }}>Subtotal</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {orderLines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-select"
                        value={line.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        required
                      >
                        <option value="">Select a product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — ${parseFloat(p.unitPrice).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        ${line.unitPrice.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: line.quantity > line.currentStock ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {line.currentStock} units
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={line.currentStock || 1}
                        className="form-input"
                        style={{ width: '90px' }}
                        value={line.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        required
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${line.subtotal.toFixed(2)}
                    </td>
                    <td>
                      {orderLines.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveLine(idx)}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginRight: '1rem' }}>Estimated Total:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                ${calculateGrandTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Link to="/orders" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || customers.length === 0}
          >
            {submitting ? 'Creating Order...' : (
              <>
                <ShoppingCart size={18} /> Confirm & Place Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
