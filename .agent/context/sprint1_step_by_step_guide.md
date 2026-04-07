# HƯỚNG DẪN TỪNG BƯỚC – SPRINT 1: NỀN MÓNG & XÁC THỰC

Tài liệu này cầm tay chỉ việc (Step-by-step) cho từng Micro-Task trong Sprint 1. Mỗi task được trình bày theo cấu trúc: **Mục tiêu → Các bước thực hiện → Giải thích tại sao → Kiểm tra kết quả**.

---

## S1-01: Khởi tạo Repo GitHub & Cấu hình Git

**Mục tiêu:** Tạo kho mã nguồn trực tuyến để cả team cùng làm việc và quản lý phiên bản.

**Bước 1:** Truy cập GitHub.com, bấm "New Repository". Đặt tên `taskflow-backend`. Chọn **Private**. Bấm Create.

**Bước 2:** Mở Terminal tại thư mục dự án trên máy tính, chạy:
```bash
git init
git remote add origin https://github.com/<tên_bạn>/taskflow-backend.git
```
*Giải thích:* `git init` biến thư mục thường thành thư mục Git, `remote add` là nối dây cáp từ máy mình lên GitHub.

**Bước 3:** Tạo file `.gitignore` tại thư mục gốc với nội dung:
```
node_modules/
.env
.DS_Store
```
*Giải thích:* File này bảo Git "đừng theo dõi mấy thứ này". `node_modules` rất nặng (hàng nghìn file), `.env` chứa mật khẩu DB không được phép lộ ra Internet.

**Bước 4:** Tạo nhánh develop:
```bash
git add .
git commit -m "chore: khởi tạo dự án"
git branch develop
git push -u origin main
git push -u origin develop
```
*Giải thích:* Nhánh `main` là bản chính thức. Nhánh `develop` là nơi team gộp code hàng ngày. Không ai code trực tiếp trên `main`.

**Kiểm tra:** Truy cập GitHub, thấy 2 nhánh `main` và `develop`.

---

## S1-02: Khởi tạo npm & Cài đặt thư viện

**Mục tiêu:** Khai sinh file `package.json` và nạp toàn bộ công cụ cần thiết.

**Bước 1:** Chạy lệnh khởi tạo:
```bash
npm init -y
```
*Giải thích:* Lệnh này tạo ra file `package.json` – cuốn sổ quản lý dự án Node.js. Flag `-y` tự động điền mặc định để không phải gõ tên, mô tả.

**Bước 2:** Cài đặt thư viện chạy chính (dependencies):
```bash
npm install express mongoose dotenv cors morgan bcrypt jsonwebtoken socket.io ejs multer
```
*Giải thích từng gói:*
- `express`: Web framework xử lý HTTP request/response.
- `mongoose`: Thư viện kết nối và thao tác MongoDB.
- `dotenv`: Đọc file `.env` để lấy biến môi trường (DB password, JWT key).
- `cors`: Cho phép Frontend ở domain khác gọi API.
- `morgan`: Tự động in log mỗi request ra Terminal (vd: `GET /api/v1/projects 200 12ms`).
- `bcrypt`: Mã hóa mật khẩu thành chuỗi hash.
- `jsonwebtoken`: Đúc và giải mã JWT token.
- `socket.io`: Giao tiếp 2 chiều realtime.
- `ejs`: Template engine render HTML từ server.
- `multer`: Xử lý upload file (avatar).

**Bước 3:** Cài thư viện phát triển (devDependencies):
```bash
npm install --save-dev nodemon
```
*Giải thích:* `nodemon` tự động restart server khi bạn sửa code, khỏi phải `Ctrl+C` rồi `node server.js` lại mỗi lần.

**Bước 4:** Mở `package.json`, sửa mục `scripts`:
```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js"
}
```
*Giải thích:* `npm run dev` dùng lúc code (auto restart). `npm start` dùng lúc deploy lên Render.

