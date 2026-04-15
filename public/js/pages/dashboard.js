/**
 * Dashboard Page Controller
 * Xử lý Chart/Thống kê & tổng quan dự án
 */

import { apiGet } from '../api/apiClient.js';

class DashboardPage {
  constructor() {
    this.init();
  }

  async init() {
    try {
      await this.loadDashboardData();
      this.renderCharts();
      console.log('✓ Dashboard page initialized');
    } catch (error) {
      console.error('Dashboard error:', error);
      this.showError('Lỗi tải dashboard: ' + error.message);
    }
  }

  /**
   * Tải dữ liệu dashboard từ API
   */
  async loadDashboardData() {
    try {
      const response = await apiGet('/dashboard');
      this.data = response;
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Render các charts/biểu đồ
   * TODO: Integrate Chart.js hoặc thư viện chart khác
   */
  renderCharts() {
    if (!this.data) return;

    // Render project stats
    this.renderProjectStats();
    
    // Render task stats
    this.renderTaskStats();
    
    // Render team activity
    this.renderTeamActivity();
  }

  /**
   * Render project statistics
   */
  renderProjectStats() {
    const statsContainer = document.getElementById('project-stats') || 
                          document.querySelector('[data-stats="projects"]');
    
    if (!statsContainer || !this.data.projects) return;

    const html = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-on-surface-variant text-sm mb-2">Tổng Dự Án</p>
              <p class="text-4xl font-bold text-on-surface">${this.data.projects.total || 0}</p>
            </div>
            <span class="material-symbols-outlined text-5xl text-primary/20">folder</span>
          </div>
        </div>

        <div class="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-on-surface-variant text-sm mb-2">Dự Án Hoạt Động</p>
              <p class="text-4xl font-bold text-on-surface">${this.data.projects.active || 0}</p>
            </div>
            <span class="material-symbols-outlined text-5xl text-tertiary/20">check_circle</span>
          </div>
        </div>

        <div class="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-on-surface-variant text-sm mb-2">Hoàn Thành</p>
              <p class="text-4xl font-bold text-on-surface">${this.data.projects.completed || 0}</p>
            </div>
            <span class="material-symbols-outlined text-5xl text-primary/20">done_all</span>
          </div>
        </div>
      </div>
    `;

    statsContainer.innerHTML = html;
  }

  /**
   * Render task statistics
   */
  renderTaskStats() {
    const statsContainer = document.getElementById('task-stats') || 
                          document.querySelector('[data-stats="tasks"]');
    
    if (!statsContainer || !this.data.tasks) return;

    const html = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <p class="text-on-surface-variant text-sm mb-2">Tổng Tasks</p>
          <p class="text-3xl font-bold text-on-surface">${this.data.tasks.total || 0}</p>
        </div>

        <div class="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <p class="text-on-surface-variant text-sm mb-2">Cần Làm</p>
          <p class="text-3xl font-bold text-primary">${this.data.tasks.todo || 0}</p>
        </div>

        <div class="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <p class="text-on-surface-variant text-sm mb-2">Đang Làm</p>
          <p class="text-3xl font-bold text-orange-500">${this.data.tasks.inProgress || 0}</p>
        </div>

        <div class="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <p class="text-on-surface-variant text-sm mb-2">Hoàn Thành</p>
          <p class="text-3xl font-bold text-tertiary">${this.data.tasks.done || 0}</p>
        </div>
      </div>
    `;

    statsContainer.innerHTML = html;
  }

  /**
   * Render team activity
   */
  renderTeamActivity() {
    const activityContainer = document.getElementById('team-activity') || 
                             document.querySelector('[data-activity]');
    
    if (!activityContainer || !this.data.activity) return;

    let html = '<div class="space-y-4">';
    
    this.data.activity.slice(0, 10).forEach(activity => {
      html += `
        <div class="flex items-start gap-4 pb-4 border-b border-outline-variant/10 last:border-0">
          <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold flex-shrink-0">
            ${activity.user.name.charAt(0).toUpperCase()}
          </div>
          <div class="flex-1">
            <p class="text-sm text-on-surface">
              <span class="font-semibold">${activity.user.name}</span>
              ${activity.action}
            </p>
            <span class="text-xs text-on-surface-variant">${this.getTimeAgo(activity.timestamp)}</span>
          </div>
        </div>
      `;
    });

    html += '</div>';
    activityContainer.innerHTML = html;
  }

  /**
   * Tính thời gian từ lúc tạo
   */
  getTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  showError(message) {
    const errorDiv = document.getElementById('dashboard-error') || 
                    document.querySelector('[data-error]');
    if (errorDiv) {
      errorDiv.textContent = '❌ ' + message;
      errorDiv.classList.remove('hidden');
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new DashboardPage();
  window.__TF__ = window.__TF__ || {};
  window.__TF__.dashboard = dashboard;
});

console.log('✓ Dashboard page controller loaded');
