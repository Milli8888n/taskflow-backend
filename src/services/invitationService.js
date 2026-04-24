const Invitation = require('../models/invitationModel');
const Project = require('../models/projectModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const AppError = require('../utils/AppError');
const { getIO } = require('../config/socket');

exports.sendInvitation = async (projectId, email, inviterId) => {
  // 1. Tìm user được mời
  const recipient = await User.findOne({ email });
  if (!recipient) throw new AppError('Không tìm thấy người dùng với email này', 404);

  // 2. Kiểm tra xem đã là thành viên chưa
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Không tìm thấy dự án', 404);
  
  const isAlreadyMember = project.members.some(m => m.toString() === recipient._id.toString());
  if (isAlreadyMember) throw new AppError('Người này đã là thành viên của dự án', 400);

  // 3. Kiểm tra xem có lời mời nào đang pending không
  const existingInvite = await Invitation.findOne({ 
    project: projectId, 
    recipient: recipient._id, 
    status: 'pending' 
  });
  if (existingInvite) throw new AppError('Lời mời đang chờ xác nhận', 400);

  // 4. Tạo lời mời
  const invitation = await Invitation.create({
    project: projectId,
    inviter: inviterId,
    recipient: recipient._id
  });

  // 5. Tạo thông báo và emit socket
  const inviter = await User.findById(inviterId);
  const notification = await Notification.create({
    user: recipient._id,
    sender: inviterId,
    type: 'SYSTEM',
    content: `đã mời bạn tham gia dự án "${project.name}"`,
    link: `/dashboard` // Hoặc link đến trang invitations
  });

  const io = getIO();
  if (io) {
    const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name avatar');
    io.to(`user:${recipient._id}`).emit('newNotification', populatedNotif);
    io.to(`user:${recipient._id}`).emit('newInvitation', {
      invitationId: invitation._id,
      projectName: project.name,
      inviterName: inviter.name
    });
  }

  return invitation;
};

exports.getMyInvitations = async (userId) => {
  return await Invitation.find({ 
    recipient: userId, 
    status: 'pending',
    expiresAt: { $gt: new Date() }
  })
    .populate('project', 'name description')
    .populate('inviter', 'name avatar email');
};

exports.respondToInvitation = async (invitationId, userId, response) => {
  const invitation = await Invitation.findOne({ _id: invitationId, recipient: userId, status: 'pending' });
  if (!invitation) throw new AppError('Lời mời không hợp lệ hoặc đã hết hạn', 404);

  if (response === 'accept') {
    invitation.status = 'accepted';
    
    // Thêm member vào project
    const project = await Project.findById(invitation.project);
    if (project) {
      if (!project.members.includes(userId)) {
        project.members.push(userId);
        await project.save();
        
        // Emit socket cho project board biết có member mới
        const user = await User.findById(userId);
        const io = getIO();
        if (io) {
          io.to(`project:${project._id}`).emit('memberJoined', {
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          });
        }
      }
    }
  } else {
    invitation.status = 'declined';
  }

  await invitation.save();
  return invitation;
};
