const { getIO } = require('../config/socket');
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const Notification = require('../models/notificationModel');
const AppError = require('../utils/AppError');

exports.createTask = async (projectId, taskData, userId) => {
  // Kiểm tra assignee nếu có
  if (taskData.assignee) {
    const project = await Project.findById(projectId);
    if (!project || !project.members.includes(taskData.assignee.toString())) {
      throw new AppError('Người giao việc phải là thành viên trong dự án', 400);
    }
  }

  const task = await Task.create({
    ...taskData,
    projectId: projectId
  });
  // Gán task cho người khác → lưu notification vào DB + emit socket
  if (task.assignee && task.assignee.toString() !== userId.toString()) {
    const notif = await Notification.create({
      user: task.assignee,
      sender: userId,
      type: 'TASK_UPDATE',
      content: `đã gán cho bạn công việc "${task.title}"`,
      link: `/projects/${projectId}`
    });

    const io = getIO();
    if (io) {
      io.to(`user:${task.assignee.toString()}`).emit('taskAssigned', task);
      const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name avatar');
      io.to(`user:${task.assignee.toString()}`).emit('newNotification', populatedNotif);
    }
  }

  const io = getIO();
  if (io) {
    io.to(`project:${projectId}`).emit('taskCreated', {
      task,
      performerId: userId
    });
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
    .populate('assignee', 'name avatar')
    .populate('projectId', 'name');
  if (!task) throw new AppError('Không tìm thấy công việc', 404);
  return task;
};

exports.updateTask = async (taskId, updateData, userId) => {
  const allowedFields = ['title', 'description', 'status', 'priority', 'assignee', 'deadline'];
  const filtered = {};
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) filtered[field] = updateData[field];
  });

  // Lấy task cũ để so sánh status
  const oldTask = await Task.findOne({ _id: taskId, isDeleted: false });
  if (!oldTask) throw new AppError('Không tìm thấy công việc', 404);

  // Kiểm tra assignee mới nếu có
  if (updateData.assignee) {
    const project = await Project.findById(oldTask.projectId);
    if (!project || !project.members.includes(updateData.assignee.toString())) {
      throw new AppError('Người được giao không thuộc dự án này', 400);
    }
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, isDeleted: false },
    filtered,
    { new: true, runValidators: true }
  ).populate('assignee', 'name avatar');

  if (!task) throw new AppError('Không tìm thấy công việc', 404);
  
  const io = getIO();
  
  // Gán lại assignee → lưu notification vào DB + emit socket
  if (updateData.assignee && updateData.assignee.toString() !== userId.toString()) {
    const notif = await Notification.create({
      user: updateData.assignee,
      sender: userId,
      type: 'TASK_UPDATE',
      content: `đã gán cho bạn công việc "${task.title}"`,
      link: `/projects/${task.projectId}`
    });

    if (io) {
      io.to(`user:${updateData.assignee.toString()}`).emit('taskAssigned', task);
      const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name avatar');
      io.to(`user:${updateData.assignee.toString()}`).emit('newNotification', populatedNotif);
    }
  }

  // Status thay đổi → thông báo cho assignee nếu có
  if (updateData.status && oldTask.status !== updateData.status) {
    const targetAssignee = task.assignee?._id || task.assignee;
    if (targetAssignee && targetAssignee.toString() !== userId.toString()) {
      const notif = await Notification.create({
        user: targetAssignee,
        sender: userId,
        type: 'TASK_UPDATE',
        content: `đã chuyển công việc "${task.title}" sang "${updateData.status}"`,
        link: `/projects/${task.projectId}`
      });

      if (io) {
        const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name avatar');
        io.to(`user:${targetAssignee.toString()}`).emit('newNotification', populatedNotif);
      }
    }

    if (io) {
      io.to(`project:${task.projectId}`).emit('taskStatusChanged', {
        task: task,
        newStatus: updateData.status,
        oldStatus: oldTask.status,
        performerId: userId
      });
    }
  }

  if (io) {
    io.to(`project:${task.projectId}`).emit('taskUpdated', { 
      task, 
      performerId: userId 
    });
  }
  return task;
};

exports.deleteTask = async (taskId, userId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!task) throw new AppError('Không tìm thấy công việc', 404);

  const io = getIO();
  if (io) {
    io.to(`project:${task.projectId}`).emit('taskDeleted', {
      taskId: task._id,
      projectId: task.projectId,
      performerId: userId
    });
  }

  return { message: 'Đã xóa công việc' };
};