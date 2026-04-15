/**
 * Register Page Controller
 * - Lắng nghe form submit
 * - Gọi auth.register()
 * - Redirect sang login page
 */

import { register } from '../services/auth.js';

const registerForm = document.getElementById('register-form');
const errorDiv = document.querySelector('[data-error-message]') || 
                document.querySelector('.text-error') ||
                (() => {
                  const div = document.createElement('div');
                  div.className = 'text-error p-3 rounded-lg hidden';
                  registerForm?.insertAdjacentElement('beforebegin', div);
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

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    // Lấy các element form
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Kiểm tra các element tồn tại
    if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
      showError('Lỗi: Không tìm thấy các trường form. Vui lòng tải lại trang.');
      console.error('Missing form elements', { nameInput, emailInput, passwordInput, confirmPasswordInput });
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (!name || !email || !password) {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      showError('Mật khẩu không khớp');
      return;
    }

    if (password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const result = await register({ name, email, password });
      
      if (result.accessToken) {
        // Auto login sau register (optional)
        alert('Đăng ký thành công! Đang chuyển sang trang chủ...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        showError(result.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      if (error.data?.message) {
        showError(error.data.message);
      } else {
        showError(error.message || 'Lỗi đăng ký. Vui lòng thử lại.');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

console.log('✓ Register page controller loaded');
