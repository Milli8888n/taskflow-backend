/**
 * Global Initialization
 * - Tự động load navbar trên tất cả các pages
 * - Setup global event listeners
 */

import { NavbarComponent } from './components/navbar.js';

// Auto-initialize navbar on all pages
document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra xem có header không (đã đăng nhập)
  const header = document.querySelector('header');
  if (header) {
    new NavbarComponent();
  }
});

console.log('✓ Global initialization loaded');
