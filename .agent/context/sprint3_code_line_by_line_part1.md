# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 3 (PHẦN 1: DASHBOARD FRONTEND, USER PROFILE, AVATAR UPLOAD)

Sprint 3 hoàn thiện các tính năng nâng cao: Dashboard thống kê trực quan, User Profile, Upload Avatar (Multer + Cloudinary), Search/Filter, Soft Delete Task.

---

# FILE 1: `src/views/dashboard/index.ejs` (Trang Dashboard)

```html
<%- include('../partials/_header') %>

<div class="dashboard-container">
  <h1>📊 Dashboard</h1>
```

```html
  <div class="stats-grid" id="stats-grid">
    <div class="stat-card stat-total">
      <div class="stat-icon">📁</div>
      <div class="stat-info">
        <span class="stat-number" id="stat-projects">0</span>
        <span class="stat-label">Dự án</span>
      </div>
    </div>
```
- `stat-card`: Card thống kê nhỏ. Layout sẽ sắp xếp thành lưới.
- `stat-total`: Class modifier cho từng loại card (màu khác nhau).
- `id="stat-projects"`: JS sẽ cập nhật số `0` thành con số thật sau khi fetch API.
- `stat-icon` + `stat-info`: Chia card thành 2 phần: icon bên trái, số liệu bên phải.

```html
    <div class="stat-card stat-todo">
      <div class="stat-icon">📋</div>
      <div class="stat-info">
        <span class="stat-number" id="stat-todo">0</span>
        <span class="stat-label">To Do</span>
      </div>
    </div>

    <div class="stat-card stat-progress">
      <div class="stat-icon">🔄</div>
      <div class="stat-info">
        <span class="stat-number" id="stat-inprogress">0</span>
        <span class="stat-label">In Progress</span>
      </div>
    </div>

    <div class="stat-card stat-done">
      <div class="stat-icon">✅</div>
      <div class="stat-info">
        <span class="stat-number" id="stat-done">0</span>
        <span class="stat-label">Done</span>
      </div>
    </div>

    <div class="stat-card stat-overdue">
      <div class="stat-icon">⚠️</div>
      <div class="stat-info">
        <span class="stat-number" id="stat-overdue">0</span>
        <span class="stat-label">Trễ hạn</span>
      </div>
    </div>
  </div>
```
- 5 stat cards: Dự án, To Do, In Progress, Done, Trễ hạn.
- Mỗi card có ID duy nhất để JS gán giá trị.

```html
  <!-- Thanh tiến độ -->
  <div class="progress-section">
    <h2>Tiến Độ Hoàn Thành</h2>
    <div class="progress-bar-container">
      <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
    </div>
    <span class="progress-text" id="progress-text">0%</span>
  </div>
</div>

<script src="/js/dashboard.js"></script>
<%- include('../partials/_footer') %>
```
- `progress-bar`: Thanh ngang hiển thị % hoàn thành. Chiều rộng sẽ được JS set theo `completionRate`.
- `style="width: 0%"`: Ban đầu = 0%. JS sẽ đổi thành VD `width: 65%`.

---

# FILE 2: `public/js/dashboard.js` (Client JS Dashboard)

```javascript
async function loadDashboard() {
  try {
    const response = await fetch('/api/v1/dashboard/stats', {
      headers: authHeaders()
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    const stats = data.data.stats;
```
- Gọi API dashboard, lấy object `stats` = `{ totalProjects, totalTasks, todoCount, ... }`.

```javascript
    document.getElementById('stat-projects').textContent = stats.totalProjects;
    document.getElementById('stat-todo').textContent = stats.todoCount;
    document.getElementById('stat-inprogress').textContent = stats.inProgressCount;
    document.getElementById('stat-done').textContent = stats.doneCount;
    document.getElementById('stat-overdue').textContent = stats.overdueTasks;
```
- `.textContent = value`: Gán giá trị số vào từng thẻ `<span>`. Con số `0` mặc định bị thay bằng giá trị thật.

```javascript
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    progressBar.style.width = `${stats.completionRate}%`;
    progressText.textContent = `${stats.completionRate}%`;
```
- `progressBar.style.width = '65%'`: Đổi chiều rộng thanh tiến độ bằng CSS inline.
  - CSS transition (sẽ khai báo trong CSS file) làm thanh "chạy" mượt từ 0% → 65%.
- `progressText.textContent = '65%'`: Hiện con số phần trăm.

```javascript
  } catch (error) {
    console.error('Lỗi load dashboard:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
```

---

