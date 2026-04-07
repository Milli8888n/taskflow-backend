# HƯỚNG DẪN TỪNG BƯỚC – SPRINT 3: DASHBOARD UI, PROFILE, AVATAR, SEARCH, DEPLOY

Tài liệu cầm tay chỉ việc cho từng Micro-Task trong Sprint 3.

---

## S3-01: Viết Dashboard Frontend (EJS + CSS + JS)

**Mục tiêu:** Trang hiển thị thống kê: Số project, tasks theo trạng thái, tỷ lệ hoàn thành, tasks trễ hạn.

**Bước 1:** Cập nhật `src/routes/viewRoutes.js` – thêm:
```javascript
router.get('/dashboard', (req, res) => {
  res.render('dashboard/index', { title: 'Dashboard - TaskFlow' });
});
```

**Bước 2:** Tạo `src/views/dashboard/index.ejs`:
- 5 stat cards (Dự án, To Do, In Progress, Done, Trễ hạn) sử dụng CSS Grid.
- Thanh tiến độ hoàn thành (progress bar).
- Nhúng `<script src="/js/dashboard.js"></script>`.

*Giải thích:*
- Mỗi stat card có `id` để JS chèn giá trị: `stat-projects`, `stat-todo`, `stat-inprogress`, `stat-done`, `stat-overdue`.
- Progress bar: `<div class="progress-bar" id="progress-bar" style="width: 0%"></div>`.

**Bước 3:** Tạo `public/js/dashboard.js`:
```javascript
async function loadDashboard() {
  const response = await fetch('/api/v1/dashboard/stats', { headers: authHeaders() });
  const data = await response.json();
  const stats = data.data.stats;

  document.getElementById('stat-projects').textContent = stats.totalProjects;
  document.getElementById('stat-todo').textContent = stats.todoCount;
  document.getElementById('stat-inprogress').textContent = stats.inProgressCount;
  document.getElementById('stat-done').textContent = stats.doneCount;
  document.getElementById('stat-overdue').textContent = stats.overdueTasks;

  document.getElementById('progress-bar').style.width = `${stats.completionRate}%`;
  document.getElementById('progress-text').textContent = `${stats.completionRate}%`;
}

document.addEventListener('DOMContentLoaded', loadDashboard);
```

**Bước 4:** Tạo `public/css/dashboard.css`:
- `.stats-grid` dùng `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` – Grid tự responsive.
- `.progress-bar` dùng `transition: width 1s ease` – Thanh tiến độ chạy mượt khi load.

**Kiểm tra:** Truy cập `http://localhost:5000/dashboard` → Thấy 5 cards số liệu + thanh tiến độ.

---

## S3-02: Cấu hình Cloudinary (`src/config/cloudinary.js`)

**Mục tiêu:** Kết nối dịch vụ lưu trữ ảnh Cloudinary để upload avatar.

