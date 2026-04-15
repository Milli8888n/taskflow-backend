/**
 * Toast UI Component
 * Alert hiện thông báo góc màn hình xanh/đỏ
 * Standalone toast notification system
 */

export class Toast {
  static create(message, options = {}) {
    const {
      type = 'info',      // 'success', 'error', 'info', 'warning'
      duration = 4000,    // milliseconds
      position = 'top-right'  // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
    } = options;

    const toast = document.createElement('div');
    const positionClass = this.getPositionClass(position);
    
    // Determine color based on type
    const colorClass = this.getColorClass(type);
    const icon = this.getIcon(type);

    toast.className = `fixed ${positionClass} glass-blur-strong rounded-xl p-4 flex items-center gap-3 z-[200] animate-in fade-in slide-in-from-top-2 min-w-[300px] max-w-[400px] border-l-4 ${colorClass}`;
    
    toast.innerHTML = `
      <span class="text-2xl flex-shrink-0">${icon}</span>
      <p class="flex-1 text-sm font-medium text-on-surface">${message}</p>
      <button class="flex-shrink-0 text-on-surface-variant hover:text-on-surface transition-colors" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    `;

    document.body.appendChild(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  /**
   * Success toast
   */
  static success(message, duration = 3000) {
    return this.create(message, { type: 'success', duration });
  }

  /**
   * Error toast
   */
  static error(message, duration = 4000) {
    return this.create(message, { type: 'error', duration });
  }

  /**
   * Info toast
   */
  static info(message, duration = 3000) {
    return this.create(message, { type: 'info', duration });
  }

  /**
   * Warning toast
   */
  static warning(message, duration = 3000) {
    return this.create(message, { type: 'warning', duration });
  }

  /**
   * Get position CSS class
   */
  static getPositionClass(position) {
    const positions = {
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6'
    };
    return positions[position] || positions['top-right'];
  }

  /**
   * Get color class based on type
   */
  static getColorClass(type) {
    const colors = {
      'success': 'border-tertiary bg-tertiary/10 text-tertiary',
      'error': 'border-error bg-error/10 text-error',
      'warning': 'border-orange-500 bg-orange-500/10 text-orange-500',
      'info': 'border-primary bg-primary/10 text-primary'
    };
    return colors[type] || colors['info'];
  }

  /**
   * Get icon based on type
   */
  static getIcon(type) {
    const icons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return icons[type] || icons['info'];
  }
}

// Export as global
window.__TF__ = window.__TF__ || {};
window.__TF__.Toast = Toast;

export default Toast;
