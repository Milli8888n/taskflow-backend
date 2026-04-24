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
    this.boardEl = document.getElementById('kanban-board');
    this.errorDiv = document.getElementById('board-error');
    this.tasks = [];
    this.draggedTask = null;
    
    // Setup drop zones ONCE
    this.initDropzones();
    this.initInlineAddButtons();
  }

  /**
   * Listen to inline add buttons (+ Thêm thẻ)
   */
  initInlineAddButtons() {
    this.boardEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-add-task-inline');
      if (btn) {
        const status = btn.dataset.status;
        // Trigger global TF function to open create task modal with prefilled status
        if (window.__TF__ && window.__TF__.openCreateTaskModal) {
          window.__TF__.openCreateTaskModal(this.projectId, status);
        }
      }
    });
  }

  /**
   * Setup HTML5 Dropzones once in constructor
   */
  initDropzones() {
    if (!this.boardEl) return;
    const dropzones = this.boardEl.querySelectorAll('[data-dropzone]');
    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => this.handleDragOver(e));
      zone.addEventListener('drop', (e) => this.handleDrop(e));
      zone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    });
  }

  /**
   * Render toàn bộ board với tasks
   */
  render(tasks) {
    this.tasks = tasks || [];
    this.clearAllTasks();
    this.renderTasks();
    this.updateColumnCounts();
  }

  /**
   * Xoá tất cả task cards khỏi board
   */
  clearAllTasks() {
    if (!this.boardEl) return;
    const dropzones = this.boardEl.querySelectorAll('[data-dropzone]');
    dropzones.forEach(zone => {
      zone.innerHTML = '';
    });
  }

  /**
   * Render tất cả tasks vào các cột tương ứng
   */
  renderTasks() {
    if (!this.boardEl) return;
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
    div.className = 'group relative z-0 hover:z-10 glass-panel rounded-2xl p-4 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-300 border border-outline-variant/10 cursor-pointer active:cursor-grabbing mb-3 transform-gpu';
    div.draggable = true;
    div.dataset.taskId = task._id;
    div.dataset.status = task.status;

    const priority = task.priority || 'Medium';
    const priorityConfig = {
      'High': { dot: 'bg-error', text: 'text-error', border: 'border-error/30' },
      'Medium': { dot: 'bg-primary', text: 'text-primary', border: 'border-primary/30' },
      'Low': { dot: 'bg-on-surface-variant/40', text: 'text-on-surface-variant', border: 'border-outline-variant/30' }
    };
    const config = priorityConfig[priority];

    // Deadline formatting
    const deadline = task.deadline ? new Date(task.deadline) : null;
    let deadlineBadge = '';
    
    if (deadline) {
      const now = new Date();
      const diff = deadline - now;
      const isOverdue = diff < 0 && task.status !== 'Done';
      const isSoon = diff > 0 && diff < (3 * 24 * 60 * 60 * 1000);
      
      const text = deadline.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
      const colorClass = isOverdue ? 'text-error bg-error/10' : (isSoon ? 'text-warning bg-warning/10' : 'text-on-surface-variant bg-surface-container-highest/50');
      
      deadlineBadge = `
        <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg ${colorClass} text-[10px] font-black uppercase tracking-wider">
          <span class="material-symbols-outlined text-[14px]">${isOverdue ? 'event_busy' : 'calendar_today'}</span>
          ${text}
        </div>
      `;
    }

    // Subtasks progress
    const subtasks = task.checklist || [];
    const completedSubtasks = subtasks.filter(i => i.isCompleted).length;
    const subtaskBadge = subtasks.length > 0 ? `
      <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-highest/50 text-on-surface-variant text-[10px] font-black uppercase tracking-wider">
        <span class="material-symbols-outlined text-[14px]">check_circle</span>
        ${completedSubtasks}/${subtasks.length}
      </div>
    ` : '';

    const assignee = task.assignee || null;

    div.innerHTML = `
      <!-- Left Priority Accent -->
      <div class="absolute left-0 top-3 bottom-3 w-1 ${config.dot} rounded-r-lg opacity-80 group-hover:opacity-100 transition-opacity"></div>
      
      <div class="space-y-4">
        <div class="flex items-start justify-between">
          <h3 class="text-sm font-black text-on-surface font-headline leading-relaxed group-hover:text-primary transition-colors line-clamp-2">
            ${task.title}
          </h3>
        </div>

        <!-- Metadata Row -->
        <div class="flex flex-wrap gap-2">
          ${deadlineBadge}
          ${subtaskBadge}
        </div>

        <div class="pt-3 border-t border-outline-variant/5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full ${config.dot} shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]"></div>
            <span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">${priority}</span>
          </div>
          
          <div class="assignee-avatar">
            ${assignee ? `
              <div class="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center text-[10px] font-black text-on-primary-container border border-surface shadow-sm" title="${assignee.name}">
                ${assignee.name.charAt(0).toUpperCase()}
              </div>
            ` : `
              <div class="w-7 h-7 rounded-lg bg-surface-container-highest border border-outline-variant/10 flex items-center justify-center text-on-surface-variant/30">
                <span class="material-symbols-outlined text-sm">person</span>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Subtle background glow on hover -->
      <div class="absolute -inset-2 bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    `;

    // Click to open modal
    div.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        window.__TF__.openTaskModal(this.projectId, task._id);
      }
    });

    // Drag listeners for the card
    div.addEventListener('dragstart', (e) => this.handleDragStart(e));
    div.addEventListener('dragend', (e) => this.handleDragEnd(e));

    return div;
  }


  handleDragStart(e) {
    const taskEl = e.currentTarget;
    if (!taskEl) return;
    
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
    if (this.draggedTask && e.currentTarget) {
      e.currentTarget.classList.add('bg-primary/5');
    }
  }

  handleDragLeave(e) {
    if (e.currentTarget) {
      e.currentTarget.classList.remove('bg-primary/5');
    }
  }

  async handleDrop(e) {
    try {
      e.preventDefault();
      
      const dropzone = e.currentTarget;
      if (!dropzone || !this.draggedTask) return;

      // Clean up visual feedback
      dropzone.classList.remove('bg-primary/5');

      const draggedElement = this.draggedTask;
      const taskId = draggedElement.getAttribute('data-task-id');
      const oldStatus = draggedElement.getAttribute('data-status');
      const newStatus = dropzone.getAttribute('data-dropzone');

      // Validate and check if same column
      if (!taskId || !oldStatus || !newStatus || oldStatus === newStatus) return;

      // --- Optimistic UI Update ---
      // 1. Update DOM
      draggedElement.setAttribute('data-status', newStatus);
      dropzone.appendChild(draggedElement);
      this.updateColumnCounts();

      // 2. Update local state
      const taskIndex = this.tasks.findIndex(t => t._id === taskId);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].status = newStatus;
      }

      // 3. API Call
      try {
        await updateTaskStatus(this.projectId, taskId, newStatus);
        console.log('✓ Task status updated on server');
      } catch (error) {
        console.error('❌ Server update failed, reverting...', error);
        
        // Revert DOM
        draggedElement.setAttribute('data-status', oldStatus);
        const oldDropzone = this.boardEl.querySelector(`[data-dropzone="${oldStatus}"]`);
        if (oldDropzone) {
          oldDropzone.appendChild(draggedElement);
        }
        
        // Revert state
        if (taskIndex !== -1) {
          this.tasks[taskIndex].status = oldStatus;
        }

        this.updateColumnCounts();
        this.showError('Không thể cập nhật task: ' + error.message);
      }
      
    } catch (error) {
      console.error('❌ Drop error:', error);
    } finally {
      this.draggedTask = null;
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
    // Check if task already exists in local array
    const existingIdx = this.tasks.findIndex(t => t._id === task._id);
    
    // Check if task element already exists in DOM
    const existingEl = this.boardEl.querySelector(`[data-task-id="${task._id}"]`);

    if (existingIdx !== -1 || existingEl) {
      console.log(`[Kanban] Task ${task._id} already exists, updating instead of adding.`);
      this.updateTask(task);
      return;
    }

    this.tasks.push(task);
    const taskEl = this.createTaskElement(task);
    const dropzone = this.boardEl.querySelector(`[data-dropzone="${task.status}"]`);
    
    if (dropzone) {
      dropzone.appendChild(taskEl);
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
    if (window.__TF__ && window.__TF__.Toast) {
      window.__TF__.Toast.error(message);
    }
  }

  hideError() {
    if (this.errorDiv) {
      this.errorDiv.classList.add('hidden');
    }
  }
}

export default KanbanBoard;
