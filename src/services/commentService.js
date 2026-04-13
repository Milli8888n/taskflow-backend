const { getIO } = require('../config/socket');
const Comment = require('../models/commentModel');
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
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