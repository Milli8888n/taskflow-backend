const dashboardService = require('../services/dashboardService');
const AppError = require('../utils/AppError');

/**
 * Lấy số liệu Dashboard cho current_user
 * @route GET /api/v1/dashboard/stats
 * @access Private
 */
exports.getDashboardStats = async (req, res, next) => {
    try {
        // Gọi service
        const dashboardData = await dashboardService.getDashboardStats(req.user.id);
        
        // Trả về JSON như design trong deep dive
        res.status(200).json({
            status: 'success',
            data: {
                stats: dashboardData
            }
        });
    } catch (error) {
        next(error);
    }
};
