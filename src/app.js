// ========== IMPORT THƯ VIỆN ==========
const express = require('express');  // Framework web
const cors = require('cors');        // Cho phép gọi API từ domain khác
const morgan = require('morgan');    // In log request ra terminal
const path = require('path');        // Xử lý đường dẫn file (built-in NodeJS)
const userRoutes = require('./routes/userRoutes');

// ========== KHỞI TẠO APP ==========
const app = express();

// ========== CẤU HÌNH MIDDLEWARE CHUNG ==========

// Middleware 1: Cho phép nhận dữ liệu JSON từ body request
// Không có dòng này thì req.body sẽ luôn là undefined
app.use(express.json());

// Middleware 2: Cho phép nhận dữ liệu từ HTML Form (URL encoded)
// extended: true cho phép gửi object lồng nhau
app.use(express.urlencoded({ extended: true }));

// Middleware 3: Bật CORS
// Cho phép Frontend (nếu chạy ở port khác) gọi được API
app.use(cors());

// Middleware 4: Bật log request khi đang phát triển
// Mỗi lần có request, Terminal sẽ in: "GET /api/v1/projects 200 5ms"
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ========== CẤU HÌNH VIEW ENGINE (EJS) ==========

// Bảo Express: "Tao xài EJS để render HTML"
app.set('view engine', 'ejs');

// Bảo Express: "Mấy file .ejs nằm trong thư mục src/views"
app.set('views', path.join(__dirname, 'views'));

// Bảo Express: "Mấy file tĩnh (CSS, JS, ảnh) nằm trong thư mục public"
app.use(express.static(path.join(__dirname, '../public')));

// ========== GẮN ROUTES (sẽ bổ sung sau) ==========

// Route tạm để test server hoạt động
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server đang chạy!' });
});

// ========== IMPORT VÀ GẮN ERROR HANDLER (sẽ viết ở S1-07) ==========
const AppError = require('./utils/AppError');

const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/auth', authRoutes);

const { errorHandler } = require('./middlewares/errorHandler');

const projectRoutes = require('./routes/projectRoutes');
app.use('/api/v1/projects', projectRoutes);

app.use('/api/v1/users', userRoutes);

// Bắt route không tồn tại (404)
app.use((req, res, next) => {
  next(new AppError(`Không tìm thấy ${req.originalUrl} trên server`, 404));
});

// ĐẶT CUỐI CÙNG: Error Handler Middleware
app.use(errorHandler);

// ========== XUẤT APP ==========
module.exports = app;