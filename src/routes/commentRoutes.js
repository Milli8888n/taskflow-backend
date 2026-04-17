const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(commentController.getComments)
  .post(commentController.addComment);

router.route('/:commentId')
  .patch(commentController.updateComment)
  .delete(commentController.deleteComment);

module.exports = router;