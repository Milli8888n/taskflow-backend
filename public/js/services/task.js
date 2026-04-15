/**
 * Task Service
 * Xử lý tất cả API calls liên quan đến tasks
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../api/apiClient.js';

/**
 * Lấy danh sách tasks của 1 project
 * @param {string} projectId - ID của project
 * @returns {Promise<object>} { tasks: [...] }
 */
export async function getTasksByProject(projectId) {
  return await apiGet(`/projects/${projectId}/tasks`);
}

/**
 * Lấy chi tiết 1 task
 * @param {string} projectId - ID của project
 * @param {string} taskId - ID của task
 * @returns {Promise<object>} Task object
 */
export async function getTaskById(projectId, taskId) {
  return await apiGet(`/projects/${projectId}/tasks/${taskId}`);
}

/**
 * Tạo task mới
 * @param {string} projectId - ID của project
 * @param {object} data - { title, description?, assignee?, priority?, status? }
 * @returns {Promise<object>} { task: {...} }
 */
export async function createTask(projectId, data) {
  return await apiPost(`/projects/${projectId}/tasks`, data);
}

/**
 * Cập nhật task
 * @param {string} projectId - ID của project
 * @param {string} taskId - ID của task
 * @param {object} data - Dữ liệu cập nhật
 * @returns {Promise<object>}
 */
export async function updateTask(projectId, taskId, data) {
  return await apiPut(`/projects/${projectId}/tasks/${taskId}`, data);
}

/**
 * PATCH task (cập nhật một phần)
 * @param {string} projectId - ID của project
 * @param {string} taskId - ID của task
 * @param {object} data - Dữ liệu cập nhật
 * @returns {Promise<object>}
 */
export async function patchTask(projectId, taskId, data) {
  return await apiPatch(`/projects/${projectId}/tasks/${taskId}`, data);
}

/**
 * Xoá task
 * @param {string} projectId - ID của project
 * @param {string} taskId - ID của task
 * @returns {Promise<object>}
 */
export async function deleteTask(projectId, taskId) {
  return await apiDelete(`/projects/${projectId}/tasks/${taskId}`);
}

/**
 * Thay đổi status task (kéo thả trên board)
 * @param {string} projectId - ID của project
 * @param {string} taskId - ID của task
 * @param {string} status - Status mới (todo, inprogress, done)
 * @returns {Promise<object>}
 */
export async function updateTaskStatus(projectId, taskId, status) {
  return await apiPatch(`/projects/${projectId}/tasks/${taskId}`, { status });
}

/**
 * Thay đổi vị trí task trong cột (order)
 * @param {string} projectId - ID của project
 * @param {string} taskId - ID của task
 * @param {number} order - Vị trí mới trong cột
 * @returns {Promise<object>}
 */
export async function updateTaskOrder(projectId, taskId, order) {
  return await apiPatch(`/projects/${projectId}/tasks/${taskId}`, { order });
}

/**
 * Assign task cho user
 * @param {string} projectId - ID của project
 * @param {string} taskId - ID của task
 * @param {string} assigneeId - ID của assignee
 * @returns {Promise<object>}
 */
export async function assignTask(projectId, taskId, assigneeId) {
  return await apiPatch(`/projects/${projectId}/tasks/${taskId}`, { assignee: assigneeId });
}
