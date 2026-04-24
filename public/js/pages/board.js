/**
 * Board Page Controller (Kanban)
 * - Đọc projectId từ EJS
 * - Tải tasks từ API
 * - Khởi tạo KanbanBoard component
 * - Lắng nghe realtime socket events
 * - Quản lý search & filters
 */

import { getTasksByProject, deleteTask, createTask } from '../services/task.js';
import { getProjectById } from '../services/project.js';
import { sendInvitation } from '../services/invitation.js';
import { KanbanBoard } from '../components/kanbanBoard.js';
import { TaskModal } from  '../components/taskModal.js';
import { TaskFilter } from '../components/taskFilter.js';
import realtime from '../socket/realtime.js';

class BoardPage {
  constructor(projectId) {
    this.projectId = projectId;
    this.boardTitle = document.getElementById('board-title');
    this.boardSubtitle = document.getElementById('board-subtitle');
    this.boardError = document.getElementById('board-error');
    this.filterContainer = document.getElementById('filter-container');
    this.btnToggleFilter = document.getElementById('btn-toggle-filter');
    this.inviteModal = document.getElementById('invite-modal-overlay');
    this.btnInviteMember = document.getElementById('btn-invite-member');
    this.createTaskModalOverlay = document.getElementById('create-task-modal-overlay');
    
    this.kanban = new KanbanBoard(projectId);
    this.taskModal = new TaskModal(projectId);
    this.taskFilter = new TaskFilter();
    this.realtime = realtime;
    
    this.currentFilters = {};
    this.init();
  }

  async init() {
    try {
      this.taskFilter.render();
      this.taskFilter.onFilterChanged((filters) => this.handleFilterChange(filters));
      
      this.setupEventListeners();
      await Promise.all([
        this.loadProjectDetails(),
        this.loadTasks()
      ]);
      this.setupGlobalFunctions();
      
      // Explicitly tell socket to join this specific project room
      this.realtime.joinProject(this.projectId);
      
      console.log('✓ Board page initialized');
    } catch (error) {
      this.showError('Lỗi tải board: ' + error.message);
    }
  }

