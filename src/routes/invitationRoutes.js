const express = require('express');
const invitationController = require('../controllers/invitationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(invitationController.getMyInvitations);

router.route('/:projectId')
  .post(invitationController.sendInvitation);

router.route('/:id/respond')
  .patch(invitationController.respondToInvitation);

module.exports = router;
