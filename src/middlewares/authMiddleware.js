const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
  try {
    // ===== BƯỚC 1: Lấy token từ Header =====
    let token;
    
    // Header mẫu: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5c..."
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Tách chuỗi bằng dấu cách, lấy phần tử thứ 2 (index 1)
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Bạn chưa đăng nhập. Vui lòng cung cấp token', 401));
    }

    // ===== BƯỚC 2: Giải mã (Verify) Token =====
    // jwt.verify sẽ tự throw lỗi nếu token sai hoặc hết hạn
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: '60d5f...', iat: 1624..., exp: 1624... }

    // ===== BƯỚC 3: Kiểm tra user còn tồn tại không =====
    // Trường hợp: Token vẫn còn hạn nhưng user đã bị xóa khỏi DB
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('Tài khoản không còn tồn tại', 401));
    }

    // ===== BƯỚC 4: Gắn user vào request =====
    // Từ đây trở đi, mọi controller phía sau đều truy cập được req.user
    req.user = currentUser;
    
    next(); // Thông hành! Cho request đi tiếp vào Controller
  } catch (error) {
    // jwt.verify throw lỗi sẽ rơi vào đây
    // Error Handler sẽ tự phân loại JsonWebTokenError / TokenExpiredError
    next(error);
  }
};