  /**
   * Tải thông tin dự án để cập nhật UI
   */
  async loadProjectDetails() {
    try {
      const project = await getProjectById(this.projectId);
      if (project) {
        if (this.boardTitle) this.boardTitle.textContent = project.name;
        if (this.boardSubtitle) this.boardSubtitle.textContent = project.description || 'Theo dõi tasks theo trạng thái';
        
        // Cập nhật tag Project (ví dụ hiển thị ID hoặc viết tắt)
        const projectTag = document.getElementById('project-tag');
        if (projectTag) projectTag.textContent = project.name.split(' ').map(w => w[0]).join('').toUpperCase() || 'Project';

        // Render thành viên
        const avatarsContainer = document.getElementById('board-avatars');
        if (avatarsContainer && project.members) {
          const maxAvatars = 4;
          const displayMembers = project.members.slice(0, maxAvatars);
          const remainCount = project.members.length - maxAvatars;

          avatarsContainer.innerHTML = displayMembers.map(m => `
            <div class="inline-block h-10 w-10 rounded-full ring-4 ring-surface bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold" title="${m.name}">
              ${m.avatar ? `<img src="${m.avatar}" class="h-full w-full rounded-full object-cover">` : m.name.charAt(0).toUpperCase()}
            </div>
          `).join('');

          if (remainCount > 0) {
            avatarsContainer.innerHTML += `
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high ring-4 ring-surface text-xs font-bold text-primary">
                +${remainCount}
              </div>
            `;
          }
        }
        
        this.project = project;
        const populateAssignees = (selectId) => {
          const sel = document.getElementById(selectId);
          if (sel) {
            sel.innerHTML = '<option value="" class="bg-surface-container text-on-surface">Chưa gán</option>';
            if (project.members) {
              project.members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m._id || m.id || m;
                opt.className = 'bg-surface-container text-on-surface';
                opt.textContent = m.name || m.email || m;
                sel.appendChild(opt);
              });
            }
          }
        };
        populateAssignees('create-task-assignee');
        populateAssignees('task-modal-assignee');

        document.title = `${project.name} | TaskFlow`;
      }
    } catch (error) {
      console.error('Lỗi tải thông tin dự án:', error);
    }
  }

  setupEventListeners() {
    // Toggle filter section
    if (this.btnToggleFilter && this.filterContainer) {
      this.btnToggleFilter.addEventListener('click', () => {
        this.filterContainer.classList.toggle('hidden');
        
        // Cập nhật style cho nút khi active
        if (this.filterContainer.classList.contains('hidden')) {
          this.btnToggleFilter.classList.remove('bg-primary/10', 'text-primary');
        } else {
          this.btnToggleFilter.classList.add('bg-primary/10', 'text-primary');
        }
      });
    }

    // Toggle invite modal
    const inviteButtons = [this.btnInviteMember, document.getElementById('btn-invite-member-small')];
    inviteButtons.forEach(btn => {
      btn?.addEventListener('click', () => {
        this.inviteModal.classList.remove('hidden');
        this.inviteModal.classList.add('flex');
      });
    });

    // Quick Add FAB
    const btnFabAdd = document.getElementById('btn-fab-add-task');
    btnFabAdd?.addEventListener('click', () => {
      this.openCreateTaskModal('To Do');
    });

    // Create Task Modal bindings
    const createCloseBtn = document.getElementById('create-task-modal-close');
    const createCancelBtn = document.getElementById('create-task-cancel-btn');
    const createSaveBtn = document.getElementById('create-task-save-btn');

    [createCloseBtn, createCancelBtn].forEach(btn => {
      btn?.addEventListener('click', () => {
        this.closeCreateTaskModal();
      });
    });

    createSaveBtn?.addEventListener('click', async () => {
      await this.handleCreateTask();
    });

    // Automation placeholder
    const btnAutomation = document.querySelector('[title="Tự động hóa"]');
    btnAutomation?.addEventListener('click', () => {
      window.__TF__.Toast.info('Tính năng Tự động hóa (Automations) đang được phát triển!');
    });

    // Handle invite button click
    const inviteSendBtn = document.getElementById('invite-send-btn');
    const inviteEmailInput = document.getElementById('invite-email');
    const closeBtn = document.getElementById('invite-modal-close');
    const cancelBtn = document.getElementById('invite-cancel-btn');

    // Close logic
    [closeBtn, cancelBtn].forEach(btn => {
      btn?.addEventListener('click', () => {
        this.inviteModal.classList.add('hidden');
        this.inviteModal.classList.remove('flex');
      });
    });

    if (inviteSendBtn && inviteEmailInput) {
      inviteSendBtn.addEventListener('click', async () => {
        const email = inviteEmailInput.value.trim();
        if (!email) {
          window.__TF__.Toast.error('Vui lòng nhập email');
          return;
        }

        if (!confirm(`Bạn có chắc chắn muốn mời người dùng (${email}) tham gia vào dự án này không?`)) {
          return;
        }

        // Disable button and show loading state
        const originalText = inviteSendBtn.textContent;
        inviteSendBtn.disabled = true;
        inviteSendBtn.textContent = 'Đang xử lý...';

        try {
          await sendInvitation(this.projectId, email);
          
          // Clear and close
          inviteEmailInput.value = '';
          this.inviteModal.classList.add('hidden');
          this.inviteModal.classList.remove('flex');
          
          window.__TF__.Toast.success('Đã gửi lời mời thành công! Người dùng cần xác nhận để tham gia.');
          
          // Không refresh lại avatar vì member chưa thực sự vào
        } catch (error) {
          window.__TF__.Toast.error('Lỗi: ' + error.message);
        } finally {
          inviteSendBtn.disabled = false;
          inviteSendBtn.textContent = originalText;
        }
      });
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

    // Delete task from modal action
    window.__TF__.deleteTaskFromModal = async () => {
      const taskId = this.taskModal.currentTaskId;
      const projectId = this.projectId;
      if (!taskId || !confirm('Bạn có chắc chắn muốn xoá task này?')) return;
      
      try {
        await window.__TF__.deleteTask(projectId, taskId);
        this.taskModal.close();
        window.__TF__.Toast.success('Đã xoá công việc thành công');
      } catch (error) {
        window.__TF__.Toast.error('Xoá task thất bại: ' + error.message);
      }
    };

    // Open create task modal
    window.__TF__.openCreateTaskModal = (projectId, status) => {
      this.openCreateTaskModal(status);
    };
  }

  openCreateTaskModal(status = 'To Do') {
    if (this.createTaskModalOverlay) {
      document.getElementById('create-task-title').value = '';
      document.getElementById('create-task-desc').value = '';
      document.getElementById('create-task-status').value = status;
      document.getElementById('create-task-priority').value = 'Medium';
      const assignEl = document.getElementById('create-task-assignee');
      if (assignEl) assignEl.value = '';
      
      this.createTaskModalOverlay.classList.remove('hidden');
      this.createTaskModalOverlay.classList.add('flex');
    }
  }

  closeCreateTaskModal() {
    if (this.createTaskModalOverlay) {
      this.createTaskModalOverlay.classList.add('hidden');
      this.createTaskModalOverlay.classList.remove('flex');
    }
  }

  async handleCreateTask() {
    const titleInput = document.getElementById('create-task-title');
    const descInput = document.getElementById('create-task-desc');
    const statusSelect = document.getElementById('create-task-status');
    const prioritySelect = document.getElementById('create-task-priority');
    const saveBtn = document.getElementById('create-task-save-btn');

    const title = titleInput.value.trim();
    if (!title) {
      window.__TF__.Toast.error('Vui lòng nhập tiêu đề công việc!');
      titleInput.focus();
      return;
    }

    const data = {
      title,
      description: descInput.value.trim(),
      status: statusSelect.value,
      priority: prioritySelect.value
    };
    
    const assignEl = document.getElementById('create-task-assignee');
    if (assignEl && assignEl.value) {
      data.assignee = assignEl.value;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = 'Đang lưu...';

      const response = await createTask(this.projectId, data);
      const newTask = response.data?.task || response.task;
      if (newTask) {
        this.kanban.addTask(newTask);
      }
      
      this.closeCreateTaskModal();
      window.__TF__.Toast.success('Thêm công việc mới thành công');
    } catch (error) {
      window.__TF__.Toast.error('Lỗi tạo task: ' + error.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Tạo thẻ';
    }
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
