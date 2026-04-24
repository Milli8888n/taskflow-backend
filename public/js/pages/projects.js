/**
 * Projects Page Controller
 * - Lấy danh sách dự án từ API
 * - Render projects vào DOM
 * - Xử lý tạo/sửa/xoá dự án
 */

import { getProjects, createProject, deleteProject } from '../services/project.js';

class ProjectsPage {
  constructor() {
    this.projectsList = document.getElementById('projects-list');
    this.loadingDiv = document.getElementById('projects-loading');
    this.emptyDiv = document.getElementById('projects-empty');
    this.errorDiv = document.getElementById('projects-error');
    
    this.projects = [];
    this.init();
  }

  async init() {
    await this.loadProjects();
    this.setupEventListeners();
    console.log('✓ Projects page initialized');
  }

  /**
   * Tải danh sách dự án từ API
   */
  async loadProjects() {
    try {
      this.showLoading();
      this.hideError();
      
      const response = await getProjects();
      this.projects = response.projects || [];
      console.log('✓ Projects loaded:', this.projects);
      
      this.render();
    } catch (error) {
      this.showError(error.message || 'Không thể tải danh sách dự án');
      console.error('Projects load error:', error);
    }
  }

  /**
   * Render danh sách projects
   */
  render() {
    // Xóa các project items cũ (giữ lại "add new" button)
    const existingProjects = this.projectsList.querySelectorAll('div.group:not(:first-child)');
    existingProjects.forEach(item => item.remove());

    this.hideLoading();

    if (this.projects.length === 0) {
      this.emptyDiv?.classList.remove('hidden');
      return;
    }

    this.emptyDiv?.classList.add('hidden');

    // Render mỗi project
    this.projects.forEach(project => {
      const projectEl = this.createProjectElement(project);
      this.projectsList.appendChild(projectEl);
    });
  }

