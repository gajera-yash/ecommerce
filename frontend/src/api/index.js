import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getDashboardCharts = () => api.get('/dashboard/charts');
export const getTopProducts = () => api.get('/dashboard/top-products');

// Orders
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const bulkStatusUpdate = (data) => api.patch('/orders/bulk-status', data);

// Products
export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// Reports
export const getPlatformReport = (params) => api.get('/reports/platform', { params });
export const getProductReport = (params) => api.get('/reports/products', { params });
export const getMonthlyPnl = (params) => api.get('/reports/monthly-pnl', { params });
export const exportCsv = (params) => api.get('/reports/export-csv', { params, responseType: 'blob' });

// Settings
export const getFeeRules = () => api.get('/settings/fee-rules');
export const createFeeRule = (data) => api.post('/settings/fee-rules', data);
export const updateFeeRule = (id, data) => api.put(`/settings/fee-rules/${id}`, data);
export const deleteFeeRule = (id) => api.delete(`/settings/fee-rules/${id}`);
export const getProfile = () => api.get('/settings/profile');
export const updateProfile = (data) => api.put('/settings/profile', data);

// Categories
export const getCategories = (params) => api.get('/categories', { params });
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

export default api;
