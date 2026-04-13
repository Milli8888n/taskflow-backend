const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const checkProjectMembership = require('../middlewares/checkProjectMembership');
const commentRoutes = require('./commentRoutes');
const { uploadTaskFile } = require('../middlewares/uploadMiddleware');

router.use(protect);
router.use(checkProjectMembership);

// Route upload file cho task
router.post('/:id/upload', uploadTaskFile, taskController.uploadAttachment);

router.route('/')
  .get(taskController.getProjectTasks)
  .post(taskController.createTask);

router.route('/:taskId')
  .get(taskController.getTask)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

// Nested comment routes
router.use('/:taskId/comments', commentRoutes);

module.exports = router;