const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { signAccessToken, signRefreshToken } = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

// ========== ĐĂNG KÝ ==========
exports.registerUser = async (userData) => {
  // Bước 1: Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    // Ném lỗi 400. Controller sẽ bắt và chuyển cho Error Handler
    throw new AppError('Email đã được đăng ký', 400);
  }

  // Bước 2: Tạo user mới
  // Lúc .save() chạy, pre-save hook sẽ tự hash password
  const user = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  // Bước 3: Ẩn password trước khi trả về
  // toObject() chuyển Mongoose Document thành JS Object thường
  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

// ========== ĐĂNG NHẬP ==========
exports.loginUser = async (email, password) => {
  // Bước 1: Kiểm tra có truyền đủ email + password không
  if (!email || !password) {
    throw new AppError('Vui lòng cung cấp email và mật khẩu', 400);
  }

  // Bước 2: Tìm user theo email
  // .select('+password') để lôi password ra (vì Schema set select: false)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Email chưa được đăng ký', 404);
  }

  // Bước 3: So sánh password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Sai mật khẩu', 401);
  }

  // Bước 4: Ký (sign) JWT tokens
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Bước 5: Lưu refresh token vào DB (để sau này verify + thu hồi)
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  // validateBeforeSave: false → bỏ qua validate Schema (vì ta không đổi email/name)

  // Bước 6: Trả về (ẩn password)
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

exports.refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token không được cung cấp', 400);
  }

  // Bước 1: Giải mã refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
  }

  // Bước 2: Tìm user và kiểm tra refresh token có khớp trong DB không
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Refresh token đã bị thu hồi', 403);
  }

  // Bước 3: Cấp access token mới
  const newAccessToken = signAccessToken(user._id);

  return { accessToken: newAccessToken };
};

// ========== ĐĂNG XUẤT ==========
exports.logoutUser = async (userId) => {
  // Xóa refresh token trong DB → token cũ không thể dùng lại
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Tài khoản không tồn tại', 404);
  }

  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  return true;
};

// ========== ĐỔI MẬT KHẨU ==========
exports.changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới', 400);
  }

  // Bước 1: Tìm user kèm password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('Tài khoản không tồn tại', 404);
  }

  // Bước 2: Xác minh mật khẩu hiện tại
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không đúng', 401);
  }

  // Bước 3: Cập nhật mật khẩu mới (pre-save hook sẽ tự hash)
  user.password = newPassword;
  await user.save();

  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  return { message: 'Đổi mật khẩu thành công' };

};