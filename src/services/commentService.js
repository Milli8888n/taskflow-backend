const { getIO } = require('../config/socket');
const Comment = require('../models/commentModel');
const Task = require('../models/taskModel');
const AppError = require('../utils/AppError');

exports.addComment = async (taskId, content, userId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false });
  if (!task) throw new AppError('Không tìm thấy công việc', 404);

  const comment = await Comment.create({ taskId, author: userId, content });
  const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar');
  const io = getIO();
  if (io) {
    io.to(`project:${task.projectId}`).emit('commentCreated', populatedComment);
  }
  return populatedComment;
};

exports.getCommentsByTask = async (taskId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false });
  if (!task) throw new AppError('Không tìm thấy công việc', 404);

  const comments = await Comment.find({ taskId })
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });
  return comments;
};

exports.updateComment = async (taskId, commentId, content, userId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false });
  if (!task) throw new AppError('Không tìm thấy công việc', 404);

  const comment = await Comment.findById(commentId);
  if (!comment || comment.taskId.toString() !== taskId.toString()) {
    throw new AppError('Không tìm thấy bình luận', 404);
  }

  if (comment.author.toString() !== userId.toString()) {
    throw new AppError('Không có quyền sửa bình luận', 403);
  }

  comment.content = content;
  await comment.save();

  const populatedComment = await Comment.findById(commentId).populate('author', 'name avatar');
  const io = getIO();
  if (io) {
    io.to(`project:${task.projectId}`).emit('commentUpdated', populatedComment);
  }

  return populatedComment;
};

exports.deleteComment = async (taskId, commentId, userId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false });
  if (!task) throw new AppError('Không tìm thấy công việc', 404);

  const comment = await Comment.findById(commentId);
  if (!comment || comment.taskId.toString() !== taskId.toString()) {
    throw new AppError('Không tìm thấy bình luận', 404);
  }

  if (comment.author.toString() !== userId.toString()) {
    throw new AppError('Không có quyền xoá bình luận', 403);
  }

  await comment.remove();
  const io = getIO();
  if (io) {
    io.to(`project:${task.projectId}`).emit('commentDeleted', {
      commentId,
      taskId
    });
  }
};