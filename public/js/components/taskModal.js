/**
 * Task Modal Component
 * - Bật/Tắt modal dialog
 * - Load & render task details
 * - Handle chỉnh sửa task
 */

import { getTaskById, updateTask } from '../services/task.js';

export class TaskModal {
  constructor(projectId) {
    this.projectId = projectId;
    this.overlay = document.getElementById('task-modal-overlay');
    this.closeBtn = document.getElementById('task-modal-close');
    this.currentTaskId = null;
    this.currentTask = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Close modal when clicking overlay (outside main content)
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });

      // Prevent closing when clicking inside modal content
      const modal = this.overlay.querySelector('[role="dialog"]') || this.overlay.querySelector('div > div');
      if (modal) {
        modal.addEventListener('click', (e) => e.stopPropagation());
      }
    }
  }

  /**
   * Mở modal và load task details
   */
  async open(projectId, taskId) {
    try {
      this.projectId = projectId;
      this.currentTaskId = taskId;

      // Load task data
      const response = await getTaskById(projectId, taskId);
      this.currentTask = response.task || response;

      // Render task data vào modal
      this.renderTask(this.currentTask);

      // Show modal
      if (this.overlay) {
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');
      }

    } catch (error) {
      console.error('Error opening task modal:', error);
      alert('Không thể tải task details: ' + error.message);
    }
  }

  /**
   * Render task data vào modal
   */
  renderTask(task) {
    // Title
    const titleEl = document.getElementById('task-modal-title');
    if (titleEl) titleEl.textContent = task.title;

    // Description
    const descEl = document.getElementById('task-modal-desc');
    if (descEl) descEl.textContent = task.description || '—';

    // Project
    const projectEl = document.getElementById('task-modal-project');
    if (projectEl) projectEl.textContent = task.project?.name || 'Dự án';

    // Status
    const statusSelect = document.getElementById('task-modal-status');
    if (statusSelect) statusSelect.value = task.status || 'To Do';

    // Priority
    const prioritySelect = document.getElementById('task-modal-priority');
    if (prioritySelect) prioritySelect.value = task.priority || 'Medium';

    // Deadline
    const deadlineInput = document.getElementById('task-modal-deadline');
    if (deadlineInput && task.deadline) {
      const date = new Date(task.deadline);
      deadlineInput.valueAsDate = date;
    }

    // TODO: Render comments, attachments, team members
  }

  /**
   * Đóng modal
   */
  close() {
    if (this.overlay) {
      this.overlay.classList.add('hidden');
      this.overlay.classList.remove('flex');
    }
    this.currentTaskId = null;
    this.currentTask = null;
  }

  /**
   * Cập nhật task
   */
  async updateTask(updates) {
    try {
      const response = await updateTask(this.projectId, this.currentTaskId, updates);
      this.currentTask = response.task || response;
      this.renderTask(this.currentTask);
      
      // Notify parent page about update
      if (window.__TF__.board) {
        window.__TF__.board.kanban.updateTask(this.currentTask);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Không thể cập nhật task: ' + error.message);
    }
  }
}

export default TaskModal;
