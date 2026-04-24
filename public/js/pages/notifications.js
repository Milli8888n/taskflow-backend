import { apiGet, apiPatch } from '../api/apiClient.js';
import { formatRelativeTime } from '../utils/formatDate.js';

class NotificationsPage {
    constructor() {
        this.listEl = document.getElementById('notifications-list');
        this.markAllBtn = document.getElementById('mark-all-btn');
        this.notifications = [];
        this.isLoading = false;

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadNotifications();
        
        // Lắng nghe event realtime (được phát ra từ websocket chung ở layout)
        window.addEventListener('new-notification-app', () => {
            this.loadNotifications();
        });
    }

    bindEvents() {
        if (this.markAllBtn) {
            this.markAllBtn.addEventListener('click', () => this.markAllAsRead());
        }
    }

    async loadNotifications() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const data = await apiGet('/notifications');
            if (data?.status === 'success') {
                this.notifications = data.data.notifications;
                this.render();
            }
        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
            this.renderError();
        } finally {
            this.isLoading = false;
        }
    }

    async markAsRead(id) {
        try {
            await apiPatch(`/notifications/${id}/read`);
            // Cập nhật local data
            const index = this.notifications.findIndex(n => n._id === id);
            if (index !== -1 && !this.notifications[index].isRead) {
                this.notifications[index].isRead = true;
                this.render();
                // Báo cho UI trên navbar update
                window.dispatchEvent(new CustomEvent('new-notification-app'));
            }
        } catch (error) {
            console.error("Lỗi khi đọc thông báo:", error);
        }
    }

    async markAllAsRead() {
        try {
            await apiPatch('/notifications/mark-all-read');
            this.notifications.forEach(n => n.isRead = true);
            this.render();
            window.dispatchEvent(new CustomEvent('new-notification-app'));
        } catch (error) {
            console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
        }
    }

    getIconForType(type) {
        switch (type) {
            case 'ASSIGN':
                return 'person_add';
            case 'STATUS_CHANGE':
                return 'sync_alt';
            case 'COMMENT':
                return 'chat_bubble';
            default:
                return 'notifications';
        }
    }

    render() {
        if (!this.listEl) return;

        if (this.notifications.length === 0) {
            this.listEl.innerHTML = `
                <div class="text-center py-24">
                    <span class="material-symbols-outlined text-6xl text-outline/20">notifications_off</span>
                    <p class="text-on-surface-variant font-bold mt-4 opacity-40">Không có thông báo mới.</p>
                </div>
            `;
            return;
        }

        const html = this.notifications.map(notif => {
            const isRead = notif.isRead;
            const icon = this.getIconForType(notif.type);
            const timeStr = formatRelativeTime(notif.createdAt);
            const name = notif.sender?.name || 'Hệ thống';
            const link = notif.link || '#';

            return `
                <div class="notification-item flex gap-4 p-5 glass-panel rounded-2xl hover:border-primary/30 transition-all cursor-pointer group ${isRead ? 'opacity-70' : 'bg-primary/5'}" data-id="${notif._id}" data-link="${link}">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isRead ? 'bg-surface-variant text-on-surface-variant' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary'}">
                        <span class="material-symbols-outlined text-xl">${icon}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-on-surface leading-snug"><span class="font-black">${name}</span> — ${notif.content}</p>
                        <span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mt-1.5 inline-block">${timeStr}</span>
                    </div>
                    ${!isRead ? `<div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>` : ''}
                </div>
            `;
        }).join('');

        this.listEl.innerHTML = html;

        // Gắn sự kiện click
        const items = this.listEl.querySelectorAll('.notification-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const id = item.dataset.id;
                const link = item.dataset.link;
                
                // Đánh dấu đã đọc trước
                this.markAsRead(id);
                
                // Chuyển hướng
                if (link && link !== '#') {
                    window.location.href = link;
                }
            });
        });
    }

    renderError() {
        if (!this.listEl) return;
        this.listEl.innerHTML = `
            <div class="text-center py-24 text-error">
                <span class="material-symbols-outlined text-4xl">error</span>
                <p class="font-bold mt-2">Không thể tải thông báo</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NotificationsPage();
});
