const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Yêu cầu đăng nhập cho tất cả các route bên dưới
router.use(protect);

router.route('/')
  .get(notificationController.getMyNotifications);

router.route('/mark-all-read')
  .patch(notificationController.markAllAsRead);

router.route('/:id/read')
  .patch(notificationController.markAsRead);

module.exports = router;
