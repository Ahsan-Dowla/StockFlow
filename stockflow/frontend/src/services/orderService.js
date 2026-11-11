import api from './api';

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getOrders: async ({ page = 0, size = 10, orderNumber = '', status = '', customerId = '' } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (orderNumber) params.append('orderNumber', orderNumber);
    if (status) params.append('status', status);
    if (customerId) params.append('customerId', customerId);

    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },
};
