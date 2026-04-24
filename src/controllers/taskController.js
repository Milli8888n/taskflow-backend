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
    const task = await taskService.updateTask(req.params.taskId, req.body, req.user._id);
    res.status(200).json({ status: 'success', data: { task } });
  } catch (error) { next(error); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.taskId, req.user._id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};
exports.uploadAttachment = async (req, res, next) => {
  try {
    // req.file do Multer tạo ra sau khi nó hứng được file
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'Vui lòng đính kèm file!' });
    }

    const taskId = req.params.id;
    // Đường dẫn ảo trả về cho Client - bỏ chữ /public đi để trình duyệt tải được file tĩnh
    const filePath = `/uploads/${req.file.filename}`;

    // Update Database: nhét filePath vào mảng attachments
    const task = await Task.findByIdAndUpdate(taskId, {
      $push: { attachments: filePath }
    }, { new: true });

    if (!task) {
      return res.status(404).json({ status: 'fail', message: 'Không tìm thấy Task!' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        task,
        filePath // Gửi filePath xuống front-end để gắn lên UI cho nóng
      }
    });

  } catch (err) {
    next(err);
  }
};
