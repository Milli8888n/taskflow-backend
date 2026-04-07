# TÀI LIỆU HƯỚNG DẪN XÂY DỰNG CẤU TRÚC DỰ ÁN NODE.JS (EXPRESS & MONGOOSE)

Tài liệu này cung cấp hướng dẫn chi tiết về việc thiết lập một cấu trúc dự án Node.js chuyên nghiệp theo kiến trúc đa tầng (Layered Architecture). Mục tiêu của cấu trúc này là đảm bảo tính mở rộng (scalability), dễ bảo trì (maintainability) và tách biệt rõ ràng giữa các thành phần logic.

---

## 1. Cấu trúc thư mục tổng quát

Dự án được tổ chức theo mô hình **MVC (Model-View-Controller)** kết hợp với **Service Layer** để xử lý các logic nghiệp vụ phức tạp.

```text
project-root/
├── src/
│   ├── config/             # Cấu hình hệ thống (Database, Environment,...)
│   ├── controllers/        # Tiếp nhận request và trả về response
│   ├── models/             # Định nghĩa Schema dữ liệu (Mongoose Models)
│   ├── services/           # Xử lý logic nghiệp vụ (Business Logic)
│   ├── routes/             # Định nghĩa các điểm cuối API (Endpoints)
│   ├── middlewares/        # Các hàm trung gian (Xác thực, kiểm tra dữ liệu,...)
│   ├── utils/              # Các hàm tiện ích dùng chung
│   ├── app.js              # Cấu hình ứng dụng Express
│   └── server.js           # Điểm khởi chạy hệ thống (Entry point)
├── .env                    # Lưu trữ biến môi trường
├── .gitignore              # Danh sách các tệp loại trừ khỏi Git
├── package.json            # Quản lý thư viện và script
└── README.md               # Tài liệu dự án
```

---

## 2. Quy trình thiết lập chi tiết

### Bước 1: Khởi tạo và cài đặt thư viện
Khởi tạo dự án và cài đặt các gói phụ thuộc cần thiết:

```bash
npm init -y
npm install express mongoose dotenv cors morgan
npm install --save-dev nodemon
```

### Bước 2: Thiết lập biến môi trường (`.env`)
Tạo tệp `.env` tại thư mục gốc để quản lý các thông số cấu hình nhạy cảm:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/database_name
NODE_ENV=development
```

### Bước 3: Cấu hình kết nối cơ sở dữ liệu (`src/config/db.js`)
Sử dụng Mongoose để thiết lập kết nối tới MongoDB:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Bước 4: Định nghĩa Schema và Model (`src/models/userModel.js`)
Lớp Model đại diện cho cấu trúc dữ liệu trong cơ sở dữ liệu:

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

### Bước 5: Lớp xử lý nghiệp vụ (`src/services/userService.js`)
Service Layer chịu trách nhiệm tương tác trực tiếp với Database và thực hiện các tính toán logic.

```javascript
const User = require('../models/userModel');

exports.findAllUsers = async () => {
  return await User.find();
};

exports.createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};
```

### Bước 6: Điều hướng yêu cầu (`src/controllers/userController.js`)
Controller tiếp nhận yêu cầu từ Route, gọi Service tương ứng và trả kết quả cho người dùng.

```javascript
const userService = require('../services/userService');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await userService.findAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
```

### Bước 7: Quản lý Routes (`src/routes/userRoutes.js`)
Phân tách các API endpoints theo từng module.

```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUsers);

module.exports = router;
```

### Bước 8: Xử lý lỗi tập trung (`src/middlewares/errorHandler.js`)
Middleware xử lý lỗi giúp đồng nhất định dạng phản hồi khi có sự cố xảy ra.

```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
```

### Bước 9: Khởi tạo ứng dụng và Server

**File `src/app.js` (Cấu hình Express):**
```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorHandler');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes API
app.use('/api/v1/users', userRoutes);

// Error Middleware
app.use(errorHandler);

module.exports = app;
```

**File `src/server.js` (Khởi chạy):**
```javascript
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Kết nối Database
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```

---

## 3. Ưu điểm của kiến trúc đề xuất

1.  **Tính đóng gói cao:** Mỗi thành phần (Model, Service, Controller) đảm nhận một vai trò duy nhất (Single Responsibility Principle).
2.  **Khả năng mở rộng:** Dễ dàng bổ sung các tính năng mới mà không gây ảnh hưởng đến các thành phần hiện có.
3.  **Dễ dàng kiểm thử (Testing):** Việc tách biệt Business Logic vào Service giúp thực hiện Unit Testing thuận tiện hơn.
4.  **Kiểm soát lỗi chặt chẽ:** Cơ chế Centralized Error Handling đảm bảo ứng dụng không bị dừng đột ngột và phản hồi lỗi nhất quán cho phía Frontend.

---
*Tài liệu này phục vụ mục đích hướng dẫn xây dựng khung cơ bản (Boilerplate). Tùy vào quy mô dự án, các thành phần như Validation (Joi/Zod), Security (Helmet), hoặc Documentation (Swagger) có thể được tích hợp thêm.*