# FILE 3: `public/css/dashboard.css`

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}
```
- `repeat(auto-fit, minmax(200px, 1fr))`: Grid tự động responsive!
  - `auto-fit`: Tự tính số cột dựa trên chiều rộng viewport.
  - `minmax(200px, 1fr)`: Mỗi cột tối thiểu 200px, tối đa bằng nhau.
  - Trên màn hình rộng: 5 cột. Thu nhỏ trình duyệt → 4 cột → 3 cột → 2 cột → 1 cột. TỰ ĐỘNG, không cần media query.

```css
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  background: white;
  box-shadow: var(--shadow);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
}
```
- Card hiệu ứng "nổi lên" khi hover. `gap: 1rem` tạo khoảng cách giữa icon và info.

```css
.stat-icon {
  font-size: 2rem;
  width: 56px;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  background: #f1f5f9;
}
```
- Container vuông 56×56px cho emoji icon. Background xám nhạt tạo nền nổi bật.

```css
.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  display: block;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}
```
- Số lớn đậm + label nhỏ mờ bên dưới.

```css
.progress-bar-container {
  width: 100%;
  height: 12px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 0.75rem;
}
```
- Container thanh tiến độ: nền xám, bo tròn.
- `overflow: hidden`: Ẩn phần thanh màu tràn ra ngoài border-radius.

```css
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #818cf8);
  border-radius: 999px;
  transition: width 1s ease;
}
```
- `linear-gradient(90deg, ...)`: Gradient ngang, từ indigo đậm sang indigo nhạt → Đẹp hơn màu đơn.
- `transition: width 1s ease`: Khi JS đổi `width` từ 0% sang 65%, thanh "chạy" mượt trong 1 giây.
  - Hiệu ứng animation đơn giản nhưng rất chuyên nghiệp.

---

# FILE 4: `src/config/cloudinary.js` (Cấu hình Cloudinary)

```javascript
const cloudinary = require('cloudinary').v2;
```
- Import Cloudinary SDK phiên bản 2. `.v2` lấy API mới nhất.
- Cloudinary: Dịch vụ lưu trữ ảnh/video trên cloud. Miễn phí 25GB.

```javascript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```
- 3 giá trị lấy từ `.env`. Lấy ở Dashboard Cloudinary sau khi đăng ký tài khoản.
- `cloud_name`: Tên cloud (vd: `"dxabc123"`).
- `api_key`: Khóa công khai.
- `api_secret`: Khóa bí mật. KHÔNG được lộ.

```javascript
module.exports = cloudinary;
```

**Thêm vào `.env`:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# FILE 5: `src/middlewares/upload.js` (Multer – Xử lý upload file)

```javascript
const multer = require('multer');
```
- `multer`: Middleware xử lý `multipart/form-data` (định dạng gửi file qua HTTP).
- Khi HTML form có `<input type="file">`, dữ liệu gửi dạng multipart, KHÔNG phải JSON.
- `express.json()` không parse được multipart → Cần multer.

```javascript
const storage = multer.memoryStorage();
```
- `memoryStorage()`: Lưu file tạm trong RAM (buffer), KHÔNG lưu xuống ổ cứng.
- Tại sao lưu RAM? Vì ta sẽ upload thẳng lên Cloudinary, không cần lưu local.
- Nếu dùng `diskStorage()`: File lưu vào thư mục trên server → Phải tự xóa sau.

```javascript
const fileFilter = (req, file, cb) => {
```
- Hàm lọc file. Chỉ cho upload ảnh, chặn file khác.
- `file`: Object chứa thông tin file (tên, MIME type, size).
- `cb`: Callback. `cb(null, true)` = chấp nhận. `cb(error, false)` = từ chối.

```javascript
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif)'), false);
  }
};
```
- `file.mimetype`: MIME type của file. Ảnh = `image/jpeg`, `image/png`, `image/gif`.
- `.startsWith('image/')`: Kiểm tra có phải ảnh hay không.
- Nếu user upload file `.exe` hay `.pdf` → Từ chối. Bảo mật quan trọng.

```javascript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
```
- `storage: storage`: Dùng memory storage.
- `fileFilter`: Áp dụng bộ lọc.
- `limits.fileSize`: Giới hạn kích thước file = 5MB.
  - `5 * 1024 * 1024` = 5 × 1024KB × 1024B = 5,242,880 bytes = 5MB.
  - Nếu file lớn hơn → Multer throw lỗi `"File too large"`.

```javascript
module.exports = upload;
```

---

# FILE 6: `src/services/userService.js` (Logic User Profile & Avatar)

### Hàm lấy thông tin Profile

```javascript
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');
```

```javascript
exports.getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Không tìm thấy tài khoản', 404);
  }
  return user;
};
```
- Tìm user theo ID. Schema có `select: false` cho password nên password tự ẩn.

### Hàm cập nhật Profile

```javascript
exports.updateProfile = async (userId, updateData) => {
  const allowedFields = ['name'];
  const filtered = {};

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filtered[field] = updateData[field];
    }
  });
