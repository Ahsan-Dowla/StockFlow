import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data && response.data.token) {
      sessionStorage.setItem('stockflow_token', response.data.token);
      sessionStorage.setItem('stockflow_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data && response.data.token) {
      sessionStorage.setItem('stockflow_token', response.data.token);
      sessionStorage.setItem('stockflow_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network failure, client cleanup is authoritative
    } finally {
      sessionStorage.removeItem('stockflow_token');
      sessionStorage.removeItem('stockflow_user');
    }
  },

  getStoredUser: () => {
    const userJson = sessionStorage.getItem('stockflow_user');
    try {
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!sessionStorage.getItem('stockflow_token');
  },
};
