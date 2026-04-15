/**
 * Kanban Board Component
 * - Render tasks vào 3 cột (To Do, In Progress, Done)
 * - Setup HTML5 Drag & Drop
 * - BẮT SỰ KIỆN kéo thả & cập nhật status task
 */

import { updateTaskStatus } from '../services/task.js';

export class KanbanBoard {
  constructor(projectId) {
    this.projectId = projectId;
    this.boardEl = document.getElementById('board');
    this.errorDiv = document.getElementById('board-error');
    this.tasks = [];
    this.draggedTask = null;
  }

  /**
   * Render toàn bộ board với tasks
   * @param {array} tasks - Mảng các task
   */
  render(tasks) {
    this.tasks = tasks || [];
    this.clearAllTasks();
    this.renderTasks();
    this.setupDragDrop();
    this.updateColumnCounts();
  }

  /**
   * Xoá tất cả task cards khỏi board
   */
  clearAllTasks() {
    const dropzones = this.boardEl.querySelectorAll('[data-dropzone]');
    dropzones.forEach(zone => {
      zone.innerHTML = '';
    });
  }

  /**
   * Render tất cả tasks vào các cột tương ứng
   */
  renderTasks() {
    this.tasks.forEach(task => {
      const taskEl = this.createTaskElement(task);
      const dropzone = this.boardEl.querySelector(`[data-dropzone="${task.status}"]`);
      
      if (dropzone) {
        dropzone.appendChild(taskEl);
      }
    });
  }

  /**
   * Tạo HTML element cho một task card
   */
  createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 cursor-move hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all group';
    div.draggable = true;
    div.dataset.taskId = task._id;
    div.dataset.status = task.status;

    const priority = task.priority || 'normal';
    const priorityColor = {
      'urgent': 'text-error bg-error/10',
      'high': 'text-primary bg-primary/10',
      'normal': 'text-on-surface-variant/50 bg-surface-container-highest',
      'low': 'text-on-surface-variant/40 bg-surface-container-highest'
    }[priority] || 'text-on-surface-variant/50 bg-surface-container-highest';

    const assignee = task.assignee || null;

    div.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <p class="text-sm font-semibold text-on-surface leading-snug line-clamp-2">${task.title}</p>
        </div>
        <button class="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded transition-all opacity-0 group-hover:opacity-100"
                onclick="event.stopPropagation(); window.__TF__.deleteTask('${this.projectId}', '${task._id}')">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <p class="text-xs text-on-surface-variant line-clamp-2 mb-4">${task.description || '—'}</p>

      <div class="flex items-center justify-between">
        <span class="inline-block px-2 py-1 rounded text-xs font-bold ${priorityColor}">
          ${this.getPriorityLabel(priority)}
        </span>
        
        ${assignee ? `
          <div class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold" 
               title="${assignee.name}">
            ${assignee.name.charAt(0).toUpperCase()}
          </div>
        ` : '<div class="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant/40"><span class="material-symbols-outlined text-xs">person_outline</span></div>'}
      </div>
    `;

    // Click để mở task detail modal
    div.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        window.__TF__.openTaskModal(this.projectId, task._id);
      }
    });

    return div;
  }

  /**
   * Lấy label cho priority
   */
  getPriorityLabel(priority) {
    const labels = {
      'urgent': '🔴 Khẩn cấp',
      'high': '🟠 Cao',
      'normal': '🟡 Thường',
      'low': '⚪ Thấp'
    };
    return labels[priority] || priority;
  }

  /**
   * Setup HTML5 Drag & Drop
   */
  setupDragDrop() {
    const tasks = this.boardEl.querySelectorAll('[data-task-id]');
    const dropzones = this.boardEl.querySelectorAll('[data-dropzone]');

    // Setup drag für task cards
    tasks.forEach(taskEl => {
      taskEl.addEventListener('dragstart', (e) => this.handleDragStart(e, taskEl));
      taskEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
    });

    // Setup drop zones
    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => this.handleDragOver(e));
      zone.addEventListener('drop', (e) => this.handleDrop(e, zone));
      zone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    });
  }

  handleDragStart(e, taskEl) {
    this.draggedTask = taskEl;
    taskEl.classList.add('opacity-50');
    e.dataTransfer.effectAllowed = 'move';
  }

  handleDragEnd(e) {
    if (this.draggedTask) {
      this.draggedTask.classList.remove('opacity-50');
      this.draggedTask = null;
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this.draggedTask) {
      e.currentTarget.classList.add('bg-primary/5');
    }
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove('bg-primary/5');
  }

  async handleDrop(e, dropzone) {
    e.preventDefault();
    dropzone.classList.remove('bg-primary/5');

    if (!this.draggedTask) return;

    const taskId = this.draggedTask.dataset.taskId;
    const oldStatus = this.draggedTask.dataset.status;
    const newStatus = dropzone.dataset.dropzone;

    // Không làm gì nếu drop vào cột cũ
    if (oldStatus === newStatus) {
      return;
    }

    // Update task status thông qua API
    try {
      await updateTaskStatus(this.projectId, taskId, newStatus);
      
      // Update local DOM
      this.draggedTask.dataset.status = newStatus;
      dropzone.appendChild(this.draggedTask);
      this.updateColumnCounts();
      
    } catch (error) {
      this.showError('Không thể cập nhật task: ' + error.message);
      console.error('Drop error:', error);
    }
  }

  /**
   * Cập nhật số lượng tasks ở mỗi cột
   */
  updateColumnCounts() {
    const columns = ['To Do', 'In Progress', 'Done'];
    
    columns.forEach(status => {
      const count = this.boardEl.querySelectorAll(`[data-dropzone="${status}"] [data-task-id]`).length;
      const countSpan = this.boardEl.querySelector(`[data-count="${status}"]`);
      if (countSpan) {
        countSpan.textContent = count;
      }
    });
  }

  /**
   * Add a new task card to the board
   */
  addTask(task) {
    this.tasks.push(task);
    const taskEl = this.createTaskElement(task);
    const dropzone = this.boardEl.querySelector(`[data-dropzone="${task.status}"]`);
    
    if (dropzone) {
      dropzone.appendChild(taskEl);
      this.setupDragDrop();
      this.updateColumnCounts();
    }
  }

  /**
   * Update task in the board
   */
  updateTask(updatedTask) {
    const taskIdx = this.tasks.findIndex(t => t._id === updatedTask._id);
    if (taskIdx !== -1) {
      this.tasks[taskIdx] = updatedTask;
    }
    
    // Re-render the task
    const oldEl = this.boardEl.querySelector(`[data-task-id="${updatedTask._id}"]`);
    if (oldEl) {
      const newEl = this.createTaskElement(updatedTask);
      oldEl.replaceWith(newEl);
      this.setupDragDrop();
      this.updateColumnCounts();
    }
  }

  /**
   * Remove task from the board
   */
  removeTask(taskId) {
    this.tasks = this.tasks.filter(t => t._id !== taskId);
    const taskEl = this.boardEl.querySelector(`[data-task-id="${taskId}"]`);
    if (taskEl) {
      taskEl.remove();
      this.updateColumnCounts();
    }
  }

  showError(message) {
    if (this.errorDiv) {
      this.errorDiv.textContent = '❌ ' + message;
      this.errorDiv.classList.remove('hidden');
    }
  }

  hideError() {
    if (this.errorDiv) {
      this.errorDiv.classList.add('hidden');
    }
  }
}

export default KanbanBoard;
