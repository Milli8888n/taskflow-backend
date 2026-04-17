/**
 * Comment Box Component
 * Module bình luận - Render danh sách comments & form thêm mới
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../api/apiClient.js';

export class CommentBox {
  constructor(projectId = null, taskId = null) {
    this.projectId = projectId;
    this.taskId = taskId;
    this.containerEl = document.getElementById('task-comments-container') || document.querySelector('[data-comments-container]');
    this.formEl = document.getElementById('task-comments-form');
    this.inputEl = document.getElementById('task-comments-input');
    this.countEl = document.getElementById('task-comments-count');
    this.errorEl = document.getElementById('task-comments-error');
    this.comments = [];

    this.attachEventListeners();
  }

  attachEventListeners() {
    if (this.formEl) {
      this.formEl.addEventListener('submit', async (event) => {
        event.preventDefault();
        this.clearError();

        const content = this.inputEl?.value?.trim();
        if (!content) {
          return this.showError('Nội dung bình luận không được để trống.');
        }

        try {
          await this.addComment(content);
          this.inputEl.value = '';
        } catch (error) {
          this.showError(error.message || 'Không thể thêm bình luận.');
        }
      });
    }

    if (this.containerEl) {
      this.containerEl.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const commentId = button.dataset.commentId;

        if (action === 'delete') {
          this.deleteComment(commentId).catch((error) => {
            this.showError(error.message || 'Không thể xoá bình luận.');
          });
        }

        if (action === 'edit') {
          this.startEditComment(commentId);
        }
      });
    }
  }

  setTask(projectId, taskId) {
    this.projectId = projectId;
    this.taskId = taskId;
    this.comments = [];
    this.clearError();
    this.render([]);
  }

  async loadComments() {
    if (!this.projectId || !this.taskId) return;

    try {
      const response = await apiGet(`/projects/${this.projectId}/tasks/${this.taskId}/comments`);
      const comments = response.data?.comments || response.comments || [];
      this.comments = comments;
      this.render(this.comments);
      return this.comments;
    } catch (error) {
      this.showError(error.message || 'Không thể tải bình luận.');
      console.error('Error loading comments:', error);
      throw error;
    }
  }

  render(comments) {
    if (!this.containerEl) return;

    this.comments = comments || [];
    this.containerEl.innerHTML = '';

    if (this.countEl) {
      this.countEl.textContent = `${this.comments.length} bình luận`;
    }

    if (this.comments.length === 0) {
      this.containerEl.innerHTML = `
        <div class="text-center py-8 text-on-surface-variant">
          <p class="text-sm">Chưa có bình luận nào</p>
        </div>
      `;
      return;
    }

    this.comments.forEach((comment) => {
      const commentEl = this.createCommentElement(comment);
      this.containerEl.appendChild(commentEl);
    });
  }

  createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'flex gap-4 pb-4 border-b border-outline-variant/10 last:border-0';
    div.dataset.commentId = comment._id;

    const author = comment.author || {};
    const timeago = this.getTimeAgo(new Date(comment.createdAt));
    const currentUserId = this.getCurrentUserId();
    const canManage = author._id && currentUserId && author._id.toString() === currentUserId.toString();

    div.innerHTML = `
      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold">
        ${author.name ? author.name.charAt(0).toUpperCase() : 'U'}
      </div>
      <div class="flex-1">
        <div class="flex items-start justify-between mb-1 gap-4">
          <div>
            <p class="text-sm font-semibold text-on-surface">${author.name || 'Anonymous'}</p>
            <span class="text-xs text-on-surface-variant">${timeago}</span>
          </div>
          ${canManage ? `
            <div class="flex items-center gap-2">
              <button type="button" class="text-xs text-primary hover:underline" data-action="edit" data-comment-id="${comment._id}">Chỉnh sửa</button>
              <button type="button" class="text-xs text-error hover:underline" data-action="delete" data-comment-id="${comment._id}">Xoá</button>
            </div>
          ` : ''}
        </div>
        <p class="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">${this.escapeHtml(comment.content)}</p>
      </div>
    `;

    return div;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async addComment(content) {
    if (!this.projectId || !this.taskId) {
      throw new Error('Task chưa được xác định');
    }

    const response = await apiPost(
      `/projects/${this.projectId}/tasks/${this.taskId}/comments`,
      { content }
    );
    const newComment = response.data?.comment || response.comment || response;
    this.comments.unshift(newComment);
    this.render(this.comments);
    return newComment;
  }

  async updateComment(commentId, content) {
    if (!this.projectId || !this.taskId) {
      throw new Error('Task chưa được xác định');
    }

    const response = await apiPatch(
      `/projects/${this.projectId}/tasks/${this.taskId}/comments/${commentId}`,
      { content }
    );

    const updatedComment = response.data?.comment || response.comment || response;
    this.comments = this.comments.map((comment) =>
      comment._id === commentId ? updatedComment : comment
    );
    this.render(this.comments);
    return updatedComment;
  }

  async deleteComment(commentId) {
    if (!this.projectId || !this.taskId) {
      throw new Error('Task chưa được xác định');
    }

    await apiDelete(
      `/projects/${this.projectId}/tasks/${this.taskId}/comments/${commentId}`
    );

    this.comments = this.comments.filter((comment) => comment._id !== commentId);
    this.render(this.comments);
  }

  async startEditComment(commentId) {
    const comment = this.comments.find((item) => item._id === commentId);
    if (!comment) return;

    const newContent = window.prompt('Chỉnh sửa bình luận', comment.content);
    if (newContent === null) return;

    const trimmed = newContent.trim();
    if (!trimmed) {
      return this.showError('Nội dung bình luận không được để trống.');
    }

    try {
      await this.updateComment(commentId, trimmed);
    } catch (error) {
      this.showError(error.message || 'Không thể cập nhật bình luận.');
    }
  }

  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user._id || user.id || null;
    } catch {
      return null;
    }
  }

  showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('hidden');
  }

  clearError() {
    if (!this.errorEl) return;
    this.errorEl.textContent = '';
    this.errorEl.classList.add('hidden');
  }

  getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
}

export default CommentBox;
