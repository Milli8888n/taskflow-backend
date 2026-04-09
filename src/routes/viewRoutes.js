const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Đăng Nhập - TaskFlow' });
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Đăng Ký - TaskFlow' });
});

router.get('/project', (req, res) => {
  res.render('project/index', { title: 'Project - TaskFlow' });
});

module.exports = router;