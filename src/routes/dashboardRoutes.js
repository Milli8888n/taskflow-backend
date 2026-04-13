const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả operations của Dashboard đều yêu cầu đăng nhập
router.use(protect);

router.route('/stats').get(getDashboardStats);

module.exports = router;
