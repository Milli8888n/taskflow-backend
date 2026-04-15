/**
 * API Client - Lớp Base Fetch
 * - Tự động gắn Token vào Header từ localStorage
 * - Xử lý 401 Unauthorized (xoá token & redirect /login)
 * - Quản lý baseURL của API
 */

const API_BASE_URL = '/api/v1';

/**
 * Fetch API hợp nhất - dùng chung cho tất cả request
 * @param {string} endpoint - Đường dẫn API (vd: '/tasks', '/projects/123')
 * @param {object} options - Các option fetch thêm
 * @returns {Promise<object>} Dữ liệu từ API
 */
export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Đọc token từ localStorage & gắn vào Header
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Nếu 401 Unauthorized - xoá token & chuyển hướng /login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }

    // Parse JSON response
    const data = await response.json().catch(() => ({}));

    // Nếu response không OK - throw error với message từ API
    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * GET request
 */
export function apiGet(endpoint, options = {}) {
  return fetchAPI(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export function apiPost(endpoint, body, options = {}) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 */
export function apiPut(endpoint, body, options = {}) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request
 */
export function apiPatch(endpoint, body, options = {}) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export function apiDelete(endpoint, options = {}) {
  return fetchAPI(endpoint, { ...options, method: 'DELETE' });
}

/**
 * POST FormData (dùng cho upload file)
 */
export async function apiPostFormData(endpoint, formData, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const headers = { ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Lưu ý: KHÔNG set Content-Type cho FormData (browser tự set)
  const response = await fetch(url, {
    ...options,
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
