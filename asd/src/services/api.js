import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API基礎配置
const API_BASE_URL = 'http://169.254.0.21:8000/api';

// 創建axios實例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加認證token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('獲取token失敗:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 處理錯誤
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token過期，清除本地存儲並跳轉到登錄頁
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userInfo');
      // 這裡可以添加導航到登錄頁的邏輯
    }
    
    return Promise.reject(error.response?.data || error.message);
  }
);

// 認證相關API
export const authAPI = {
  // 用戶登錄
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 用戶登出
  logout: () => api.post('/auth/logout'),
  
  // 獲取用戶資料
  getProfile: () => api.get('/auth/profile'),
  
  // 刷新token
  refreshToken: () => api.post('/auth/refresh'),
};

// 用戶管理API
export const userAPI = {
  // 獲取用戶列表
  getUsers: (params) => api.get('/users', { params }),
  
  // 獲取單個用戶
  getUser: (id) => api.get(`/users/${id}`),
  
  // 創建用戶
  createUser: (userData) => api.post('/users', userData),
  
  // 更新用戶
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // 刪除用戶
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// 配方管理API
export const recipeAPI = {
  // 獲取配方列表
  getRecipes: (params) => api.get('/recipes', { params }),
  
  // 獲取配方詳情
  getRecipe: (id) => api.get(`/recipes/${id}`),
  
  // 創建配方
  createRecipe: (recipeData) => api.post('/recipes', recipeData),
  
  // 更新配方
  updateRecipe: (id, recipeData) => api.put(`/recipes/${id}`, recipeData),
  
  // 刪除配方
  deleteRecipe: (id) => api.delete(`/recipes/${id}`),
  
  // 獲取配方分類
  getCategories: () => api.get('/recipe-categories'),
};

// 排班管理API
export const scheduleAPI = {
  // 獲取排班列表
  getSchedules: (params) => api.get('/schedules', { params }),
  
  // 獲取個人排班
  getMySchedules: (params) => api.get('/schedules/my', { params }),
  
  // 創建排班
  createSchedule: (scheduleData) => api.post('/schedules', scheduleData),
  
  // 更新排班
  updateSchedule: (id, scheduleData) => api.put(`/schedules/${id}`, scheduleData),
  
  // 刪除排班
  deleteSchedule: (id) => api.delete(`/schedules/${id}`),
};

// 請假管理API
export const leaveAPI = {
  // 獲取請假申請列表
  getLeaveRequests: (params) => api.get('/leave-requests', { params }),
  
  // 提交請假申請
  createLeaveRequest: (leaveData) => api.post('/leave-requests', leaveData),
  
  // 審批請假申請
  approveLeaveRequest: (id, approved) => api.put(`/leave-requests/${id}/approve`, { approved }),
};

export default api;

