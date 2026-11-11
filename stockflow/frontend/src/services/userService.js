import api from './api';

export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  updateUserStatus: async (id, enabled) => {
    const response = await api.patch(`/users/${id}/status`, { enabled });
    return response.data;
  },
};
