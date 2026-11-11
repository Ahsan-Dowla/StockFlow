import api from './api';

export const customerService = {
  getCustomers: async ({ page = 0, size = 10, allActive = false } = {}) => {
    if (allActive) {
      const response = await api.get('/customers?allActive=true');
      return response.data;
    }
    const response = await api.get(`/customers?page=${page}&size=${size}`);
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  searchCustomers: async (query, { page = 0, size = 10 } = {}) => {
    const response = await api.get(`/customers/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
    return response.data;
  },

  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },

  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  },

  deactivateCustomer: async (id) => {
    await api.delete(`/customers/${id}`);
  },
};
