require('dotenv').config();
const http = require('http');

// Import app Express đã cấu hình
const app = require('./app');

// Import hàm kết nối DB
const connectDB = require('./config/db');

const { initSocket } = require('./config/socket');

// Kết nối Database trước
connectDB();

// Lấy PORT từ .env, nếu không có thì mặc định 5000
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

// Test Cloudinary
const cloudinary = require('./config/cloudinary');
cloudinary.api.ping().then(r => console.log('Cloudinary OK:', r)).catch(e => console.error('Cloudinary Error:', e));

// Bật server lắng nghe trên cổng PORT
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
