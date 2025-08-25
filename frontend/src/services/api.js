import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp for cache busting
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
            { refreshToken }
          );
          
          const { accessToken } = response.data.data;
          
          // Store new token
          localStorage.setItem('token', accessToken);
          
          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    profile: '/auth/profile',
  },
  
  // Users
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    changePassword: '/users/change-password',
    uploadAvatar: '/users/avatar',
  },
  
  // Sessions
  sessions: {
    list: '/sessions',
    create: '/sessions',
    get: (id) => `/sessions/${id}`,
    update: (id) => `/sessions/${id}`,
    delete: (id) => `/sessions/${id}`,
    join: (id) => `/sessions/${id}/join`,
    leave: (id) => `/sessions/${id}/leave`,
    attendance: (id) => `/sessions/${id}/attendance`,
  },
  
  // Attendance
  attendance: {
    list: '/attendance',
    mark: (id) => `/attendance/${id}`,
    update: (id) => `/attendance/${id}`,
    bulkUpdate: '/attendance/bulk',
    stats: '/attendance/stats',
  },
  
  // Payments
  payments: {
    list: '/payments',
    create: '/payments',
    get: (id) => `/payments/${id}`,
    update: (id) => `/payments/${id}`,
    process: (id) => `/payments/${id}/process`,
    refund: (id) => `/payments/${id}/refund`,
    stats: '/payments/stats',
    overdue: '/payments/overdue',
  },
  
  // Syllabus
  syllabus: {
    list: '/syllabus',
    create: '/syllabus',
    get: (id) => `/syllabus/${id}`,
    update: (id) => `/syllabus/${id}`,
    delete: (id) => `/syllabus/${id}`,
    topics: (id) => `/syllabus/${id}/topics`,
  },
  
  // Feedback
  feedback: {
    list: '/feedback',
    create: '/feedback',
    get: (id) => `/feedback/${id}`,
    update: (id) => `/feedback/${id}`,
    delete: (id) => `/feedback/${id}`,
    stats: '/feedback/stats',
  },
  
  // Notifications
  notifications: {
    list: '/notifications',
    markRead: (id) => `/notifications/${id}/read`,
    markAllRead: '/notifications/mark-all-read',
    delete: (id) => `/notifications/${id}`,
    settings: '/notifications/settings',
  },
  
  // Admin
  admin: {
    users: '/admin/users',
    sessions: '/admin/sessions',
    payments: '/admin/payments',
    attendance: '/admin/attendance',
    analytics: '/admin/analytics',
    settings: '/admin/settings',
    announcements: '/admin/announcements',
  },
  
  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    revenue: '/analytics/revenue',
    attendance: '/analytics/attendance',
    performance: '/analytics/performance',
    growth: '/analytics/growth',
  },
  
  // Chat
  chat: {
    messages: '/chat/messages',
    conversations: '/chat/conversations',
    send: '/chat/send',
    markRead: (id) => `/chat/messages/${id}/read`,
  },
  
  // Files
  files: {
    upload: '/files/upload',
    download: (id) => `/files/${id}`,
    delete: (id) => `/files/${id}`,
    list: '/files',
  },
};

// Helper functions
export const apiHelpers = {
  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data.message || 'Bad request';
        case 401:
          return 'Unauthorized access';
        case 403:
          return 'Access forbidden';
        case 404:
          return 'Resource not found';
        case 409:
          return data.message || 'Conflict occurred';
        case 422:
          return data.message || 'Validation failed';
        case 429:
          return 'Too many requests';
        case 500:
          return 'Internal server error';
        default:
          return data.message || 'An error occurred';
      }
    } else if (error.request) {
      // Request made but no response
      return 'No response from server';
    } else {
      // Something else happened
      return error.message || 'An error occurred';
    }
  },
  
  // Format validation errors
  formatValidationErrors: (error) => {
    if (error.response?.data?.errors) {
      return error.response.data.errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {});
    }
    return {};
  },
  
  // Check if error is network error
  isNetworkError: (error) => {
    return !error.response && error.request;
  },
  
  // Check if error is server error
  isServerError: (error) => {
    return error.response?.status >= 500;
  },
  
  // Check if error is client error
  isClientError: (error) => {
    return error.response?.status >= 400 && error.response?.status < 500;
  },
};

// Export default api instance
export default api;