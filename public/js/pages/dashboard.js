import { apiGet } from '../api/apiClient.js';

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value ?? 0);
}

function showError(message) {
  const errorEl = document.getElementById('dashboard-error');
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

async function loadDashboard() {
  try {
    // Ưu tiên endpoint theo sprint3
    let data;
    try {
      data = await apiGet('/dashboard/stats');
    } catch {
      // fallback nếu backend cũ
      data = await apiGet('/dashboard');
    }

    const stats = data?.data?.stats || data?.stats || {};

    setText('stat-projects', stats.totalProjects ?? stats.total ?? 0);
    setText('stat-todo', stats.todoCount ?? stats.todo ?? 0);
    setText('stat-inprogress', stats.inProgressCount ?? stats.inProgress ?? 0);
    setText('stat-done', stats.doneCount ?? stats.done ?? 0);
    setText('stat-overdue', stats.overdueTasks ?? stats.overdue ?? 0);

    const completionRate = Number(stats.completionRate ?? 0);
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    if (progressBar) progressBar.style.width = `${completionRate}%`;
    if (progressText) progressText.textContent = `${completionRate}%`;
  } catch (error) {
    showError(`Lỗi tải dashboard: ${error.message}`);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);

