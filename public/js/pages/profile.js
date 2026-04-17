import { apiGet, apiPost, apiPostFormData, apiPut } from '../api/apiClient.js';

class ProfilePage {
  constructor() {
    this.profileForm = document.getElementById('profile-form');
    this.passwordForm = document.getElementById('password-form');
    this.avatarInput = document.getElementById('avatar-input');
    this.avatarPreview = document.getElementById('avatar-preview');
    this.nameInput = document.getElementById('profile-name');
    this.emailInput = document.getElementById('profile-email');
    this.displayName = document.getElementById('profile-display-name');
    this.displayEmail = document.getElementById('profile-display-email');
    this.user = null;
  }

  async init() {
    await this.loadProfile();
    this.bindEvents();
  }

  bindEvents() {
    this.profileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updateProfile();
    });

    this.avatarInput?.addEventListener('change', async () => {
      if (this.avatarInput.files?.[0]) {
        await this.uploadAvatar();
      }
    });

    this.passwordForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.changePassword();
    });
  }

  async loadProfile() {
    const res = await apiGet('/users/profile');
    const user = res?.data?.user;
    if (!user) return;

    this.user = user;
    if (this.nameInput) this.nameInput.value = user.name || '';
    if (this.emailInput) this.emailInput.value = user.email || '';
    if (this.displayName) this.displayName.textContent = user.name || 'Người dùng';
    if (this.displayEmail) this.displayEmail.textContent = user.email || '';
    if (this.avatarPreview) {
      this.avatarPreview.src = user.avatar || '/images/default-avatar.png';
    }
  }

  async updateProfile() {
    const name = this.nameInput?.value?.trim();
    if (!name) {
      alert('Vui lòng nhập họ tên');
      return;
    }

    const res = await apiPut('/users/profile', { name });
    this.user = res?.data?.user || this.user;
    if (this.user) {
      localStorage.setItem('user', JSON.stringify(this.user));
      if (this.displayName) this.displayName.textContent = this.user.name || 'Người dùng';
    }
    alert('Cập nhật hồ sơ thành công');
  }

  async uploadAvatar() {
    const file = this.avatarInput?.files?.[0];
    if (!file) return;

    // Preview trước khi upload
    if (this.avatarPreview) {
      this.avatarPreview.src = URL.createObjectURL(file);
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const res = await apiPostFormData('/users/avatar', formData);
    const user = res?.data?.user;
    if (user) {
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
      if (this.avatarPreview) this.avatarPreview.src = user.avatar || this.avatarPreview.src;
    }
    alert('Cập nhật avatar thành công');
  }

  async changePassword() {
    const currentPassword = document.getElementById('current-password')?.value?.trim();
    const newPassword = document.getElementById('new-password')?.value?.trim();

    if (!currentPassword || !newPassword) {
      alert('Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }

    await apiPut('/auth/change-password', { currentPassword, newPassword });
    alert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const profile = new ProfilePage();
  await profile.init();
});
