const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);
    
    // Tham gia room cá nhân để nhận thông báo assign
    socket.join(`user:${socket.user._id.toString()}`);

    socket.on('joinProject', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`${socket.user.name} joined room: project:${projectId}`);
    });

    socket.on('leaveProject', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`${socket.user.name} left room: project:${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    if (process.env.NODE_ENV === 'test') return null;
    throw new Error('Socket.io chưa được khởi tạo!');
  }
  return io;
};

module.exports = { initSocket, getIO };