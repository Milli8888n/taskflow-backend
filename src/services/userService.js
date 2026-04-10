const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');

exports.getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy tài khoản', 404);
  return user;
};

exports.updateProfile = async (userId, updateData) => {
  const allowedFields = ['name'];
  const filtered = {};
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) filtered[field] = updateData[field];
  });

  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  return user;
};

exports.uploadAvatar = async (userId, fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'taskflow/avatars',
        transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        resource_type: 'image'
      },
      async (error, result) => {
        if (error) return reject(new AppError('Lỗi upload ảnh: ' + error.message, 500));

        const user = await User.findByIdAndUpdate(userId, { avatar: result.secure_url }, { new: true });
        resolve(user);
      }
    );

    const Readable = require('stream').Readable;
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};