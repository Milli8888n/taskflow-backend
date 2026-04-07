class AppError extends Error {
  constructor(message, statusCode) {
    // Gọi constructor cha (Error) với message
    super(message);
    
    this.statusCode = statusCode;
    
    // Xác định loại lỗi: 4xx là "fail" (lỗi do client), 5xx là "error" (lỗi do server)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Đánh dấu đây là lỗi "có chủ đích" (operational), không phải bug code
    this.isOperational = true;

    // Ghi dấu vết stack trace để debug
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;