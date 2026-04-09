// Import thư viện mongoose
const mongoose = require('mongoose');

// Hàm kết nối Database
const connectDB = async () => {
  try {
    // mongoose.connect() trả về Promise, nên dùng await
    // process.env.MONGODB_URI lấy giá trị từ file .env
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Nếu kết nối thất bại thì in lỗi và tắt server luôn
    // Vì không có DB thì chạy tiếp cũng vô ích
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1); // Thoát process với mã lỗi 1
  }
};

// Xuất hàm ra để file khác gọi được
module.exports = connectDB;