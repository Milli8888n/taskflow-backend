/**
 * Login Page Controller
 * - Lắng nghe form submit
 * - Gọi auth.login()
 * - Lưu token vào localStorage & chuyển hướng
 */

import { login } from '../services/auth.js';

const loginForm = document.getElementById('login-form');
const errorDiv = document.querySelector('[data-error-message]') || 
                document.querySelector('.text-error') ||
                (() => {
                  const div = document.createElement('div');
                  div.className = 'text-error p-3 rounded-lg hidden';
                  loginForm?.insertAdjacentElement('beforebegin', div);
                  return div;
                })();

function showError(message) {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }
}

function hideError() {
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showError('Vui lòng nhập email và mật khẩu');
      return;
    }

    // Vô hiệu hoá button submit trong quá trình request
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const result = await login({ email, password });
      
      if (result?.accessToken) {
        console.log('✓ Đăng nhập thành công, token:', result.accessToken);
        // Chuyển hướng ngay (không cần delay)
        window.location.href = '/dashboard';
      } else {
        showError('Lỗi: Không nhận được token từ server');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || 'Lỗi đăng nhập. Vui lòng thử lại.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

console.log('✓ Login page controller loaded');
