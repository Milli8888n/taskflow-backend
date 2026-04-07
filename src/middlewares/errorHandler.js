const errorHandler = (err, req, res, next) => {
  // Lấy statusCode. Nếu chưa có (Error thường) thì gán 500
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ';

  // ===== XỬ LÝ CÁC LỖI ĐẶC THÙ CỦA MONGOOSE =====

  // Lỗi 1: ID MongoDB sai định dạng (VD: "abc123" thay vì ObjectId 24 ký tự)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Không tìm thấy tài nguyên. ID "${err.value}" không hợp lệ`;
  }

  // Lỗi 2: Vi phạm ràng buộc Schema (thiếu field required, sai enum...)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // Gom tất cả message lỗi validation thành 1 chuỗi
    const errors = Object.values(err.errors).map(val => val.message);
    message = `Dữ liệu không hợp lệ: ${errors.join('. ')}`;
  }

  // Lỗi 3: Duplicate Key (email unique bị trùng)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} "${err.keyValue[field]}" đã tồn tại trong hệ thống`;
  }

  // Lỗi 4: JWT token không hợp lệ
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ. Vui lòng đăng nhập lại';
  }

  // Lỗi 5: JWT token hết hạn
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn. Vui lòng đăng nhập lại';
  }

  // ===== TRẢ RESPONSE JSON CHUẨN =====
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: message,
    // Chỉ hiện stack trace khi đang dev (tắt khi deploy production)
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };