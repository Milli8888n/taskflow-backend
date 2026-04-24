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
    this.listenersSet = false;
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
      
      // Only setup listeners once
      if (!this.listenersSet) {
        this.setupEventListeners();
        this.listenersSet = true;
      }
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
      const task = data.task || data;
      if (window.__TF__.board) {
        window.__TF__.board.kanban.addTask(task);
      }

      // Show toast if not by me
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (data.performerId && currentUser._id && data.performerId !== currentUser._id) {
        this.showNotification({
          title: 'Công việc mới',
          message: `Một công việc mới vừa được tạo: ${task.title}`,
          type: 'success'
        });
      }
    });

    this.socket.on('taskUpdated', (data) => {
      console.log('[Socket] Task updated:', data);
      const task = data.task || data;
      if (window.__TF__.board) {
        window.__TF__.board.kanban.updateTask(task);
      }
      // Update modal if it's open
      if (window.__TF__.taskModal && window.__TF__.taskModal.currentTaskId === task._id) {
        window.__TF__.taskModal.currentTask = task;
        window.__TF__.taskModal.renderTask(task);
      }

      // Show toast if status changed and not by me
      // Note: we might want more complex logic here, but for now simple info toast
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (data.performerId && currentUser._id && data.performerId !== currentUser._id) {
        this.showNotification({
          title: 'Cập nhật công việc',
          message: `Công việc "${task.title}" vừa được cập nhật`,
          type: 'info'
        });
      }
    });

    this.socket.on('taskDeleted', (data) => {
      console.log('[Socket] Task deleted:', data);
      if (window.__TF__.board) {
        window.__TF__.board.kanban.removeTask(data.taskId);
      }

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (data.performerId && currentUser._id && data.performerId !== currentUser._id) {
        this.showNotification({
          title: 'Xóa công việc',
          message: 'Một công việc vừa được xóa khỏi dự án',
          type: 'warning'
        });
      }
    });

    this.socket.on('taskStatusChanged', (data) => {
      console.log('[Socket] Task status changed:', data);
      const task = data.task || data;
      if (window.__TF__.board) {
        const updatedTask = {
          ...task,
          status: data.newStatus
        };
        window.__TF__.board.kanban.updateTask(updatedTask);
      }

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (data.performerId && currentUser._id && data.performerId !== currentUser._id) {
        this.showNotification({
          title: 'Trạng thái thay đổi',
          message: `Công việc "${task.title}" đã chuyển sang "${data.newStatus}"`,
          type: 'info'
        });
      }
    });

    /**
     * Comment events
     */
    this.socket.on('commentCreated', (data) => {
      console.log('[Socket] Comment created:', data);
      const comment = data.comment || data;
      
      // Skip if this comment was created by the current user
      // (already added locally by commentBox.addComment)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const authorId = comment.author?._id || comment.author;
      if (currentUser._id && authorId && currentUser._id.toString() === authorId.toString()) {
        console.log('[Socket] Skipping own comment');
        return;
      }
      
      if (window.__TF__.taskModal) {
        window.__TF__.taskModal.addComment(comment);
        
        // Show toast if not by me
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const authorId = comment.author?._id || comment.author;
        if (currentUser._id && authorId && currentUser._id.toString() !== authorId.toString()) {
          this.showNotification({
            title: 'Bình luận mới',
            message: `${comment.author?.name || 'Ai đó'} vừa bình luận trong một công việc`,
            type: 'info'
          });
        }
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

    this.socket.on('newNotification', (data) => {
      console.log('[Socket] newNotification received:', data);
      
      // Notify components like notificationBox
      window.dispatchEvent(new CustomEvent('new-notification-app', { detail: data }));
      
      // Show toast
      const senderName = data.sender ? data.sender.name : 'Hệ thống';
      this.showNotification({
        title: 'Thông báo',
        message: `${senderName} ${data.content}`,
        type: 'info'
      });
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
      if (window.__TF__.board) {
        window.__TF__.board.loadProjectDetails();
      }
      
      this.showNotification({
        title: 'Thành viên mới',
        message: `${data.name} vừa tham gia vào dự án`,
        type: 'success'
      });
    });

    this.socket.on('memberLeft', (data) => {
      console.log('[Socket] Member left:', data);
      // Update member list
      if (window.__TF__.board) {
        window.__TF__.board.loadProjectDetails();
      }

      this.showNotification({
        title: 'Thành viên rời đi',
        message: 'Một thành viên vừa rời khỏi dự án',
        type: 'info'
      });
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
   * Hiển thị toast notification (dùng Toast component có sẵn)
   */
  showNotification(notification) {
    const Toast = window.__TF__?.Toast;
    const message = notification.title
      ? `${notification.title}: ${notification.message}`
      : notification.message;

    if (Toast) {
      // Dùng Toast component chính thức của dự án
      const type = notification.type || 'info';
      Toast.create(message, { type, duration: 5000 });
    } else {
      // Fallback nếu Toast chưa load
      console.log(`[Notification] ${message}`);
    }
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
