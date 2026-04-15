/**
 * Board Page Controller (Kanban)
 * - Đọc projectId từ EJS
 * - Tải tasks từ API
 * - Khởi tạo KanbanBoard component
 * - Lắng nghe realtime socket events
 * - Quản lý search & filters
 */

import { getTasksByProject, deleteTask } from '../services/task.js';
import { KanbanBoard } from '../components/kanbanBoard.js';
import { TaskModal } from  '../components/taskModal.js';
import { TaskFilter } from '../components/taskFilter.js';
import '../socket/realtime.js';

class BoardPage {
  constructor(projectId) {
    this.projectId = projectId;
    this.boardTitle = document.getElementById('board-title');
    this.boardSubtitle = document.getElementById('board-subtitle');
    this.boardError = document.getElementById('board-error');
    
    this.kanban = new KanbanBoard(projectId);
    this.taskModal = new TaskModal(projectId);
    this.taskFilter = new TaskFilter();
    
    this.currentFilters = {};
    this.init();
  }

  async init() {
    try {
      this.taskFilter.render();
      this.taskFilter.onFilterChanged((filters) => this.handleFilterChange(filters));
      
      await this.loadTasks();
      this.setupGlobalFunctions();
      console.log('✓ Board page initialized');
    } catch (error) {
      this.showError('Lỗi tải board: ' + error.message);
    }
  }

  /**
   * Handle filter changes
   */
  async handleFilterChange(filters) {
    this.currentFilters = filters;
    await this.loadTasks();
  }

  /**
   * Tải tasks từ API với filters
   */
  async loadTasks() {
    try {
      const response = await getTasksByProject(this.projectId, this.currentFilters);
      const tasks = response.data?.tasks || response.tasks || [];
      
      // Render kanban board
      this.kanban.render(tasks);
      this.kanban.hideError();
      
    } catch (error) {
      this.kanban.showError(error.message || 'Không thể tải danh sách tasks');
      console.error('Load tasks error:', error);
    }
  }

  /**
   * Setup các global functions cho views
   */
  setupGlobalFunctions() {
    window.__TF__ = window.__TF__ || {};
    
    // Save board instance
    window.__TF__.board = this;
    window.__TF__.taskModal = this.taskModal;
    
    // Delete task function
    window.__TF__.deleteTask = async (projectId, taskId) => {
      try {
        await deleteTask(projectId, taskId);
        this.kanban.removeTask(taskId);
      } catch (error) {
        this.kanban.showError('Không thể xoá task: ' + error.message);
      }
    };

    // Open task modal function
    window.__TF__.openTaskModal = (projectId, taskId) => {
      this.taskModal.open(projectId, taskId);
    };
  }

  showError(message) {
    if (this.boardError) {
      this.boardError.textContent = '❌ ' + message;
      this.boardError.classList.remove('hidden');
    }
  }
}

// Auto-initialization
document.addEventListener('DOMContentLoaded', () => {
  // Lấy projectId từ EJS variable (cần inject vào script)
  // Tạm thời tìm từ URL
  const pathParts = window.location.pathname.split('/');
  const projectId = pathParts[2]; // /projects/{projectId}

  if (projectId && projectId !== 'new' && projectId !== 'list') {
    const board = new BoardPage(projectId);
    window.__TF__.board = board;
  }
});

console.log('✓ Board page controller loaded');
