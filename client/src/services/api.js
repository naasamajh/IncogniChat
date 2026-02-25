const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('anonchat_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  verifyOTP: async (data) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  resendOTP: async (email) => {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  logout: async () => {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/users?${query}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getUserDetails: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  blockUser: async (id, blockType, reason = '') => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/block`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ blockType, reason })
    });
    return handleResponse(res);
  },

  unblockUser: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/unblock`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  deleteUser: async (id, reason = '') => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  resetWarnings: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/reset-warnings`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getMessages: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/messages?${query}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/admin/analytics`, { headers: getHeaders() });
    return handleResponse(res);
  }
};
