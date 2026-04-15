/**
 * Profile Page Controller
 * Upload hình Multer thông qua formData
 * Quản lý thông tin cá nhân user
 */

import { apiPostFormData, apiPut } from '../api/apiClient.js';
import { getCurrentUser } from '../services/auth.js';
import Toast from '../components/toastUI.js';

class ProfilePage {
  constructor() {
    this.user = getCurrentUser();
    this.profileForm = document.getElementById('profile-form');
    this.avatarInput = document.getElementById('avatar-input');
    this.avatarPreview = document.getElementById('avatar-preview');
    
    this.init();
  }

  init() {
    this.renderUserInfo();
    this.setupEventListeners();
    console.log('✓ Profile page initialized');
  }

  /**
   * Render thông tin user
   */
  renderUserInfo() {
    if (!this.user) {
      window.location.href = '/login';
      return;
    }

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const bioInput = document.getElementById('profile-bio');

    if (nameInput) nameInput.value = this.user.name || '';
    if (emailInput) emailInput.value = this.user.email || '';
    if (bioInput) bioInput.value = this.user.bio || '';

    // Load avatar
    if (this.user.avatar && this.avatarPreview) {
      this.avatarPreview.src = this.user.avatar;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Avatar upload
    if (this.avatarInput) {
      this.avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));
    }

    // Profile form submit
    if (this.profileForm) {
      this.profileForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  /**
   * Xử lý thay đổi avatar
   */
  handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    if (this.avatarPreview) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.avatarPreview.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }

    // Store file for upload
    this.selectedFile = file;
  }

  /**
   * Xử lý form submit
   */
  async handleSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('profile-name')?.value.trim();
    const bio = document.getElementById('profile-bio')?.value.trim();

    if (!name) {
      Toast.error('Vui lòng nhập họ tên');
      return;
    }

    const submitBtn = this.profileForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      // If user selected a new avatar, upload it first
      if (this.selectedFile) {
        await this.uploadAvatar();
      }

      // Update profile info
      await this.updateProfile({ name, bio });

      Toast.success('Cập nhật hồ sơ thành công!');
      
      // Redirect back
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error) {
      Toast.error('Lỗi: ' + error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  /**
   * Upload avatar
   */
  async uploadAvatar() {
    const formData = new FormData();
    formData.append('avatar', this.selectedFile);

    try {
      const response = await apiPostFormData('/users/me/avatar', formData);
      this.user.avatar = response.avatar;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.selectedFile = null;
    } catch (error) {
      throw new Error('Lỗi upload avatar: ' + error.message);
    }
  }

  /**
   * Update profile info
   */
  async updateProfile(data) {
    try {
      const response = await apiPut('/users/me', data);
      const updatedUser = response.user || response;
      
      // Update localStorage
      this.user = { ...this.user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(this.user));
    } catch (error) {
      throw error;
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const profile = new ProfilePage();
  window.__TF__ = window.__TF__ || {};
  window.__TF__.profile = profile;
});

console.log('✓ Profile page controller loaded');
