/**
 * API Endpoints Constants
 * Gom tất cả các hằng số URL API vào một chỗ
 * Giúp dễ thay đổi base URL hoặc các endpoint
 */

export const API_BASE_URL = '/api/v1';

// ===== AUTH ENDPOINTS =====
export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout'
};

// ===== PROJECT ENDPOINTS =====
export const PROJECTS = {
  LIST: '/projects',
  GET: (id) => `/projects/${id}`,
  CREATE: '/projects',
  UPDATE: (id) => `/projects/${id}`,
  DELETE: (id) => `/projects/${id}`,
  MEMBERS: (id) => `/projects/${id}/members`,
  ADD_MEMBER: (id) => `/projects/${id}/members`,
  REMOVE_MEMBER: (id, memberId) => `/projects/${id}/members/${memberId}`
};

// ===== TASK ENDPOINTS =====
export const TASKS = {
  LIST: (projectId) => `/projects/${projectId}/tasks`,
  GET: (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}`,
  CREATE: (projectId) => `/projects/${projectId}/tasks`,
  UPDATE: (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}`,
  DELETE: (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}`,
  UPDATE_STATUS: (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}`,
  UPDATE_ORDER: (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}`,
  ASSIGN: (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}`
};

// ===== COMMENT ENDPOINTS =====
export const COMMENTS = {
  LIST: (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}/comments`,
  CREATE: (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}/comments`,
  DELETE: (projectId, taskId, commentId) => 
    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
};

// ===== USER ENDPOINTS =====
export const USERS = {
  ME: '/users/me',
  UPDATE_PROFILE: '/users/me',
  UPLOAD_AVATAR: '/users/me/avatar',
  GET: (userId) => `/users/${userId}`,
  SEARCH: '/users/search'
};

// ===== DASHBOARD ENDPOINTS =====
export const DASHBOARD = {
  STATS: '/dashboard',
  ACTIVITY: '/dashboard/activity'
};

// ===== NOTIFICATION ENDPOINTS =====
export const NOTIFICATIONS = {
  LIST: '/notifications',
  MARK_READ: '/notifications/mark-read',
  DELETE: (id) => `/notifications/${id}`
};

export default {
  API_BASE_URL,
  AUTH,
  PROJECTS,
  TASKS,
  COMMENTS,
  USERS,
  DASHBOARD,
  NOTIFICATIONS
};
