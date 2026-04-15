const Project = require('../models/projectModel');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

exports.createProject = async (name, description, userId) => {
  const project = await Project.create({
    name,
    description,
    owner: userId,
    members: [userId]     // Chủ dự án tự động thành thành viên
  });
  return project;
};

exports.getMyProjects = async (userId) => {
    const projects = await Project.find({
      members: userId,
      isDeleted: false
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ updatedAt: -1 });
    return projects;
  };

  exports.getProjectById = async (projectId) => {
    const project = await Project.findOne({ _id: projectId, isDeleted: false })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');
    if (!project) throw new AppError('Không tìm thấy dự án', 404);
    return project;
  };
  
  exports.updateProject = async (projectId, updateData) => {
    const allowedFields = ['name', 'description'];
    const filtered = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) filtered[field] = updateData[field];
    });
  
    const project = await Project.findByIdAndUpdate(projectId, filtered, {
      new: true,
      runValidators: true
    });
    return project;
  };
  
  exports.deleteProject = async (projectId) => {
    const project = await Project.findByIdAndUpdate(projectId, { isDeleted: true }, { new: true });
    return { message: 'Đã xóa dự án' };
  };
  
  exports.addMember = async (projectId, email) => {
    const user = await User.findOne({ email });
    if (!user) throw new AppError('Không tìm thấy người dùng với email này', 404);
  
    const project = await Project.findById(projectId);
    const isAlreadyMember = project.members.some(m => m.toString() === user._id.toString());
    if (isAlreadyMember) throw new AppError('Người này đã là thành viên', 400);
  
    project.members.push(user._id);
    await project.save();
    return project;
  };
  
  exports.removeMember = async (projectId, memberId, requestUserId) => {
    const project = await Project.findById(projectId);
  
    if (project.owner.toString() !== requestUserId.toString()) {
      throw new AppError('Chỉ chủ dự án mới có quyền xóa thành viên', 403);
    }
    if (memberId === project.owner.toString()) {
      throw new AppError('Không thể xóa chủ dự án', 400);
    }
  
    const index = project.members.findIndex(m => m.toString() === memberId);
    if (index === -1) throw new AppError('Người này không phải thành viên', 404);
  
    project.members.splice(index, 1);
    await project.save();
    return project;
  };
  
  exports.getMembers = async (projectId) => {
    const project = await Project.findOne({ _id: projectId, isDeleted: false })
      .populate('members', 'name email avatar')
      .populate('owner', 'name email avatar');
    if (!project) throw new AppError('Không tìm thấy dự án', 404);
    return { owner: project.owner, members: project.members };
  };