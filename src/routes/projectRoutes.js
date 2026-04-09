const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const checkProjectMembership = require('../middlewares/checkProjectMembership');
const restrictToOwner = require('../middlewares/restrictToOwner');

// Tất cả route dưới đây đều cần đăng nhập
router.use(protect);

// Tạo project + Lấy danh sách project của tôi
router.route('/')
  .get(projectController.getMyProjects)
  .post(projectController.createProject);

// Chi tiết + Cập nhật + Xóa (cần là member, cập nhật/xóa cần là owner)
router.route('/:projectId')
  .get(checkProjectMembership, projectController.getProject)
  .put(checkProjectMembership, restrictToOwner, projectController.updateProject)
  .delete(checkProjectMembership, restrictToOwner, projectController.deleteProject);

// Quản lý thành viên
router.get('/:projectId/members', checkProjectMembership, projectController.getMembers);
router.post('/:projectId/members', checkProjectMembership, restrictToOwner, projectController.addMember);
router.delete('/:projectId/members/:memberId', checkProjectMembership, restrictToOwner, projectController.removeMember);

// Nested route: Tasks thuộc project (sẽ gắn ở S2-10)

module.exports = router;