**Kiểm tra:** Chạy `npm run dev`, Terminal hiện dòng nodemon watching, không báo lỗi thiếu file (chưa tạo server.js thì sẽ báo lỗi – bình thường, sang bước sau sẽ tạo).

---

## S1-03: Tạo cấu trúc thư mục chuẩn MVC

**Mục tiêu:** Xây bộ xương thư mục để cả team biết "file này nằm ở đâu".

**Bước 1:** Tạo cây thư mục bên trong thư mục gốc dự án:
```bash
mkdir -p src/config src/controllers src/models src/services src/routes src/middlewares src/utils src/views/partials src/views/auth src/views/project src/views/dashboard public/css public/js public/images
```
*Giải thích:* Flag `-p` tạo cả thư mục cha lẫn con. Mỗi thư mục có vai trò cố định:
- `config/` → Cấu hình DB, Cloudinary.
- `controllers/` → Nhận request, gọi service, trả response.
- `models/` → Khai báo cấu trúc bảng MongoDB.
- `services/` → Chứa logic nghiệp vụ (phần khó).
- `routes/` → Định tuyến URL endpoint.
- `middlewares/` → Hàm chặn kiểm tra token, quyền.
- `utils/` → Hàm tiện ích dùng chung (tạo token, format lỗi).
- `views/` → File EJS (giao diện HTML).
- `public/` → CSS, JS client, hình ảnh tĩnh.

**Bước 2:** Tạo các file rỗng khung sườn:
```bash
touch src/app.js src/server.js src/config/db.js
```

**Kiểm tra:** Chạy lệnh `ls -R src/` (hoặc dùng Explorer), thấy đầy đủ các thư mục con.

---

## S1-04: Viết file kết nối MongoDB (`src/config/db.js`)

**Mục tiêu:** Khi server khởi động, tự động bắt tay với MongoDB Atlas.

**Bước 1:** Mở file `src/config/db.js`, viết:
```javascript
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
```

*Giải thích chi tiết:*
- `async/await`: Kết nối DB là thao tác bất đồng bộ (mất thời gian chờ mạng). `await` bảo JS "đợi xong rồi hãy chạy dòng tiếp".
- `process.env.MONGODB_URI`: Không gõ cứng chuỗi kết nối vào code vì sẽ bị lộ khi push GitHub. Thay vào đó đọc từ file `.env`.
- `process.exit(1)`: Nếu DB chết thì server cũng nên dừng. Mã `1` nghĩa là "thoát do lỗi".

**Kiểm tra:** Chưa test được ngay vì chưa có file `.env` và `server.js`. Sang bước tiếp.

---

## S1-05: Viết file cấu hình Express (`src/app.js`)

**Mục tiêu:** Tạo "bộ khung" Express App, gắn middleware, khai báo EJS, chuẩn bị sẵn chỗ cắm Route.

**Bước 1:** Mở `src/app.js`, viết từng đoạn (giải thích theo thứ tự):
```javascript
// ========== IMPORT THƯ VIỆN ==========
const express = require('express');  // Framework web
const cors = require('cors');        // Cho phép gọi API từ domain khác
const morgan = require('morgan');    // In log request ra terminal
const path = require('path');        // Xử lý đường dẫn file (built-in NodeJS)

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
// const { errorHandler } = require('./middlewares/errorHandler');
// app.use(errorHandler);

// ========== XUẤT APP ==========
module.exports = app;
```

*Giải thích tại sao tách `app.js` và `server.js`:*
- `app.js` chỉ lo cấu hình Express (routes, middleware). Không biết gì về port hay database.
- `server.js` lo việc "bật công tắc" (listen port, connect DB).
- Tách như vậy để sau này viết Unit Test dễ hơn (import app mà không cần bật server thật).

**Kiểm tra:** Chưa test được, cần server.js.

---

## S1-06: Viết file khởi chạy (`src/server.js`)

**Mục tiêu:** Đây là file "bấm nút bật máy". Kết nối DB xong thì mở cổng mạng đợi request.

