const { getIO } = require('../config/socket');
const Task = require('../models/taskModel');
const AppError = require('../utils/AppError');

exports.createTask = async (projectId, taskData, userId) => {
  const task = await Task.create({
    ...taskData,
    projectId: projectId
  });
  const io = getIO();
  if (io) {
    io.to(`project:${projectId}`).emit('taskCreated', task);
    
    if (task.assignee) {
      io.to(`user:${task.assignee.toString()}`).emit('taskAssigned', task);
    }
  }
  return task;
};

exports.getProjectTasks = async (projectId, queryParams = {}) => {
  const filter = { projectId, isDeleted: false };

  if (queryParams.status) filter.status = queryParams.status;
  if (queryParams.priority) filter.priority = queryParams.priority;
  if (queryParams.assignee) filter.assignee = queryParams.assignee;
  if (queryParams.q) {
    filter.$or = [
      { title: { $regex: queryParams.q, $options: 'i' } },
      { description: { $regex: queryParams.q, $options: 'i' } }
    ];
  }

  const tasks = await Task.find(filter)
    .populate('assignee', 'name avatar')
    .sort({ createdAt: -1 });
  return tasks;
};

exports.getTaskById = async (taskId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false })
    .populate('assignee', 'name avatar');
  if (!task) throw new AppError('Không tìm thấy công việc', 404);
  return task;
};

exports.updateTask = async (taskId, updateData) => {
  const allowedFields = ['title', 'description', 'status', 'priority', 'assignee', 'deadline'];
  const filtered = {};
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) filtered[field] = updateData[field];
  });

  const task = await Task.findOneAndUpdate(
    { _id: taskId, isDeleted: false },
    filtered,
    { new: true, runValidators: true }
  ).populate('assignee', 'name avatar');

  if (!task) throw new AppError('Không tìm thấy công việc', 404);
  const io = getIO();
  if (io) {
    io.to(`project:${task.projectId}`).emit('taskUpdated', task);
    
    // Nếu có sự thay đổi về người được Assign (updateData.assignee có và mới) thì báo cho họ
    if (updateData.assignee) {
      io.to(`user:${updateData.assignee.toString()}`).emit('taskAssigned', task);
    }
  }
  
  return task;
};

exports.deleteTask = async (taskId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!task) throw new AppError('Không tìm thấy công việc', 404);
  return { message: 'Đã xóa công việc' };
};