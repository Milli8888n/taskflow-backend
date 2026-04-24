const invitationService = require('../services/invitationService');

exports.sendInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.sendInvitation(
      req.params.projectId,
      req.body.email,
      req.user._id
    );
    res.status(201).json({ status: 'success', data: { invitation } });
  } catch (error) { next(error); }
};

exports.getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await invitationService.getMyInvitations(req.user._id);
    res.status(200).json({ status: 'success', results: invitations.length, data: { invitations } });
  } catch (error) { next(error); }
};

exports.respondToInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.respondToInvitation(
      req.params.id,
      req.user._id,
      req.body.response // 'accept' or 'decline'
    );
    res.status(200).json({ status: 'success', data: { invitation } });
  } catch (error) { next(error); }
};
