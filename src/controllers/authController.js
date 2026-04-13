const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    // Gọi Service, truyền dữ liệu từ body request
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      status: 'success',
      data: { user },
      message: 'Đăng ký thành công'
    });
  } catch (error) {
    // Mọi lỗi (từ Service throw hoặc Mongoose) đều chảy về đây
    next(error); // Đẩy xuống Error Handler
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    res.status(200).json({
      status: 'success',
      data: result,
      message: 'Đăng nhập thành công'
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: 'success',
      data: result,
      message: 'Làm mới access token thành công'
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: { user: req.user.toJSON() },
      message: 'Lấy thông tin người dùng thành công'
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    next(error);
  }
};