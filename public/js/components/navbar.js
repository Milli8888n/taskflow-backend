/**
 * Navbar Component
 * - Đọc thông tin User từ localStorage
 * - Load dữ liệu lên avatar & user menu
 * - Gắn sự kiện cho nút "Đăng xuất"
 */

import { logout, getCurrentUser } from '../services/auth.js';

export class NavbarComponent {
  constructor() {
    this.user = getCurrentUser();
    this.init();
  }

  init() {
    // Gắn sự kiện logout cho avatar button
    this.setupLogoutButton();
    this.setupSidebarLogout();
    
    console.log('✓ Navbar component initialized');
  }

  /**
   * Gắn sự kiện logout (thêm menu context hoặc kiểm tra click)
   */
  setupLogoutButton() {
    const avatarElement = document.querySelector('a[href="/profile"]');
    if (!avatarElement) return;

    // Create a context menu on right-click
    avatarElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      const menu = document.createElement('div');
      menu.className = 'fixed glass-blur-strong rounded-lg shadow-xl z-[100] overflow-hidden bg-surface-container-low border border-outline-variant/20';
      menu.style.left = e.clientX + 'px';
      menu.style.top = e.clientY + 'px';
      
      // Profile option
      const profileOption = document.createElement('a');
      profileOption.href = '/profile';
      profileOption.className = 'block px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors border-b border-outline-variant/10';
      profileOption.innerHTML = '<span class="material-symbols-outlined text-sm mr-2 inline-block">person</span>Hồ sơ';
      
      // Logout option
      const logoutOption = document.createElement('button');
      logoutOption.className = 'w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors font-medium';
      logoutOption.innerHTML = '<span class="material-symbols-outlined text-sm mr-2 inline-block">logout</span>Đăng xuất';
      logoutOption.addEventListener('click', async () => {
        await logout();
      });

      menu.appendChild(profileOption);
      menu.appendChild(logoutOption);
      document.body.appendChild(menu);

      // Remove menu when clicking elsewhere
      const removeMenu = () => {
        menu.remove();
        document.removeEventListener('click', removeMenu);
      };
      setTimeout(() => {
        document.addEventListener('click', removeMenu);
      }, 0);
    });
  }

  setupSidebarLogout() {
    const sidebarLogout = document.getElementById('sidebar-logout-link');
    if (!sidebarLogout) return;
    sidebarLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
    });
  }
}

// Tự động khởi tạo khi script load
const navbar = new NavbarComponent();
export default navbar;
