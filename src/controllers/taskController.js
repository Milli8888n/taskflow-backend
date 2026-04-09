const taskService = require('../services/taskService');

exports.createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.params.projectId, req.body, req.user._id);
    res.status(201).json({ status: 'success', data: { task } });
  } catch (error) { next(error); }
};

exports.getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getProjectTasks(req.params.projectId, req.query);
    res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
  } catch (error) { next(error); }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.taskId);
    res.status(200).json({ status: 'success', data: { task } });
  } catch (error) { next(error); }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.taskId, req.body);
    res.status(200).json({ status: 'success', data: { task } });
  } catch (error) { next(error); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.taskId);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};