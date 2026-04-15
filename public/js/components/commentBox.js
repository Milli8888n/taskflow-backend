/**
 * Comment Box Component
 * Module bình luận - Render danh sách comments & form thêm mới
 */

import { apiPost, apiDelete } from '../api/apiClient.js';

export class CommentBox {
  constructor(projectId, taskId) {
    this.projectId = projectId;
    this.taskId = taskId;
    this.containerEl = document.getElementById('task-comments-container') || 
                       document.querySelector('[data-comments-container]');
    this.comments = [];
  }

  /**
   * Render danh sách comments
   */
  render(comments) {
    if (!this.containerEl) return;
    
    this.comments = comments || [];
    this.containerEl.innerHTML = '';

    if (this.comments.length === 0) {
      this.containerEl.innerHTML = `
        <div class="text-center py-8 text-on-surface-variant">
          <p class="text-sm">Chưa có bình luận nào</p>
        </div>
      `;
      return;
    }

    this.comments.forEach(comment => {
      const commentEl = this.createCommentElement(comment);
      this.containerEl.appendChild(commentEl);
    });
  }

  /**
   * Tạo HTML element cho một comment
   */
  createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'flex gap-4 pb-4 border-b border-outline-variant/10 last:border-0';
    div.dataset.commentId = comment._id;

    const author = comment.author || {};
    const timeago = this.getTimeAgo(new Date(comment.createdAt));

    div.innerHTML = `
      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold">
        ${author.name ? author.name.charAt(0).toUpperCase() : 'U'}
      </div>
      <div class="flex-1">
        <div class="flex items-start justify-between mb-1">
          <p class="text-sm font-semibold text-on-surface">${author.name || 'Anonymous'}</p>
          <span class="text-xs text-on-surface-variant">${timeago}</span>
        </div>
        <p class="text-sm text-on-surface-variant leading-relaxed">${comment.text}</p>
        <button class="text-xs text-error hover:underline mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onclick="window.__TF__.deleteComment('${this.projectId}', '${this.taskId}', '${comment._id}')">
          Xoá
        </button>
      </div>
    `;

    return div;
  }

  /**
   * Thêm comment mới
   */
  async addComment(text) {
    try {
      const response = await apiPost(
        `/projects/${this.projectId}/tasks/${this.taskId}/comments`,
        { text }
      );
      
      const newComment = response.comment || response;
      this.comments.unshift(newComment);
      this.render(this.comments);
      
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Xoá comment
   */
  async deleteComment(commentId) {
    try {
      await apiDelete(
        `/projects/${this.projectId}/tasks/${this.taskId}/comments/${commentId}`
      );
      
      this.comments = this.comments.filter(c => c._id !== commentId);
      this.render(this.comments);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Tính thời gian từ lúc tạo
   */
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
