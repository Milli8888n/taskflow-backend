/**
 * Auth Service - Xử lý logic xác thực
 * Cung cấp: login(), register(), logout()
 */

import { apiPost, apiGet } from '../api/apiClient.js';

/**
 * Đăng ký tài khoản mới
 * @param {object} credentials - { name, email, password }
 * @returns {Promise<object>} { user }
 */
export async function register(credentials) {
  const response = await apiPost('/auth/register', credentials);
  
  // Backend trả về: { status, data: { user }, message }
  if (response.data?.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return {
      user: response.data.user
    };
  }
  
  throw new Error(response.message || 'Đăng ký thất bại');
}

/**
 * Đăng nhập với email & password
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} { accessToken, user }
 */
export async function login(credentials) {
  const response = await apiPost('/auth/login', credentials);
  
  // Backend trả về: { status, data: { user, accessToken, refreshToken }, message }
  if (response.data?.accessToken) {
    localStorage.setItem('token', response.data.accessToken);
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return {
      accessToken: response.data.accessToken,
      user: response.data.user
    };
  }
  
  throw new Error(response.message || 'Đăng nhập thất bại');
}

/**
 * Đăng xuất & xoá token/user từ localStorage
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

/**
 * Lấy thông tin user hiện tại từ localStorage
 * @returns {object|null} User object hoặc null nếu chưa đăng nhập
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

/**
 * Kiểm tra xem user có đã đăng nhập không
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

/**
 * Lấy token hiện tại
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem('token');
}