```
- Whitelist: Chỉ cho phép đổi `name`. KHÔNG cho đổi email (gắn với xác thực) hay password (cần API riêng).
- `filtered`: Object chỉ chứa trường được phép → An toàn.

```javascript
  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true,
    runValidators: true
  });
```
- `findByIdAndUpdate(id, update, options)`: Tìm theo ID và cập nhật 1 lệnh.
- `new: true`: Trả về document SAU khi cập nhật. Mặc định trả document CŨ (trước update).
- `runValidators: true`: Chạy Schema validators (required, minlength...) khi update.
  - Mặc định `findByIdAndUpdate` KHÔNG chạy validators! Phải bật thủ công.
  - Nếu thiếu → User có thể đổi name thành chuỗi rỗng "" mà không bị chặn.

```javascript
  return user;
};
```

### Hàm Upload Avatar

```javascript
exports.uploadAvatar = async (userId, fileBuffer) => {
```
- `fileBuffer`: Buffer (dữ liệu nhị phân) của file ảnh. Multer memory storage trả về qua `req.file.buffer`.

```javascript
  return new Promise((resolve, reject) => {
```
- Tạo Promise thủ công vì Cloudinary upload API dùng callback (kiểu cũ), không phải Promise.

```javascript
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'taskflow/avatars',
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' }
        ],
        resource_type: 'image'
      },
```
- `upload_stream()`: Upload từ buffer/stream (không phải file path).
- `folder: 'taskflow/avatars'`: Thư mục lưu ảnh trên Cloudinary. Giúp tổ chức gọn.
- `transformation`: Xử lý ảnh khi upload:
  - `width: 200, height: 200`: Resize về 200×200px.
  - `crop: 'fill'`: Cắt ảnh để vừa khung 200×200 (không bị méo/bị viền đen).
  - `gravity: 'face'`: Ưu tiên giữ khuôn mặt khi cắt. Cloudinary dùng AI nhận diện khuôn mặt.
- `resource_type: 'image'`: Khai báo loại tài nguyên.

```javascript
      async (error, result) => {
        if (error) {
          return reject(new AppError('Lỗi upload ảnh: ' + error.message, 500));
        }
```
- Callback sau khi upload xong. `error` nếu thất bại, `result` nếu thành công.
- `reject(new AppError(...))`: Promise thất bại → `await` bên ngoài sẽ throw lỗi.

```javascript
        const user = await User.findByIdAndUpdate(
          userId,
          { avatar: result.secure_url },
          { new: true }
        );

        resolve(user);
      }
    );
```
- `result.secure_url`: URL HTTPS của ảnh đã upload. VD: `https://res.cloudinary.com/dxabc/image/upload/v123/taskflow/avatars/abc.jpg`.
- Lưu URL vào trường `avatar` của user document.
- `resolve(user)`: Promise thành công, trả user đã cập nhật.

```javascript
    const Readable = require('stream').Readable;
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
```
- **Chuyển Buffer thành Stream:** Cloudinary `upload_stream` nhận dữ liệu qua pipe (dòng chảy).
- `new Readable()`: Tạo readable stream rỗng.
- `.push(fileBuffer)`: Đẩy dữ liệu buffer vào stream.
- `.push(null)`: Tín hiệu "hết dữ liệu" (end of stream).
- `.pipe(uploadStream)`: Nối stream đọc → stream upload. Dữ liệu "chảy" từ buffer sang Cloudinary.
- Giống ống nước: Buffer = bồn chứa, pipe = ống dẫn, uploadStream = vòi phun lên cloud.

```javascript
  });
};
```

---

# FILE 7: `src/controllers/userController.js`

```javascript
const userService = require('../services/userService');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};
```

### Controller Upload Avatar

```javascript
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Vui lòng chọn ảnh để upload', 400));
    }
```
- `req.file`: Object chứa file đã upload. Multer gán vào `req` sau khi parse.
  - `req.file.buffer`: Buffer nhị phân.
  - `req.file.mimetype`: Type (vd: `image/jpeg`).
  - `req.file.size`: Kích thước (bytes).
  - `req.file.originalname`: Tên file gốc.
