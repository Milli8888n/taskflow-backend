/**
 * Realtime Socket.io Handler
 * - Kết nối đến Socket.io server
 * - Lắng nghe task updates
 * - Lắng nghe comment creations
 * - Lắng nghe notifications
 * - Update UI in realtime
 */

export class RealtimeManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Kết nối đến Socket.io server
   */
  connect() {
    if (typeof io === 'undefined') {
      console.warn('⚠ Socket.io not loaded. Real-time updates will be disabled.');
      console.warn('  Make sure socket.io script is included before app initialization.');
      return;
    }

    // Lấy token xác thực từ localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠ No authentication token found. Socket.io will not connect.');
      return;
    }

    // Kết nối với token xác thực
    this.socket = io({
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✓ Socket.io connected');
      
      // Join project room if we have projectId from board page
      if (window.__TF__ && window.__TF__.board && window.__TF__.board.projectId) {
        this.socket.emit('joinProject', window.__TF__.board.projectId);
        console.log('✓ Joined project room:', window.__TF__.board.projectId);
      }
      
      this.setupEventListeners();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('✗ Socket.io disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('✗ Socket.io connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('✗ Socket.io error:', error);
    });
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    /**
     * Task events
     */
    this.socket.on('taskCreated', (data) => {
      console.log('[Socket] Task created:', data);
      if (window.__TF__.board) {
        window.__TF__.board.kanban.addTask(data.task);
      }
    });

    this.socket.on('taskUpdated', (data) => {
      console.log('[Socket] Task updated:', data);
      if (window.__TF__.board) {
        window.__TF__.board.kanban.updateTask(data.task);
      }
      // Update modal if it's open
      if (window.__TF__.taskModal && window.__TF__.taskModal.currentTaskId === data.task._id) {
        window.__TF__.taskModal.currentTask = data.task;
        window.__TF__.taskModal.renderTask(data.task);
      }
    });

    this.socket.on('taskDeleted', (data) => {
      console.log('[Socket] Task deleted:', data);
      if (window.__TF__.board) {
        window.__TF__.board.kanban.removeTask(data.taskId);
      }
    });

    this.socket.on('taskStatusChanged', (data) => {
      console.log('[Socket] Task status changed:', data);
      if (window.__TF__.board) {
        const task = {
          ...data.task,
          status: data.newStatus
        };
        window.__TF__.board.kanban.updateTask(task);
      }
    });

    /**
     * Comment events
     */
    this.socket.on('commentCreated', (data) => {
      console.log('[Socket] Comment created:', data);
      const comment = data.comment || data;
      if (window.__TF__.taskModal) {
        window.__TF__.taskModal.addComment(comment);
      }
    });

    this.socket.on('commentUpdated', (data) => {
      console.log('[Socket] Comment updated:', data);
      const comment = data.comment || data;
      if (window.__TF__.taskModal) {
        window.__TF__.taskModal.updateComment(comment);
      }
    });

    this.socket.on('commentDeleted', (data) => {
      console.log('[Socket] Comment deleted:', data);
      if (window.__TF__.taskModal) {
        window.__TF__.taskModal.removeComment(data.commentId, data.taskId);
      }
    });

    /**
     * Activity & Notifications
     */
    this.socket.on('notification', (data) => {
      console.log('[Socket] Notification received:', data);
      this.showNotification(data);
    });

    this.socket.on('userStatusChanged', (data) => {
      console.log('[Socket] User status changed:', data);
      // User came online/offline - update member list
    });

    /**
     * Project events
     */
    this.socket.on('projectUpdated', (data) => {
      console.log('[Socket] Project updated:', data);
      // Update project info on page
      const boardTitle = document.getElementById('board-title');
      const boardSubtitle = document.getElementById('board-subtitle');
      if (boardTitle) boardTitle.textContent = data.project.name;
      if (boardSubtitle) boardSubtitle.textContent = data.project.description;
    });

    this.socket.on('memberJoined', (data) => {
      console.log('[Socket] Member joined:', data);
      // Update member list
    });

    this.socket.on('memberLeft', (data) => {
      console.log('[Socket] Member left:', data);
      // Update member list
    });
  }

  /**
   * Phát sự kiện task update
   */
  emitTaskUpdate(projectId, taskId, updates) {
    if (this.isConnected) {
      this.socket.emit('updateTask', {
        projectId,
        taskId,
        updates
      });
    }
  }

  /**
   * Phát sự kiện tạo comment
   */
  emitCommentCreate(projectId, taskId, content) {
    if (this.isConnected) {
      this.socket.emit('createComment', {
        projectId,
        taskId,
        content
      });
    }
  }

  /**
   * Hiển thị toast notification
   */
  showNotification(notification) {
    // Toast notification ở góc màn hình
    const toast = document.createElement('div');
    toast.className = 'fixed top-6 right-6 glass-blur-strong rounded-xl p-4 flex items-center gap-3 z-[200] animate-in fade-in';
    toast.style.minWidth = '300px';

    const typeClass = notification.type === 'error' ? 'border-error' : 
                     notification.type === 'success' ? 'border-tertiary' : 
                     'border-primary';

    toast.classList.add('border', typeClass);

    const icon = notification.type === 'error' ? '❌' : 
                notification.type === 'success' ? '✅' : 
                'ℹ️';

    toast.innerHTML = `
      <span class="text-xl">${icon}</span>
      <div class="flex-1 text-sm text-on-surface">
        <p class="font-semibold">${notification.title || 'Thông báo'}</p>
        <p class="text-on-surface-variant text-xs">${notification.message}</p>
      </div>
      <button class="text-on-surface-variant hover:text-on-surface" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}

// Global instance
const realtime = new RealtimeManager();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => realtime.connect());
} else {
  realtime.connect();
}

window.__TF__ = window.__TF__ || {};
window.__TF__.realtime = realtime;

export default realtime;
