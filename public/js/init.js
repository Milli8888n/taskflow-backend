/**
 * Global Initialization
 * - Tự động load navbar trên tất cả các pages
 * - Setup global event listeners
 */

import { NavbarComponent } from './components/navbar.js';
import { initSidebar } from './components/sidebar.js';

// Auto-initialize components on all pages
document.addEventListener('DOMContentLoaded', () => {
  new NavbarComponent();
  initSidebar();
});

console.log('✓ Global initialization loaded');
