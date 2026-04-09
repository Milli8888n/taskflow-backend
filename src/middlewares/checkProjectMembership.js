const Project = require('../models/projectModel');
const AppError = require('../utils/AppError');

const checkProjectMembership = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    });

    if (!project) {
      return next(new AppError('Không tìm thấy dự án', 404));
    }

    const isMember = project.members.some(
      member => member.toString() === userId.toString()
    );

    if (!isMember) {
      return next(new AppError('Bạn không phải thành viên của dự án này', 403));
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkProjectMembership;