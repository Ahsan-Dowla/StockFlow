import api from './api';

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getTopProducts: async () => {
    const response = await api.get('/dashboard/top-products');
    return response.data;
  },

  getRevenue: async () => {
    const response = await api.get('/dashboard/revenue');
    return response.data;
  },

  getCategoryDistribution: async () => {
    const response = await api.get('/dashboard/category-distribution');
    return response.data;
  },

  getRecentOrders: async () => {
    const response = await api.get('/dashboard/recent-orders');
    return response.data;
  },
};
