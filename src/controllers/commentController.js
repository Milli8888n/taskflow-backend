const commentService = require('../services/commentService');

exports.addComment = async (req, res, next) => {
  try {
    const comment = await commentService.addComment(
      req.params.taskId, req.body.content, req.user._id
    );
    res.status(201).json({ status: 'success', data: { comment } });
  } catch (error) { next(error); }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsByTask(req.params.taskId);
    res.status(200).json({ status: 'success', results: comments.length, data: { comments } });
  } catch (error) { next(error); }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(
      req.params.taskId,
      req.params.commentId,
      req.body.content,
      req.user._id
    );

    res.status(200).json({ status: 'success', data: { comment } });
  } catch (error) { next(error); }
};

exports.deleteComment = async (req, res, next) => {
  try {
    await commentService.deleteComment(
      req.params.taskId,
      req.params.commentId,
      req.user._id
    );

    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};