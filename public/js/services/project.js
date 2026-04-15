/**
 * Project Service
 * Xử lý tất cả API calls liên quan đến projects
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../api/apiClient.js';

/**
 * Lấy danh sách tất cả projects của user
 * @returns {Promise<object>} { projects: [...] }
 */
export async function getProjects() {
  return await apiGet('/projects');
}

/**
 * Lấy chi tiết 1 project
 * @param {string} projectId - ID của project
 * @returns {Promise<object>} Project object
 */
export async function getProjectById(projectId) {
  return await apiGet(`/projects/${projectId}`);
}

/**
 * Tạo project mới
 * @param {object} data - { name, description, color? }
 * @returns {Promise<object>} { project: {...} }
 */
export async function createProject(data) {
  return await apiPost('/projects', data);
}

/**
 * Cập nhật project
 * @param {string} projectId - ID của project
 * @param {object} data - Dữ liệu cập nhật
 * @returns {Promise<object>}
 */
export async function updateProject(projectId, data) {
  return await apiPut(`/projects/${projectId}`, data);
}

/**
 * Xoá project
 * @param {string} projectId - ID của project
 * @returns {Promise<object>}
 */
export async function deleteProject(projectId) {
  return await apiDelete(`/projects/${projectId}`);
}

/**
 * Thêm member vào project
 * @param {string} projectId - ID của project
 * @param {string} userId - ID của user cần thêm
 * @returns {Promise<object>}
 */
export async function addProjectMember(projectId, userId) {
  return await apiPost(`/projects/${projectId}/members`, { userId });
}

/**
 * Xoá member khỏi project
 * @param {string} projectId - ID của project
 * @param {string} memberId - ID của member cần xoá
 * @returns {Promise<object>}
 */
export async function removeProjectMember(projectId, memberId) {
  return await apiDelete(`/projects/${projectId}/members/${memberId}`);
}
