import api from './api';

export const supplierService = {
  getSuppliers: async (activeOnly = false) => {
    const response = await api.get(`/suppliers?activeOnly=${activeOnly}`);
    return response.data;
  },

  getSupplierById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (supplierData) => {
    const response = await api.post('/suppliers', supplierData);
    return response.data;
  },

  updateSupplier: async (id, supplierData) => {
    const response = await api.put(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  deactivateSupplier: async (id) => {
    await api.delete(`/suppliers/${id}`);
  },
};
