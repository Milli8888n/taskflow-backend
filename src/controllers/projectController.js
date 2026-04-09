const projectService = require('../services/projectService');

exports.createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(
      req.body.name, req.body.description, req.user._id
    );
    res.status(201).json({ status: 'success', data: { project } });
  } catch (error) { next(error); }
};

exports.getMyProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getMyProjects(req.user._id);
    res.status(200).json({ status: 'success', results: projects.length, data: { projects } });
  } catch (error) { next(error); }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId);
    res.status(200).json({ status: 'success', data: { project } });
  } catch (error) { next(error); }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.body);
    res.status(200).json({ status: 'success', data: { project } });
  } catch (error) { next(error); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.projectId);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};

exports.addMember = async (req, res, next) => {
  try {
    const project = await projectService.addMember(req.params.projectId, req.body.email);
    res.status(200).json({ status: 'success', data: { project }, message: 'Đã thêm thành viên' });
  } catch (error) { next(error); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const project = await projectService.removeMember(
      req.params.projectId, req.params.memberId, req.user._id
    );
    res.status(200).json({ status: 'success', data: { project }, message: 'Đã xóa thành viên' });
  } catch (error) { next(error); }
};

exports.getMembers = async (req, res, next) => {
  try {
    const data = await projectService.getMembers(req.params.projectId);
    res.status(200).json({ status: 'success', data });
  } catch (error) { next(error); }
};