  /**
   * Tạo HTML element cho một project
   */
  createProjectElement(project) {
    const div = document.createElement('div');
    div.className = 'group relative glass-panel rounded-3xl p-8 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 border border-outline-variant/10 cursor-pointer overflow-hidden';
    div.dataset.projectId = project._id;
    
    const memberCount = project.members?.length || 0;
    const displayMembers = (project.members || []).slice(0, 3);
    const extraCount = memberCount > 3 ? memberCount - 3 : 0;
    const progress = project.progress || 0;
    const category = project.category || 'Dự án';

    // SVG progress constants
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    div.innerHTML = `
      <!-- Top Decorative Accent -->
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/50 to-tertiary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div class="flex justify-between items-start mb-6">
        <div class="px-3 py-1 rounded-xl bg-surface-container-highest/50 border border-outline-variant/10 text-on-surface-variant text-[10px] font-black uppercase tracking-[0.15em]">
          ${category}
        </div>
        <button class="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest w-8 h-8 flex items-center justify-center rounded-xl transition-all" 
                data-project-menu="${project._id}">
          <span class="material-symbols-outlined text-xl">more_horiz</span>
        </button>
      </div>
      
      <div class="space-y-2 mb-8">
        <h3 class="text-2xl font-black text-on-surface font-headline leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-1">
          ${project.name}
        </h3>
        <p class="text-on-surface-variant text-sm line-clamp-2 leading-relaxed opacity-70 font-medium">
          ${project.description || 'Sáng tạo ý tưởng thành hiện thực thông qua quy trình làm việc hiện đại.'}
        </p>
      </div>
      
      <div class="mt-auto flex items-end justify-between">
        <div class="flex flex-col gap-3">
          <span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Đội ngũ</span>
          <div class="flex -space-x-3">
            ${displayMembers.map(member => {
              const memberName = member?.name || (typeof member === 'string' ? member : 'U');
              const initials = (memberName || 'U').charAt(0).toUpperCase();
              return `
                <div class="w-10 h-10 rounded-2xl bg-surface-container-highest border-2 border-[#1a1b24] flex items-center justify-center text-on-surface font-black text-xs hover:-translate-y-1 transition-transform cursor-pointer" title="${memberName}">
                  ${initials}
                </div>
              `;
            }).join('')}
            ${extraCount > 0 ? `
              <div class="w-10 h-10 rounded-2xl bg-surface-container-highest border-2 border-[#1a1b24] flex items-center justify-center text-[10px] font-black text-primary hover:-translate-y-1 transition-transform">
                +${extraCount}
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="relative w-16 h-16 flex items-center justify-center group/progress">
          <svg class="w-16 h-16 -rotate-90">
            <!-- Background track -->
            <circle class="text-surface-container-highest" cx="32" cy="32" fill="transparent" r="${radius}" stroke="currentColor" stroke-width="5"></circle>
            <!-- Progress indicator -->
            <circle class="text-primary transition-all duration-1000 ease-out" cx="32" cy="32" fill="transparent" r="${radius}" stroke="currentColor" 
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-width="5" stroke-linecap="round"
                    style="filter: drop-shadow(0 0 6px rgba(var(--primary-rgb), 0.6));"></circle>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-xs font-black text-on-surface">${progress}%</span>
          </div>
        </div>
      </div>

      <!-- Hover Glow Effect -->
      <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
    `;

    // Click vào project để vào trang Kanban board
    div.addEventListener('click', (e) => {
      if (!e.target.closest('[data-project-menu]')) {
        window.location.href = `/projects/${project._id}/board`;
      }
    });

    // Menu button
    const menuBtn = div.querySelector('[data-project-menu]');
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showProjectMenu(project, menuBtn);
      });
    }

    return div;
  }

  /**
   * Hiển thị context menu cho project
   */
  showProjectMenu(project, triggerElement) {
    // Xoá menu cũ nếu có
    const oldMenu = document.querySelector('[data-project-menu-container]');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'fixed glass-blur-strong rounded-lg shadow-xl z-[100] overflow-hidden bg-surface-container-low border border-outline-variant/20';
    menu.setAttribute('data-project-menu-container', 'true');
    
    const rect = triggerElement.getBoundingClientRect();
    menu.style.left = (rect.right - 200) + 'px';
    menu.style.top = (rect.bottom + 8) + 'px';

    menu.innerHTML = `
      <a href="/projects/${project._id}" class="block px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors border-b border-outline-variant/10">
        <span class="material-symbols-outlined text-sm mr-2 inline-block">open_in_new</span>
        Mở dự án
      </a>
      <button class="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors border-b border-outline-variant/10"
              onclick="window.location.href='/projects/${project._id}/settings'">
        <span class="material-symbols-outlined text-sm mr-2 inline-block">settings</span>
        Cài đặt
      </button>
      <button class="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors font-medium"
              onclick="if(confirm('Xác nhận xoá dự án này?')) window.__TF__.deleteProject('${project._id}')">
        <span class="material-symbols-outlined text-sm mr-2 inline-block">delete</span>
        Xoá dự án
      </button>
    `;

    document.body.appendChild(menu);

    // Remove menu on outside click
    const removeMenu = () => {
      menu.remove();
      document.removeEventListener('click', removeMenu);
    };
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 0);
  }

  /**
   * Hiển thị loading state
   */
  showLoading() {
    if (this.loadingDiv) this.loadingDiv.classList.remove('hidden');
  }

  /**
   * Ẩn loading state
   */
  hideLoading() {
    if (this.loadingDiv) this.loadingDiv.classList.add('hidden');
  }

  /**
   * Hiển thị error message
   */
  showError(message) {
    if (this.errorDiv) {
      this.errorDiv.textContent = '❌ ' + message;
      this.errorDiv.classList.remove('hidden');
    }
  }

  /**
   * Ẩn error message
   */
  hideError() {
    if (this.errorDiv) {
      this.errorDiv.classList.add('hidden');
    }
  }

  /**
   * Xoá project
   */
  async deleteProject(projectId) {
    try {
      await deleteProject(projectId);
      this.projects = this.projects.filter(p => p._id !== projectId);
      this.render();
    } catch (error) {
      this.showError('Không thể xoá dự án: ' + error.message);
    }
  }

  setupEventListeners() {
    // Khôi phục window.__TF__.deleteProject function
    window.__TF__ = window.__TF__ || {};
    window.__TF__.deleteProject = (projectId) => this.deleteProject(projectId);
  }
}

// Auto-initialize khi page load
if (window.__TF__?.page === 'projects-index') {
  const projectsPage = new ProjectsPage();
  window.__TF__.projectsPage = projectsPage;
  
  // Global function for creating new project
  window.createNewProject = async () => {
    // Create a simple modal for project creation
    const modalHtml = `
      <div id="create-project-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
        <div class="relative w-full max-w-md glass-blur-strong rounded-2xl p-8 border border-outline-variant/20 shadow-2xl animate-in fade-in zoom-in duration-300">
          <h2 class="text-2xl font-bold font-headline mb-6 text-on-surface">Tạo dự án mới</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-1.5 font-label">Tên dự án</label>
              <input type="text" id="new-project-name" 
                     class="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary transition-all"
                     placeholder="Ví dụ: Thiết kế Website">
            </div>
            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-1.5 font-label">Mô tả (tùy chọn)</label>
              <textarea id="new-project-desc" rows="3"
                        class="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary transition-all resize-none"
                        placeholder="Mô tả ngắn gọn về mục tiêu dự án..."></textarea>
            </div>
          </div>
          
          <div class="flex gap-3 mt-8">
            <button onclick="this.closest('#create-project-modal').remove()" 
                    class="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all">
              Hủy
            </button>
            <button id="confirm-create-project"
                    class="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-lg">rocket_launch</span>
              Tạo ngay
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const confirmBtn = document.getElementById('confirm-create-project');
    const nameInput = document.getElementById('new-project-name');
    const descInput = document.getElementById('new-project-desc');

    nameInput.focus();

    confirmBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const description = descInput.value.trim();

      if (!name) {
        alert('Vui lòng nhập tên dự án!');
        return;
      }

      try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Đang tạo...';
        
        const response = await createProject({ name, description });
        console.log('✓ Project created:', response);
        
        // Remove modal
        document.getElementById('create-project-modal').remove();
        
        // Reload projects
        if (window.__TF__.projectsPage) {
          await window.__TF__.projectsPage.loadProjects();
        }
      } catch (error) {
        console.error('Create project error:', error);
        alert('Lỗi: ' + (error.message || 'Không thể tạo dự án'));
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Thử lại';
      }
    });

    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('create-project-modal');
        if (modal) modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  };
}

console.log('✓ Projects page controller loaded');
