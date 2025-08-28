import axios from 'axios';
import { ApiResponse, LoginCredentials, RegisterData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 커스텀 API Error 클래스 추가
class ApiError extends Error {
  public success: boolean = false;
  public error: string;

  constructor(message: string, error?: string) {
    super(message);
    this.name = 'ApiError';
    this.error = error || message;
  }
}

// API 래퍼 객체
export const api = {
  get: async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.get<ApiResponse<T>>(url);
      return response.data;
    } catch (error: any) {
      throw new ApiError(
        error.response?.data?.message || error.message || '요청 실패',
        error.response?.data?.error || error.message
      );
    }
  },

  post: async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error: any) {
      throw new ApiError(
        error.response?.data?.message || error.message || '요청 실패',
        error.response?.data?.error || error.message
      );
    }
  },

  put: async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error: any) {
      throw new ApiError(
        error.response?.data?.message || error.message || '요청 실패',
        error.response?.data?.error || error.message
      );
    }
  },

  delete: async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error: any) {
      throw new ApiError(
        error.response?.data?.message || error.message || '요청 실패',
        error.response?.data?.error || error.message
      );
    }
  },
};

// 기존 API 함수들 (호환성을 위해 유지)
export const authAPI = {
  login: (credentials: LoginCredentials) => 
    api.post('/auth/login', credentials),
  register: (userData: RegisterData) => 
    api.post('/auth/register', userData),
};

export const institutionsAPI = {
  getAll: () => api.get('/institutions'),
  create: (data: any) => api.post('/institutions', data),
  update: (id: string, data: any) => api.put(`/institutions?id=${id}`, data),
  delete: (id: string) => api.delete(`/institutions?id=${id}`),
};

export const licensesAPI = {
  getAll: () => api.get('/licenses'),
  create: (data: any) => api.post('/licenses', data),
  update: (id: string, data: any) => api.put(`/licenses?id=${id}`, data),
  delete: (id: string) => api.delete(`/licenses?id=${id}`),
};

export const subscriptionsAPI = {
  getAll: () => api.get('/subscriptions'),
  create: (data: any) => api.post('/subscriptions', data),
  update: (id: string, data: any) => api.put(`/subscriptions?id=${id}`, data),
  cancel: (id: string) => api.delete(`/subscriptions?id=${id}`),
};

export default api;