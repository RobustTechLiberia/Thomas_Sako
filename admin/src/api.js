// API utility functions for admin panel
const API_BASE = '/api';

export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export const apiCall = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    includeAuth = true,
  } = options;

  const url = `${API_BASE}${endpoint}`;
  const config = {
    method,
    headers: getHeaders(includeAuth),
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      window.location.href = '/admin/login';
    }

    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export const auth = {
  login: (email, password) =>
    apiCall('/admin/auth/login', {
      method: 'POST',
      body: { email, password },
      includeAuth: false,
    }),

  logout: () =>
    apiCall('/admin/auth/logout', { method: 'POST' }),

  requestPasswordReset: (email) =>
    apiCall('/admin/auth/request-reset', {
      method: 'POST',
      body: { email },
      includeAuth: false,
    }),

  resetPassword: (token, newPassword) =>
    apiCall('/admin/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
      includeAuth: false,
    }),

  changePassword: (currentPassword, newPassword) =>
    apiCall('/admin/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
};

// Dashboard API
export const dashboard = {
  getStats: () => apiCall('/admin/dashboard'),
};

// Poll Questions API
export const pollQuestions = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/poll-questions?${query}`);
  },

  get: (id) => apiCall(`/admin/poll-questions/${id}`),

  create: (data) =>
    apiCall('/admin/poll-questions', {
      method: 'POST',
      body: data,
    }),

  update: (id, data) =>
    apiCall(`/admin/poll-questions/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  delete: (id) =>
    apiCall(`/admin/poll-questions/${id}`, {
      method: 'DELETE',
    }),

  publish: (id) =>
    apiCall(`/admin/poll-questions/${id}/publish`, {
      method: 'POST',
    }),
};

// Media API
export const media = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/media?${query}`);
  },

  upload: (file, type = 'image') => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const result = await apiCall('/admin/media/upload', {
            method: 'POST',
            body: { file: reader.result, type },
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  delete: (id) =>
    apiCall(`/admin/media/${id}`, {
      method: 'DELETE',
    }),
};

// Users API
export const users = {
  list: () => apiCall('/admin/users'),

  get: (id) => apiCall(`/admin/users/${id}`),

  create: (data) =>
    apiCall('/admin/users', {
      method: 'POST',
      body: data,
    }),

  update: (id, data) =>
    apiCall(`/admin/users/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  delete: (id) =>
    apiCall(`/admin/users/${id}`, {
      method: 'DELETE',
    }),
};

export default {
  auth,
  dashboard,
  pollQuestions,
  media,
  users,
};