**Bước 1:** Đăng ký tài khoản tại [cloudinary.com](https://cloudinary.com) (miễn phí, 25GB). Vào Dashboard, copy `cloud_name`, `api_key`, `api_secret`.

**Bước 2:** Cài thư viện:
```bash
npm install cloudinary
```

**Bước 3:** Thêm 3 biến vào `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Bước 4:** Tạo file `src/config/cloudinary.js`:
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
```

*Giải thích:*
- Cloudinary lưu ảnh trên CDN toàn cầu → Ảnh load nhanh mọi nơi.
- `.v2`: API version 2 mới nhất.

**Kiểm tra:** Thêm test tạm:
```javascript
const cloudinary = require('./src/config/cloudinary');
cloudinary.api.ping().then(r => console.log('Cloudinary OK:', r));
```
→ Phải in `{ status: 'ok' }`.

---

## S3-03: Viết Multer Middleware (`src/middlewares/upload.js`)

**Mục tiêu:** Middleware xử lý file upload từ HTML form.

```javascript
const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
});

module.exports = upload;
```

*Giải thích:*
- `memoryStorage()`: Lưu file tạm trong RAM (buffer) thay vì ổ cứng. Phù hợp khi upload thẳng lên cloud.
- `fileFilter`: Chặn mọi file không phải ảnh (bảo mật).
- `5 * 1024 * 1024 = 5,242,880 bytes = 5MB`: Giới hạn kích thước.

**Kiểm tra:** Sẽ test cùng User Route.

---

## S3-04: Viết User Service (`src/services/userService.js`)

**Mục tiêu:** Logic xử lý Profile: Lấy thông tin, Cập nhật tên, Upload avatar.

```javascript
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');

exports.getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy tài khoản', 404);
  return user;
};

exports.updateProfile = async (userId, updateData) => {
  const allowedFields = ['name'];
  const filtered = {};
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) filtered[field] = updateData[field];
  });

  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  return user;
};

exports.uploadAvatar = async (userId, fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'taskflow/avatars',
        transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        resource_type: 'image'
      },
      async (error, result) => {
        if (error) return reject(new AppError('Lỗi upload ảnh: ' + error.message, 500));

        const user = await User.findByIdAndUpdate(userId, { avatar: result.secure_url }, { new: true });
        resolve(user);
      }
    );

    const Readable = require('stream').Readable;
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};
```

*Giải thích:*
- `gravity: 'face'`: Cloudinary AI tự nhận diện khuôn mặt và cắt ảnh sao cho mặt nằm giữa.
- `upload_stream`: Upload từ buffer (RAM), không phải file path trên ổ cứng.
- `Readable → pipe → uploadStream`: Chuyển buffer thành stream rồi "bơm" lên Cloudinary.

---

## S3-05: Viết User Controller + Route

**Controller (`src/controllers/userController.js`):**
```javascript
const userService = require('../services/userService');
const AppError = require('../utils/AppError');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('Vui lòng chọn ảnh để upload', 400));
    const user = await userService.uploadAvatar(req.user._id, req.file.buffer);
    res.status(200).json({ status: 'success', data: { user }, message: 'Cập nhật avatar thành công' });
  } catch (error) { next(error); }
};
```

**Route (`src/routes/userRoutes.js`):**
```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
```

**Gắn vào `app.js`:**
```javascript
const userRoutes = require('./routes/userRoutes');
app.use('/api/v1/users', userRoutes);
```

**Kiểm tra Postman:**
1. `GET /api/v1/users/profile` → Thông tin user.
2. `PUT /api/v1/users/profile` body `{ "name": "Tên Mới" }` → 200.
3. `POST /api/v1/users/avatar` → Chọn Body > form-data > Key: `avatar` (type: File) > Chọn 1 ảnh → 200 + trả URL Cloudinary.

---

## S3-06: Viết API đổi mật khẩu

**Mục tiêu:** User có thể đổi mật khẩu (xác nhận pass cũ trước).

**Thêm vào `authService.js`:**
```javascript
exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('Không tìm thấy tài khoản', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Mật khẩu hiện tại không đúng', 401);

  if (currentPassword === newPassword) throw new AppError('Mật khẩu mới không được trùng', 400);

  user.password = newPassword;  // Pre-save hook sẽ hash
  await user.save();

  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  return { message: 'Đổi mật khẩu thành công' };
};
```

**Thêm vào `authController.js`:**
```javascript
exports.changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(
      req.user._id, req.body.currentPassword, req.body.newPassword
    );
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};
```

**Thêm vào `authRoutes.js`:**
```javascript
router.put('/change-password', protect, authController.changePassword);
```

**Kiểm tra Postman:**
1. `PUT /api/v1/auth/change-password` body `{ "currentPassword": "123456", "newPassword": "abc789" }` → 200.
2. Gọi lại với password cũ → 401 "Mật khẩu hiện tại không đúng".

---

## S3-07: Viết Profile Frontend (EJS + JS)

**Bước 1:** Thêm vào `viewRoutes.js`:
```javascript
router.get('/profile', (req, res) => {
  res.render('user/profile', { title: 'Hồ Sơ - TaskFlow' });
});
```

**Bước 2:** Tạo `src/views/user/profile.ejs` – Form thông tin + Section đổi mật khẩu + Avatar upload.

**Bước 3:** Tạo `public/js/profile.js` – Xử lý: loadProfile, updateProfile, uploadAvatar (FormData), changePassword.

*Điểm quan trọng:*
- Upload avatar dùng `FormData` thay vì `JSON.stringify`.
- KHÔNG set `Content-Type` header khi dùng FormData (fetch tự set boundary).
- Sau đổi password: xóa localStorage tokens + redirect about login.

**Kiểm tra:** Truy cập `http://localhost:5000/profile` → Đổi tên, upload ảnh, đổi password.

---

## S3-08: Viết Logout API + Cập nhật Navbar

**Bước 1:** Thêm vào `authService.js`:
```javascript
exports.logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: undefined });
  return { message: 'Đăng xuất thành công' };
};
```

**Bước 2:** Thêm vào `authController.js` + `authRoutes.js`:
```javascript
// Controller
exports.logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);
    res.status(200).json({ status: 'success', message: 'Đăng xuất thành công' });
  } catch (error) { next(error); }
};

// Route
router.post('/logout', protect, authController.logout);
```

**Bước 3:** Cập nhật `_header.ejs` – Thêm inline script kiểm tra `localStorage.getItem('accessToken')`:
- Có token → Hiện menu: Dự Án, Dashboard, Hồ Sơ, Đăng Xuất.
- Không token → Hiện: Đăng Nhập, Đăng Ký.
- Nút Đăng Xuất: Gọi API logout → xóa localStorage → redirect `/login`.

**Kiểm tra:** Đăng nhập → Thấy navbar đầy đủ. Bấm Đăng Xuất → Về trang login, navbar chỉ còn 2 nút.

---

## S3-09: Hoàn thiện app.js + Tổng kiểm tra

**Mục tiêu:** Đảm bảo tất cả routes đã được gắn đúng thứ tự.

**Bước 1:** Kiểm tra `app.js` có đủ các dòng:
```javascript
const viewRoutes = require('./routes/viewRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/', viewRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.all('*', (req, res, next) => { ... });
app.use(errorHandler);
```

**Bước 2:** Kiểm tra `server.js` đã dùng `http.createServer(app)` + `initSocket(server)` + `server.listen()`.

**Bước 3:** Tổng kiểm tra bằng Postman – Chạy tất cả endpoints:

| # | Method | URL | Expected |
|:---:|:---:|:---|:---:|
| 1 | POST | /api/v1/auth/register | 201 |
| 2 | POST | /api/v1/auth/login | 200 + tokens |
| 3 | POST | /api/v1/auth/refresh | 200 + new access token |
| 4 | POST | /api/v1/auth/logout | 200 |
| 5 | PUT | /api/v1/auth/change-password | 200 |
| 6 | GET | /api/v1/projects | 200 + array |
| 7 | POST | /api/v1/projects | 201 |
| 8 | GET | /api/v1/projects/:id | 200 |
| 9 | PUT | /api/v1/projects/:id | 200 |
| 10 | DELETE | /api/v1/projects/:id | 200 + soft delete |
| 11 | POST | /api/v1/projects/:id/members | 200 |
| 12 | DELETE | /api/v1/projects/:id/members/:mid | 200 |
| 13 | GET | /api/v1/projects/:id/tasks | 200 |
| 14 | POST | /api/v1/projects/:id/tasks | 201 |
| 15 | PUT | /api/v1/projects/:id/tasks/:tid | 200 |
| 16 | DELETE | /api/v1/projects/:id/tasks/:tid | 200 |
| 17 | GET | /api/v1/projects/:id/tasks/:tid/comments | 200 |
| 18 | POST | /api/v1/projects/:id/tasks/:tid/comments | 201 |
| 19 | GET | /api/v1/dashboard/stats | 200 + stats object |
| 20 | GET | /api/v1/users/profile | 200 |
| 21 | PUT | /api/v1/users/profile | 200 |
| 22 | POST | /api/v1/users/avatar | 200 + cloudinary URL |

**Kiểm tra Frontend:** Mở trình duyệt kiểm tra tất cả trang:
- `/login` → Đăng nhập thành công → Redirect `/projects`.
- `/projects` → Danh sách project, tạo mới, click vào 1 project.
- `/projects/:id/board` → Board 3 cột, tạo task, đổi status, thêm comment.
- `/dashboard` → Stat cards, progress bar.
- `/profile` → Đổi tên, upload avatar, đổi password.

---

## S3-10: Deploy lên Render

**Mục tiêu:** Đưa app từ localhost lên Internet.

**Bước 1:** Push code lên GitHub:
```bash
git add .
git commit -m "feat: hoàn thành Sprint 3"
git push origin develop
```

**Bước 2:** Vào MongoDB Atlas → Network Access → Thêm `0.0.0.0/0` (Allow from anywhere).

*Giải thích:* Render dùng IP động, không thể whitelist cụ thể.

**Bước 3:** Đăng nhập [render.com](https://render.com) → New → Web Service → Kết nối GitHub repo.

**Bước 4:** Cấu hình:
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance:** Free (0$)

**Bước 5:** Thêm tất cả Environment Variables (copy từ `.env`, đổi `NODE_ENV=production`).

**Bước 6:** Bấm Deploy. Đợi 2-3 phút.

**Kiểm tra:** Truy cập `https://taskflow-xxxxx.onrender.com/api/v1/health` → `{ "status": "success" }`.

*Lưu ý:* Free Render tự tắt server sau 15 phút không hoạt động. Truy cập lần đầu sẽ chậm ~30 giây (cold start).
