const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// 1. Cấu hình nơi lưu (diskStorage)
const storage = multer.diskStorage({
  // Nơi file bay vào
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); 
  },
  // Đóng dấu tên file để không bị trùng (dùng Date timestamp)
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `task-${req.params.id}-${Date.now()}${ext}`);
  }
});

// 2. Filter (Optional - Chặn mấy file .exe độc hại)
const fileFilter = (req, file, cb) => {
  // Ở đây cho phép upload ảnh tĩnh, PDF, Word, ... chặn exe, sh, bash
  if (file.mimetype.startsWith('image') || file.mimetype.includes('pdf')) {
    cb(null, true);
  } else {
    cb(new AppError('Định dạng file không được hỗ trợ! Chỉ nhận Image hoặc PDF', 400), false);
  }
};

// 3. Xuất middleware
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn max 5MB
});

// Nhận vào 1 file duy nhất với field-name gửi từ Front-End là 'file'
exports.uploadTaskFile = upload.single('file');