- Nếu client không chọn file → `req.file` = `undefined`.

```javascript
    const user = await userService.uploadAvatar(req.user._id, req.file.buffer);

    res.status(200).json({
      status: 'success',
      data: { user },
      message: 'Cập nhật avatar thành công'
    });
  } catch (error) {
    next(error);
  }
};
```

---

# FILE 8: `src/routes/userRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
```

```javascript
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);
```
- `upload.single('avatar')`: Middleware Multer xử lý 1 file duy nhất từ trường form tên `'avatar'`.
  - `'avatar'`: Tên trường trong form-data. Client phải gửi file với key `avatar`.
  - `.single()`: Chỉ chấp nhận 1 file. `.array()` cho nhiều file.
- Thứ tự middleware: `protect` → `upload.single('avatar')` → `userController.uploadAvatar`.
  - Request qua 3 tầng: Check token → Parse file → Xử lý logic.

```javascript
module.exports = router;
```

**Gắn vào app.js:**
```javascript
const userRoutes = require('./routes/userRoutes');
app.use('/api/v1/users', userRoutes);
```

---

# FILE 9: `src/services/taskService.js` (Bổ sung – Soft Delete Task)

```javascript
exports.deleteTask = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false });

  if (!task) {
    throw new AppError('Không tìm thấy công việc', 404);
  }

  const project = await Project.findById(task.projectId);
  const isMember = project.members.some(
    m => m.toString() === userId.toString()
  );

  if (!isMember) {
    throw new AppError('Bạn không có quyền xóa công việc này', 403);
  }
```
- Check task tồn tại → Lấy project → Check user là member.

```javascript
  task.isDeleted = true;
  await task.save();
```
- Soft Delete: Lật cờ `isDeleted` = true. Task vẫn còn trong DB.
- Mọi query `.find({ isDeleted: false })` sẽ tự bỏ qua task này.

```javascript
  const io = getIO();
  io.to(`project:${task.projectId}`).emit('taskDeleted', {
    taskId: task._id,
    projectId: task.projectId
  });
```
- Emit socket event `taskDeleted` → Các member khác thấy card biến mất tức thì.

```javascript
  return { message: 'Đã xóa công việc' };
};
```

**Thêm vào controller + route:**
```javascript
// taskController.js
exports.deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.taskId, req.user._id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
};

// taskRoutes.js
router.delete('/:taskId', taskController.deleteTask);
```

---

# FILE 10: `src/services/projectService.js` (Bổ sung – Quản lý thành viên)

### Xóa thành viên

```javascript
exports.removeMember = async (projectId, memberIdToRemove, requestUserId) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: false });

  if (!project) {
    throw new AppError('Không tìm thấy dự án', 404);
  }

  if (project.owner.toString() !== requestUserId.toString()) {
    throw new AppError('Chỉ chủ dự án mới có quyền xóa thành viên', 403);
  }
```

```javascript
  if (memberIdToRemove === project.owner.toString()) {
    throw new AppError('Không thể xóa chủ dự án khỏi dự án', 400);
  }
```
- **Guard clause quan trọng**: Owner không thể tự xóa mình ra khỏi project.

```javascript
  const memberIndex = project.members.findIndex(
    m => m.toString() === memberIdToRemove
  );

  if (memberIndex === -1) {
    throw new AppError('Người này không phải thành viên của dự án', 404);
  }
```
- `.findIndex()`: Tìm vị trí (index) của member trong mảng. Trả `-1` nếu không tìm thấy.

```javascript
  project.members.splice(memberIndex, 1);
  await project.save();
```
- `.splice(index, deleteCount)`: Xóa phần tử tại `index`, xóa `1` phần tử.
  - `splice(2, 1)`: Xóa phần tử index 2 khỏi mảng.
  - Mảng ban đầu: `[A, B, C, D]` → Sau splice(1,1): `[A, C, D]` (xóa B).
- `.save()`: Lưu mảng members đã cập nhật xuống MongoDB.

```javascript
  return project;
};
```

### Lấy danh sách thành viên

```javascript
exports.getMembers = async (projectId) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: false })
    .populate('members', 'name email avatar')
    .populate('owner', 'name email avatar');

  if (!project) {
    throw new AppError('Không tìm thấy dự án', 404);
  }

  return {
    owner: project.owner,
    members: project.members
  };
};
```
- `.populate('members', 'name email avatar')`: Thay mảng ObjectId bằng mảng object User hoàn chỉnh.
- Trả về cả owner (để Frontend đánh dấu ai là chủ) và danh sách members.
