import api from './api';

export const inventoryService = {
  adjustStock: async (adjustmentData) => {
    const response = await api.post('/inventory/adjustments', adjustmentData);
    return response.data;
  },

  getMovements: async ({ page = 0, size = 15, productId = '' } = {}) => {
    let url = `/inventory/movements?page=${page}&size=${size}`;
    if (productId) url += `&productId=${productId}`;
    const response = await api.get(url);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/inventory/summary');
    return response.data;
  },
};
