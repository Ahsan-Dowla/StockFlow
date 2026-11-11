import api from './api';

export const categoryService = {
  getCategories: async (activeOnly = false) => {
    const response = await api.get(`/categories?activeOnly=${activeOnly}`);
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  deactivateCategory: async (id) => {
    await api.delete(`/categories/${id}`);
  },
};
