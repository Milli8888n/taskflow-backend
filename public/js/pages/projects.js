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
    div.className = 'group bg-surface-container-low rounded-xl p-6 hover:bg-surface-container-high transition-all duration-300 border border-outline-variant/10 cursor-pointer';
    div.dataset.projectId = project._id;
    
    const memberCount = project.members?.length || 0;
    const displayMembers = (project.members || []).slice(0, 2);
    const extraCount = memberCount > 2 ? memberCount - 2 : 0;

    div.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div class="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
          ${project.category || 'Khác'}
        </div>
        <button class="text-on-surface-variant hover:text-on-surface p-2 hover:bg-surface-container-highest rounded-lg transition-all" 
                data-project-menu="${project._id}">
          <span class="material-symbols-outlined">more_horiz</span>
        </button>
      </div>
      
      <h3 class="text-xl font-bold text-on-surface mb-2 font-headline line-clamp-1">${project.name}</h3>
      <p class="text-on-surface-variant text-sm line-clamp-2 leading-relaxed mb-6">${project.description || 'Không có mô tả'}</p>
      
      <div class="flex items-center justify-between">
        <div class="flex -space-x-2">
          ${displayMembers.map(member => {
            const memberName = member?.name || (typeof member === 'string' ? member : 'U');
            const initials = (memberName || 'U').charAt(0).toUpperCase();
            const title = memberName || 'Unknown';
            return `
              <div class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold border-2 border-surface-container-low" title="${title}">
                ${initials}
              </div>
            `;
          }).join('')}
          ${extraCount > 0 ? `
            <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant border-2 border-surface-container-low">
              +${extraCount}
            </div>
          ` : ''}
        </div>
        
        <div class="relative w-12 h-12 flex items-center justify-center">
          <svg class="w-12 h-12 -rotate-90">
            <circle class="text-surface-container-highest transition-colors" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" stroke-width="4"></circle>
            <circle class="text-primary transition-all duration-300" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" 
                    stroke-dasharray="${project.progress || 0}" stroke-dashoffset="${100 - (project.progress || 0)}" stroke-width="4"></circle>
          </svg>
          <span class="absolute text-[10px] font-bold text-on-surface">${project.progress || 0}%</span>
        </div>
      </div>
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
  window.createNewProject = () => {
    // TODO: Show modal để tạo project mới
    console.log('CREATE PROJECT - TODO: Show create project modal');
    // Tạm thời redirect đến create page (nếu có)
    // window.location.href = '/projects/new';
  };
}

console.log('✓ Projects page controller loaded');
