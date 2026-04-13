const express = require('express');
const router = express.Router();

// ===== Trang công khai (không cần đăng nhập) =====
router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Đăng Nhập - TaskFlow' });
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Đăng Ký - TaskFlow' });
});

// ===== Trang yêu cầu đăng nhập (truyền user nếu có) =====
// Lưu ý: Nếu đã có middleware xác thực, thêm `protect` trước callback.
// Ví dụ: router.get('/dashboard', protect, (req, res) => {...})

router.get('/dashboard', (req, res) => {
  res.render('dashboard/index', {
    title: 'Dashboard - TaskFlow',
    activePage: 'dashboard',
    user: req.user || null
  });
});

router.get('/projects', (req, res) => {
  res.render('projects/index', {
    title: 'Dự án - TaskFlow',
    activePage: 'projects',
    user: req.user || null
  });
});

router.get('/projects/:id/board', (req, res) => {
  res.render('projects/board', {
    title: 'Board - TaskFlow',
    activePage: 'projects',
    user: req.user || null,
    projectId: req.params.id
  });
});

router.get('/profile', (req, res) => {
  res.render('profile/index', {
    title: 'Hồ sơ - TaskFlow',
    activePage: 'profile',
    user: req.user || null
  });
});

router.get('/settings', (req, res) => {
  res.render('settings/index', {
    title: 'Cài đặt - TaskFlow',
    activePage: 'settings',
    user: req.user || null
  });
});

router.get('/notifications', (req, res) => {
  res.render('notifications/index', {
    title: 'Thông báo - TaskFlow',
    activePage: 'notifications',
    user: req.user || null
  });
});

// ===== Trang lỗi 404 =====
router.get('/404', (req, res) => {
  res.status(404).render('errors/404', { title: '404 - TaskFlow' });
});

module.exports = router;