**Bước 1:** Tạo file `.env` ở thư mục gốc:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
NODE_ENV=development
JWT_SECRET=chuoi_bi_mat_cuc_ky_kho_doan_123!@#
JWT_REFRESH_SECRET=chuoi_bi_mat_refresh_456!@#
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```
*Giải thích:* Mỗi dòng là 1 biến. `JWT_SECRET` là chìa khóa ký mã JWT (càng phức tạp càng an toàn). `15m` = token hết hạn sau 15 phút.

**Bước 2:** Viết `src/server.js`:
```javascript
// Dòng này PHẢI nằm đầu tiên, trước mọi thứ khác
// Nó đọc file .env và nạp các biến vào process.env
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
```

*Giải thích tại sao `require('dotenv').config()` phải nằm dòng 1:*
- File `.env` không tự động được đọc. Lệnh này load nội dung `.env` vào bộ nhớ `process.env`.
- Nếu đặt sau `require('./config/db')`, thì lúc db.js chạy, `process.env.MONGODB_URI` vẫn là `undefined` → kết nối lỗi.

**Kiểm tra:**
```bash
npm run dev
```
Terminal phải hiện:
```
MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
Server running in development mode on port 5000
```
Mở trình duyệt: `http://localhost:5000/api/v1/health` → Hiện JSON `{ status: "success" }`.

---

## S1-07: Viết Global Error Handler (`src/middlewares/errorHandler.js`)

**Mục tiêu:** Tạo hệ thống bắt lỗi tập trung. Mọi lỗi từ bất kỳ route nào đều chảy về đây.

**Bước 1:** Tạo class lỗi tùy chỉnh trong `src/utils/AppError.js`:
```javascript
// Class lỗi kế thừa Error gốc của JavaScript
// Thêm thuộc tính statusCode để biết trả mã HTTP nào
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
```

*Giải thích:*
- Khi code viết `throw new AppError('Email đã tồn tại', 400)`, object lỗi sẽ tự mang theo mã 400.
- Nếu `throw new Error('Lỗi gì đó')` thông thường thì không có statusCode → handler sẽ gán mặc định 500.

**Bước 2:** Viết middleware bắt lỗi `src/middlewares/errorHandler.js`:
```javascript
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
```

**Bước 3:** Quay lại `src/app.js`, bỏ comment và gắn Error Handler:
```javascript
// Import Error Handler
const { errorHandler } = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

// ... (sau tất cả các routes) ...

// Bắt route không tồn tại (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Không tìm thấy ${req.originalUrl} trên server`, 404));
});

// ĐẶT CUỐI CÙNG: Error Handler Middleware
app.use(errorHandler);
```

*Giải thích tại sao Error Handler phải nằm cuối:*
- Express xử lý middleware theo thứ tự từ trên xuống.
- Nếu đặt Error Handler trước Routes thì lỗi từ Routes không chảy được xuống đây.
- Middleware có 4 tham số `(err, req, res, next)` được Express tự động nhận diện là Error Handler.

**Kiểm tra:** Truy cập `http://localhost:5000/api/v1/duong-dan-khong-ton-tai` → Phải nhận JSON: `{ status: "fail", message: "Không tìm thấy ..." }` với status 404.

---

## S1-08: Viết User Model (`src/models/userModel.js`)

**Mục tiêu:** Tạo bảng Users trong MongoDB với đầy đủ ràng buộc và tự động hash password.

