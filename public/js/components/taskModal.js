/**
 * Task Modal Component
 * - Bật/Tắt modal dialog
 * - Load & render task details
 * - Handle chỉnh sửa task
 */

import { getTaskById, updateTask } from '../services/task.js';
import CommentBox from './commentBox.js';

export class TaskModal {
  constructor(projectId) {
    this.projectId = projectId;
    this.overlay = document.getElementById('task-modal-overlay');
    this.closeBtn = document.getElementById('task-modal-close');
    this.currentTaskId = null;
    this.currentTask = null;
    this.commentBox = new CommentBox(projectId, null);

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Auto-save on change
    ['status', 'priority', 'deadline', 'assignee'].forEach(field => {
      const el = document.getElementById(`task-modal-${field}`);
      if (el) {
        el.addEventListener('change', () => {
          let value = el.value;
          if (field === 'assignee' && !value) {
            value = null;
          }
          this.updateTask({ [field]: value });
        });
      }
    });
  }

  /**
   * Mở modal và load task details
   */
  async open(projectId, taskId) {
    try {
      this.projectId = projectId;
      this.currentTaskId = taskId;

      // Show modal first for faster feedback
      if (this.overlay) {
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');
        // Reset contents while loading
        this.resetModal();
      }

      this.commentBox.setTask(projectId, taskId);

      // Load task data — API returns { status, data: { task } }
      const response = await getTaskById(projectId, taskId);
      this.currentTask = response.data?.task || response.task || response;

      // Render task data vào modal
      this.renderTask(this.currentTask);
      await this.commentBox.loadComments();

    } catch (error) {
      console.error('Error opening task modal:', error);
      alert('Không thể tải task details: ' + error.message);
      this.close();
    }
  }

  resetModal() {
    const titleEl = document.getElementById('task-modal-title');
    if (titleEl) titleEl.textContent = 'Đang tải...';
    const descEl = document.getElementById('task-modal-desc');
    if (descEl) descEl.textContent = '—';
  }

  /**
   * Render task data vào modal
   */
  renderTask(task) {
    // Title
    const titleEl = document.getElementById('task-modal-title');
    if (titleEl) titleEl.textContent = task.title || 'Không có tiêu đề';

    // Description
    const descEl = document.getElementById('task-modal-desc');
    if (descEl) descEl.textContent = task.description || 'Chưa có mô tả chi tiết cho công việc này.';

    // Project — field name in model is "projectId", not "project"
    const projectEl = document.getElementById('task-modal-project');
    if (projectEl) projectEl.textContent = `Project: ${task.projectId?.name || '—'}`;

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
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      deadlineInput.value = `${year}-${month}-${day}`;
    } else if (deadlineInput) {
      deadlineInput.value = '';
    }

    // Dynamic tags
    const tagsEl = document.getElementById('task-modal-tags');
    if (tagsEl) {
      const priorityColors = {
        'High': 'bg-error/10 text-error',
        'Medium': 'bg-primary-container/20 text-primary',
        'Low': 'bg-surface-container-highest text-on-surface-variant'
      };
      const statusColors = {
        'To Do': 'bg-secondary-container/20 text-on-secondary-container',
        'In Progress': 'bg-primary-container/20 text-primary',
        'Done': 'bg-tertiary-container/20 text-tertiary'
      };
      tagsEl.innerHTML = `
        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority] || priorityColors['Medium']}">${task.priority || 'Medium'}</span>
        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[task.status] || statusColors['To Do']}">${task.status || 'To Do'}</span>
      `;
    }

    // Assignee
    const assigneeSelect = document.getElementById('task-modal-assignee');
    if (assigneeSelect) {
      if (task.assignee && (task.assignee._id || task.assignee.id || task.assignee)) {
        assigneeSelect.value = task.assignee._id || task.assignee.id || task.assignee;
      } else {
        assigneeSelect.value = '';
      }
    }
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
      this.currentTask = response.data?.task || response.task || response;
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

  /**
   * Realtime handlers cho comments
   */
  addComment(comment) {
    if (this.currentTaskId === comment.taskId) {
      this.commentBox.onExternalCommentCreated(comment);
    }
  }

  updateComment(comment) {
    if (this.currentTaskId === comment.taskId) {
      this.commentBox.onExternalCommentUpdated(comment);
    }
  }

  removeComment(commentId, taskId) {
    if (this.currentTaskId === taskId) {
      this.commentBox.onExternalCommentDeleted(commentId);
    }
  }
}

export default TaskModal;
