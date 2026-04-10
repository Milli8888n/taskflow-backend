const commentRoutes = require('./commentRoutes');
const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const checkProjectMembership = require('../middlewares/checkProjectMembership');

router.use(protect);
router.use(checkProjectMembership);

router.route('/')
  .get(taskController.getProjectTasks)
  .post(taskController.createTask);

router.route('/:taskId')
  .get(taskController.getTask)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

// Nested comment routes (gắn ở S2-13)

router.use('/:taskId/comments', commentRoutes);

module.exports = router;