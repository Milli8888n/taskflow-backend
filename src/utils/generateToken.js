const jwt = require('jsonwebtoken');

// Tạo Access Token (sống ngắn 15 phút)
exports.signAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },           // Payload: dữ liệu gắn trong token
    process.env.JWT_SECRET,   // Secret key: chìa khóa ký
    { expiresIn: process.env.JWT_EXPIRE } // Hạn sử dụng: '15m'
  );
};

// Tạo Refresh Token (sống dài 7 ngày)
exports.signRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,  // Dùng secret KHÁC với access token
    { expiresIn: process.env.JWT_REFRESH_EXPIRE } // '7d'
  );
};