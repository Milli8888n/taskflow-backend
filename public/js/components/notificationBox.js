import { apiGet, apiPatch } from '../api/apiClient.js';

export class NotificationBox {
  constructor() {
    this.container = document.getElementById('notification-list');
    this.badge = document.getElementById('notification-badge');
    this.markAllBtn = document.getElementById('mark-all-read-btn');
    this.notifications = [];
    this.unreadCount = 0;
  }

  async init() {
    if (!this.container) return;
    
    await this.loadNotifications();
    this.bindEvents();
    this.setupSocket();
  }

  async loadNotifications() {
    try {
      const res = await apiGet('/notifications');
      if (res.data) {
        this.notifications = res.data.notifications || [];
        this.unreadCount = res.data.unreadCount || 0;
        this.render();
      }
    } catch (error) {
      console.error('Lỗi tải thông báo:', error);
    }
  }

  bindEvents() {
    if (this.markAllBtn) {
      this.markAllBtn.addEventListener('click', async () => {
        try {
          await apiPatch('/notifications/mark-all-read');
          this.notifications.forEach(n => n.isRead = true);
          this.unreadCount = 0;
          this.render();
        } catch (error) {
          console.error('Lỗi đánh dấu đã đọc:', error);
        }
      });
    }

    this.container.addEventListener('click', async (e) => {
      const item = e.target.closest('.notification-item');
      if (!item) return;

      const id = item.dataset.id;
      const notif = this.notifications.find(n => n._id === id);
      
      if (notif && !notif.isRead) {
        try {
          await apiPatch(`/notifications/${id}/read`);
          notif.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.render();
        } catch (error) {
          console.error('Lỗi mark item read:', error);
        }
      }

      if (notif && notif.link) {
        window.location.href = notif.link;
      }
    });
  }

  setupSocket() {
    window.addEventListener('new-notification-app', (e) => {
      const notif = e.detail;
      if (!notif) return;
      
      this.notifications.unshift(notif);
      this.unreadCount += 1;
      // Giữ tối đa 20 cái
      if (this.notifications.length > 20) this.notifications.pop();
      this.render();
    });
  }

  render() {
    if (!this.container) return;

    // Render Badge
    if (this.badge) {
      if (this.unreadCount > 0) {
        this.badge.style.display = 'block';
        // Có thể thay đổi CSS để hiện số nếu cần
      } else {
        this.badge.style.display = 'none';
      }
    }

    // Render List
    if (this.notifications.length === 0) {
      this.container.innerHTML = `
        <div class="px-5 py-8 text-center opacity-50">
          <span class="material-symbols-outlined text-3xl mb-2">notifications_off</span>
          <p class="text-xs font-medium">Không có thông báo nào</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = this.notifications.map(n => this.renderItem(n)).join('');
  }

  renderItem(notif) {
    const isUnread = !notif.isRead;
    const timeString = new Date(notif.createdAt).toLocaleString('vi-VN');
    
    let icon = 'update';
    let iconColor = 'text-on-surface-variant';
    let iconBg = 'bg-outline-variant/10';

    if (notif.type === 'COMMENT') {
      icon = 'chat_bubble';
      iconColor = 'text-primary';
      iconBg = 'bg-primary/10';
    } else if (notif.type === 'TASK_UPDATE') {
      icon = 'task_alt';
      iconColor = 'text-tertiary';
      iconBg = 'bg-tertiary-container/20';
    }

    const senderName = notif.sender ? notif.sender.name : 'Hệ thống';

    return `
      <div class="notification-item px-5 py-3.5 flex gap-3 hover:bg-surface-container-high/30 transition-all cursor-pointer ${isUnread ? 'border-b border-outline-variant/5 hover:opacity-100' : 'opacity-60 hover:opacity-100'}" data-id="${notif._id}">
          <div class="flex-shrink-0 w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}">
              <span class="material-symbols-outlined text-lg">${icon}</span>
          </div>
          <div class="flex-1 min-w-0">
              <p class="text-xs text-on-surface leading-snug">
                  <span class="font-black">${senderName}</span> ${notif.content}
              </p>
              <span class="text-[9px] font-bold text-on-surface-variant/40 mt-1 inline-block uppercase tracking-widest">${timeString}</span>
          </div>
          ${isUnread ? '<div class="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>' : ''}
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const notifBox = new NotificationBox();
  await notifBox.init();
});
