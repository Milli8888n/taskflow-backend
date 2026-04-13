const userService = require('../services/userService');
const AppError = require('../utils/AppError');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('Vui lòng chọn ảnh để upload', 400));
    const user = await userService.uploadAvatar(req.user._id, req.file.buffer);
    res.status(200).json({ status: 'success', data: { user }, message: 'Cập nhật avatar thành công' });
  } catch (error) { next(error); }
};