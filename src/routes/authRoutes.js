const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/v1/auth/register
router.post('/register', authController.register);

// POST /api/v1/auth/login
router.post('/login', authController.login);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// GET /api/v1/auth/me
router.get('/me', protect, authController.getMe);

module.exports = router;