**Bước 1:** Viết Schema:
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên'],
    trim: true,
    // trim: true tự động xóa khoảng trắng đầu/cuối
    // " Nguyễn Văn A " → "Nguyễn Văn A"
  },
  email: {
    type: String,
    required: [true, 'Vui lòng cung cấp email'],
    unique: true,    
    lowercase: true, // Tự chuyển "ABC@Gmail.com" → "abc@gmail.com"
    match: [
      /^\S+@\S+\.\S+$/, 
      'Email không hợp lệ'
    ]
    // Regex giải thích: ^\S+ (ít nhất 1 ký tự không trắng) @ \S+ . \S+$
  },
  password: {
    type: String,
    required: [true, 'Vui lòng cung cấp mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
    // select: false → Khi query User bình thường, password sẽ bị ẩn đi
    // Muốn lấy phải ghi rõ: User.findOne().select('+password')
  },
  avatar: {
    type: String,
    default: ''
    // Lưu URL ảnh. Mặc định rỗng (chưa có avatar)
  },
  refreshToken: {
    type: String,
    select: false
    // Lưu refresh token hiện tại. Ẩn khỏi query thông thường.
  }
}, {
  timestamps: true
  // Tự động tạo 2 trường: createdAt và updatedAt
});
```

**Bước 2:** Viết Pre-save Hook (Tự động hash password):
```javascript
// Hook chạy TRƯỚC mỗi lần .save()
// Keyword "function" bắt buộc (không dùng arrow =>), vì cần truy cập "this"
userSchema.pre('save', async function(next) {
  // Kiểm tra: password có bị thay đổi không?
  // Nếu user chỉ đổi tên (không đổi pass), thì bỏ qua khỏi hash lại
  if (!this.isModified('password')) return next();
  
  // Tạo salt (muối) với 10 rounds rồi hash password
  // Salt rounds càng cao càng an toàn nhưng càng chậm. 10 là mức cân bằng.
  this.password = await bcrypt.hash(this.password, 10);
  
  next(); // Cho phép tiếp tục save xuống MongoDB
});
```

*Giải thích Salt & Hash:*
- Nếu chỉ hash: password "123456" luôn ra cùng 1 chuỗi → Hacker có bảng tra cứu sẵn (Rainbow Table).
- Salt = thêm chuỗi ngẫu nhiên vào trước khi hash. Cùng password "123456" nhưng 2 user sẽ ra 2 chuỗi hash khác nhau.

**Bước 3:** Viết Instance Method (So sánh password):
```javascript
// Method gắn vào MỖI document user
// Gọi bằng: user.comparePassword('mật_khẩu_nhập_vào')
userSchema.methods.comparePassword = async function(candidatePassword) {
  // bcrypt.compare so sánh chuỗi text thô với chuỗi đã hash
  // Trả về true/false
  return await bcrypt.compare(candidatePassword, this.password);
};
```

**Bước 4:** Export Model:
```javascript
module.exports = mongoose.model('User', userSchema);
// 'User' → MongoDB sẽ tạo collection tên "users" (tự thêm 's' và viết thường)
```

**Kiểm tra:** Tạm thời test nhanh bằng cách thêm đoạn code test vào `server.js` (xóa sau):
```javascript
const User = require('./models/userModel');
// Sau connectDB():
// User.create({ name: 'Test', email: 'test@test.com', password: '123456' })
//   .then(u => console.log('Created:', u))
//   .catch(e => console.log('Error:', e.message));
```
Chạy server → Console phải in ra user mới, password là chuỗi hash `$2b$10$...`.

---

## S1-09: Viết Auth Service (`src/services/authService.js`)

**Mục tiêu:** Chứa logic xử lý đăng ký và đăng nhập. Controller sẽ gọi các hàm này.

```javascript
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { signAccessToken, signRefreshToken } = require('../utils/generateToken');

// ========== ĐĂNG KÝ ==========
exports.registerUser = async (userData) => {
  // Bước 1: Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    // Ném lỗi 400. Controller sẽ bắt và chuyển cho Error Handler
    throw new AppError('Email đã được đăng ký', 400);
  }

  // Bước 2: Tạo user mới
  // Lúc .save() chạy, pre-save hook sẽ tự hash password
  const user = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  // Bước 3: Ẩn password trước khi trả về
  // toObject() chuyển Mongoose Document thành JS Object thường
  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

