const Project = require('../models/projectModel');
const Task = require('../models/taskModel');

exports.getDashboardStats = async (userId) => {
  const projects = await Project.find({
    isDeleted: false,
    $or: [{ owner: userId }, { members: userId }]
  });

  const projectIds = projects.map(p => p._id);
  const totalProjects = projectIds.length;

  const tasks = await Task.find({
    projectId: { $in: projectIds },
    isDeleted: false
  });

  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;
  let overdueTasks = 0;

  const now = new Date();

  tasks.forEach(t => {
    if (t.status === 'To Do') todoCount++;
    else if (t.status === 'In Progress') inProgressCount++;
    else if (t.status === 'Done') doneCount++;

    if (t.status !== 'Done' && t.deadline && new Date(t.deadline) < now) {
      overdueTasks++;
    }
  });

  const totalTasks = tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((doneCount / totalTasks) * 100);

  return {
    totalProjects,
    totalTasks,
    todoCount,
    inProgressCount,
    doneCount,
    overdueTasks,
    completionRate
  };
};
