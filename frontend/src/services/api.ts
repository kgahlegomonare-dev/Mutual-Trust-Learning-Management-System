// Import your pre-configured axios instance from the parent scope directory
import axiosInstance from '../api/axiosInstance.js';

/**
 * Custom fallback wrapper mapping Axios standard request definitions interface 
 * so that both existing and new service dashboards execute hooks concurrently.
 */
const api = {
  get: <T = any>(url: string, config?: any) => axiosInstance.get<any, T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => axiosInstance.post<any, T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => axiosInstance.put<any, T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => axiosInstance.delete<any, T>(url, config),
};

// ✅ Export as default to resolve browser console Uncaught SyntaxErrors instantly
export default api;