// ========== ĐĂNG NHẬP ==========
exports.loginUser = async (email, password) => {
  // Bước 1: Kiểm tra có truyền đủ email + password không
  if (!email || !password) {
    throw new AppError('Vui lòng cung cấp email và mật khẩu', 400);
  }

  // Bước 2: Tìm user theo email
  // .select('+password') để lôi password ra (vì Schema set select: false)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Email chưa được đăng ký', 404);
  }

  // Bước 3: So sánh password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Sai mật khẩu', 401);
  }

  // Bước 4: Ký (sign) JWT tokens
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Bước 5: Lưu refresh token vào DB (để sau này verify + thu hồi)
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  // validateBeforeSave: false → bỏ qua validate Schema (vì ta không đổi email/name)

  // Bước 6: Trả về (ẩn password)
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};
```

*Giải thích tại sao không truyền `req, res` vào Service:*
- Service chỉ nhận dữ liệu thuần (string, object) và trả kết quả hoặc throw lỗi.
- Nếu Service phụ thuộc vào `req`, thì không thể tái sử dụng Service cho CLI tool, cron job, hay test.

---

## S1-10 + S1-11: Viết Controller + Route cho Auth

**Controller (`src/controllers/authController.js`):**
```javascript
const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    // Gọi Service, truyền dữ liệu từ body request
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      status: 'success',
      data: { user },
      message: 'Đăng ký thành công'
    });
  } catch (error) {
    // Mọi lỗi (từ Service throw hoặc Mongoose) đều chảy về đây
    next(error); // Đẩy xuống Error Handler
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    res.status(200).json({
      status: 'success',
      data: result,
      message: 'Đăng nhập thành công'
    });
  } catch (error) {
    next(error);
  }
};
```

**Route (`src/routes/authRoutes.js`):**
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/v1/auth/register
router.post('/register', authController.register);

// POST /api/v1/auth/login
router.post('/login', authController.login);

module.exports = router;
```

**Gắn vào app.js:**
```javascript
// Trong src/app.js, thêm trước Error Handler:
const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/auth', authRoutes);
```

**Kiểm tra bằng Postman:**
1. `POST http://localhost:5000/api/v1/auth/register` → Body: `{ "name": "Test", "email": "test@test.com", "password": "123456" }` → Expect 201.
2. Gửi lại lần 2 cùng email → Expect 400 "Email đã được đăng ký".
3. `POST .../login` → Body: `{ "email": "test@test.com", "password": "123456" }` → Expect 200 + tokens.

---

## S1-12: Viết Auth Middleware (`src/middlewares/authMiddleware.js`)

**Mục tiêu:** Chặn mọi request không có JWT hợp lệ.

```javascript
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
```

**Kiểm tra:** Trong Postman, gọi `GET /api/v1/health` với header `Authorization: Bearer <token_từ_login>` → Pass. Bỏ header → 401.

---

## S1-13: Viết hàm tạo Token (`src/utils/generateToken.js`)

```javascript
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
```

*Giải thích tại sao 2 token dùng 2 secret khác nhau:*
- Nếu dùng chung 1 secret, hacker lấy được 1 token có thể giả mạo token còn lại.
- Tách riêng secret giúp tăng lớp bảo mật.

---

## S1-14: Viết API Refresh Token

**Thêm vào `authService.js`:**
```javascript
exports.refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token không được cung cấp', 400);
  }

  // Bước 1: Giải mã refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
  }

  // Bước 2: Tìm user và kiểm tra refresh token có khớp trong DB không
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Refresh token đã bị thu hồi', 403);
  }

  // Bước 3: Cấp access token mới
  const newAccessToken = signAccessToken(user._id);

  return { accessToken: newAccessToken };
};
```

**Thêm vào `authController.js`:**
```javascript
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
```

**Thêm route vào `authRoutes.js`:**
```javascript
router.post('/refresh', authController.refreshToken);
```

**Kiểm tra:** Login lấy refreshToken → Gọi `POST /api/v1/auth/refresh` với body `{ "refreshToken": "..." }` → Nhận accessToken mới.
