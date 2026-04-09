require('dotenv').config();

// Import app Express đã cấu hình
const app = require('./app');

// Import hàm kết nối DB
const connectDB = require('./config/db');

// Kết nối Database trước
connectDB();

// Lấy PORT từ .env, nếu không có thì mặc định 5000
const PORT = process.env.PORT || 5000;


// Bật server lắng nghe trên cổng PORT
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});