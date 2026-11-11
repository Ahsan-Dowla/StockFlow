import api from './api';

export const productService = {
  getProducts: async ({ page = 0, size = 10, search = '', categoryId = '', supplierId = '', active = '' } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);
    if (supplierId) params.append('supplierId', supplierId);
    if (active !== '') params.append('active', active);

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getLowStockProducts: async ({ page = 0, size = 10 } = {}) => {
    const response = await api.get(`/products/low-stock?page=${page}&size=${size}`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deactivateProduct: async (id) => {
    await api.delete(`/products/${id}`);
  },
};
