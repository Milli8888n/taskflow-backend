# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 3 (PHẦN 2: ĐỔI MẬT KHẨU, SEARCH/FILTER, DEPLOY RENDER)

Phần cuối Sprint 3 + Sprint 4: Đổi mật khẩu, Search/Filter nâng cao, Profile EJS Frontend, và Deploy lên Render.

---

# FILE 11: `src/services/authService.js` (Bổ sung – Đổi mật khẩu)

```javascript
exports.changePassword = async (userId, currentPassword, newPassword) => {
```
- `userId`: Ai đang đổi password.
- `currentPassword`: Password cũ (để xác nhận chính chủ).
- `newPassword`: Password mới.

```javascript
  const user = await User.findById(userId).select('+password');
```
- `.select('+password')`: Bắt lấy password hash ra (vì Schema set `select: false`).

```javascript
  if (!user) {
    throw new AppError('Không tìm thấy tài khoản', 404);
  }
```

```javascript
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không đúng', 401);
  }
```
- Bước bảo mật: Xác nhận user biết password cũ → Tránh trường hợp hacker đánh cắp token rồi tự đổi password.
- `comparePassword()`: Hàm Instance Method so sánh text với hash (dùng bcrypt).

```javascript
  if (currentPassword === newPassword) {
    throw new AppError('Mật khẩu mới không được trùng với mật khẩu cũ', 400);
  }
```
- UX check: Tránh user đổi password mà thực ra vẫn là password cũ → Vô nghĩa.

```javascript
  user.password = newPassword;
  await user.save();
```
- GÁN password mới (text thường). Dông dài KHÔNG hash ở đây.
- Khi `.save()` chạy → `pre('save')` hook trong userModel sẽ tự động:
  1. Check `this.isModified('password')` → `true` (vừa đổi).
  2. Hash bằng bcrypt.
  3. Lưu hash xuống DB.
- Đây là sức mạnh của Model hooks: Logic hash tập trung 1 chỗ, không bao giờ quên.

```javascript
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });
```
- XÓA toàn bộ refresh token cũ. Buộc user phải login lại trên mọi thiết bị.
- Tại sao? Khi đổi password, mọi phiên đăng nhập cũ phải bị vô hiệu hóa (bảo mật).
- `validateBeforeSave: false`: Bỏ qua validate vì password vừa save rồi, refresh token không cần validate.

```javascript
  return { message: 'Đổi mật khẩu thành công' };
};
```

**Controller + Route:**
```javascript
// authController.js (thêm)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user._id, currentPassword, newPassword
    );
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
};

// authRoutes.js (thêm)
const { protect } = require('../middlewares/authMiddleware');
router.put('/change-password', protect, authController.changePassword);
```
- `protect` middleware trước `changePassword`: Phải login mới đổi được.
- `PUT /api/v1/auth/change-password`: Method PUT vì đang cập nhật tài nguyên (password).

---

# FILE 12: Search/Filter nâng cao (Bổ sung `taskService.js`)

```javascript
exports.searchTasks = async (projectId, searchQuery) => {
```
- `searchQuery`: Chuỗi tìm kiếm từ `req.query.q`. VD: URL `?q=login`.

```javascript
  const filter = {
    projectId: projectId,
    isDeleted: false
  };
```

```javascript
  if (searchQuery) {
    filter.$or = [
      { title: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } }
    ];
  }
```
- `$or`: Toán tử MongoDB OR. Thỏa BẤT KỲ điều kiện nào trong mảng → match.
- `$regex`: Toán tử tìm kiếm bằng biểu thức chính quy (Regular Expression).
  - `{ title: { $regex: "login" } }`: Tìm documents có title CHỨA chuỗi "login" (không cần match toàn bộ).
  - SQL tương đương: `WHERE title LIKE '%login%'`.
- `$options: 'i'`: Case-insensitive. "login", "Login", "LOGIN" đều match.
- Kết hợp: Tìm trong title HOẶC description chứa chuỗi tìm kiếm.

```javascript
  const tasks = await Task.find(filter)
    .populate('assignee', 'name avatar')
    .sort({ createdAt: -1 });

  return tasks;
};
```

**Cập nhật `getProjectTasks` để hỗ trợ search:**
```javascript
exports.getProjectTasks = async (projectId, queryParams) => {
  const filter = { projectId, isDeleted: false };

  if (queryParams.status) filter.status = queryParams.status;
  if (queryParams.priority) filter.priority = queryParams.priority;
  if (queryParams.assignee) filter.assignee = queryParams.assignee;

  // Thêm search
  if (queryParams.q) {
    filter.$or = [
      { title: { $regex: queryParams.q, $options: 'i' } },
      { description: { $regex: queryParams.q, $options: 'i' } }
    ];
  }
```
- Gộp search vào `getProjectTasks` luôn. Client gọi `?q=login&status=Done` → Tìm task "login" trong cột Done.

---

# FILE 13: `public/js/board.js` (Bổ sung – Thanh Search/Filter UI)

```javascript
const searchInput = document.getElementById('search-input');
let searchTimeout;

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
```
- `let searchTimeout`: Biến lưu ID của timeout.
- `'input'` event: Phát mỗi khi user gõ 1 ký tự (liên tục).
- `clearTimeout(searchTimeout)`: Xóa timeout cũ.

```javascript
  searchTimeout = setTimeout(() => {
    loadBoard(e.target.value);
  }, 300);
});
```
- **Debounce technique**: Đợi user NGỪNG gõ 300ms rồi mới gọi API.
- Tại sao? Nếu gõ "login" (5 ký tự), không debounce → 5 API calls: "l", "lo", "log", "logi", "login".
- Debounce → Chỉ 1 call: "login" (sau khi ngừng gõ 300ms).
- `setTimeout(fn, 300)`: Hẹn giờ 300ms rồi gọi `fn`. Trả về ID.
- `clearTimeout(id)`: Hủy hẹn giờ cũ. Mỗi lần gõ thêm → Hủy → Đặt lại → Chỉ lần cuối chạy.

```javascript
async function loadBoard(searchQuery = '') {
  try {
    let url = `${API_BASE}/tasks`;
    if (searchQuery) {
      url += `?q=${encodeURIComponent(searchQuery)}`;
    }
```
- `encodeURIComponent(searchQuery)`: Mã hóa ký tự đặc biệt cho URL.
  - Input: `"task có dấu"` → Output: `"task%20c%C3%B3%20d%E1%BA%A5u"`.
  - Tại sao? URL không chấp nhận dấu cách, ký tự Unicode. Phải encode.

```javascript
    const response = await fetch(url, { headers: authHeaders() });
    // ... phần còn lại giống loadBoard cũ
```

---

# FILE 14: `src/views/user/profile.ejs` (Trang hồ sơ cá nhân)

```html
<%- include('../partials/_header') %>

<div class="profile-container">
  <div class="profile-card">
    <div class="avatar-section">
      <div class="avatar-wrapper" id="avatar-wrapper">
        <img id="avatar-img" src="" alt="Avatar" class="avatar-large">
        <div class="avatar-overlay">
          <span>📷 Đổi ảnh</span>
        </div>
      </div>
      <input type="file" id="avatar-input" accept="image/*" style="display: none;">
    </div>
```
- `avatar-wrapper`: Container bọc ảnh avatar + overlay chữ "Đổi ảnh".
- `avatar-overlay`: Lớp phủ tối mờ hiện khi hover lên avatar. Chứa icon camera.
- `<input type="file" ... style="display: none;">`: Input file ẨN. User không thấy.
  - `accept="image/*"`: Chỉ cho chọn file ảnh. Hộp thoại chọn file sẽ filter sẵn.

```html
    <form id="profile-form">
      <div class="form-group">
        <label for="profile-name">Họ và tên</label>
        <input type="text" id="profile-name" required>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="profile-email" disabled>
      </div>
```
- `disabled`: Input bị khóa, user không gõ được. Email không cho đổi.
- Hiện email nhưng chỉ để xem, không edit.

```html
      <button type="submit" class="btn-primary">Lưu thay đổi</button>
    </form>

    <hr>
    <h3>🔒 Đổi mật khẩu</h3>
    <form id="password-form">
      <div class="form-group">
        <label for="current-password">Mật khẩu hiện tại</label>
        <input type="password" id="current-password" required>
      </div>
      <div class="form-group">
        <label for="new-password">Mật khẩu mới</label>
        <input type="password" id="new-password" required minlength="6">
      </div>
      <button type="submit" class="btn-primary">Đổi mật khẩu</button>
    </form>
  </div>
</div>

<script src="/js/profile.js"></script>
<%- include('../partials/_footer') %>
```

---

# FILE 15: `public/js/profile.js`

### Load profile

```javascript
async function loadProfile() {
  const response = await fetch('/api/v1/users/profile', {
    headers: authHeaders()
  });
  const data = await response.json();
  const user = data.data.user;

  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-email').value = user.email;
  document.getElementById('avatar-img').src = user.avatar || '/images/default-avatar.png';
}
```
- Gán giá trị user vào form inputs.
- `user.avatar || '/images/default-avatar.png'`: Nếu chưa upload avatar → Dùng ảnh mặc định.

### Upload Avatar khi click

```javascript
document.getElementById('avatar-wrapper').addEventListener('click', () => {
  document.getElementById('avatar-input').click();
});
```
- Click vào avatar wrapper → Trigger click ẩn lên input file → Mở hộp thoại chọn file.
- Kỹ thuật "proxy click": Ẩn input xấu mặc định, dùng UI đẹp tự thiết kế làm trigger.

```javascript
document.getElementById('avatar-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
```
- `'change'` event: Phát khi user chọn file xong (bấm OK trong hộp thoại).
- `e.target.files[0]`: Lấy file đầu tiên (vì input không có `multiple`).
- `files` là FileList (giống mảng nhưng không phải mảng). `[0]` = file đầu tiên.

```javascript
  const formData = new FormData();
  formData.append('avatar', file);
```
- `FormData`: Object chứa dữ liệu dạng `multipart/form-data` (định dạng upload file).
- `.append('avatar', file)`: Thêm file vào FormData với key `'avatar'`.
  - Key `'avatar'` phải khớp với `upload.single('avatar')` ở route backend.
- KHÔNG dùng `JSON.stringify` cho file. File nhị phân phải gửi qua FormData.

```javascript
  try {
    const response = await fetch('/api/v1/users/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
```
- **KHÔNG set `Content-Type` header!** Fetch tự set `Content-Type: multipart/form-data; boundary=...`.
  - Nếu tự set `Content-Type: multipart/form-data` → Thiếu `boundary` → Server parse lỗi.
  - `boundary`: Chuỗi ngẫu nhiên ngăn cách giữa các trường trong formdata. Fetch tự tạo.

```javascript
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    document.getElementById('avatar-img').src = data.data.user.avatar;
    alert('Cập nhật avatar thành công!');
```
- Sau upload: Cập nhật ảnh trên giao diện ngay (không cần reload trang).

### Lưu profile name

```javascript
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('profile-name').value.trim();

  const response = await fetch('/api/v1/users/profile', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ name })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  alert('Cập nhật thành công!');
});
```

### Đổi mật khẩu

```javascript
document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;

  const response = await fetch('/api/v1/auth/change-password', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message);

  alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
});
```
- Sau khi đổi password: Xóa token khỏi localStorage → Redirect về login.
- `localStorage.removeItem('accessToken')`: Xóa 1 key cụ thể.
- Tại sao redirect? Server đã xóa refreshToken trong DB → Token cũ vô hiệu → Phải login lại.

---

# FILE 16: Cấu hình Deploy lên Render (`render.yaml` hoặc Dashboard)

### Bước 1: Chuẩn bị code

```javascript
// package.json – đảm bảo "start" script đúng
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js"
}
```
- Render dùng `npm start` để chạy app. Phải trỏ đúng file entry.

### Bước 2: Cấu hình Environment Variables trên Render Dashboard

```
PORT=10000                        ← Render tự gán, thường 10000
MONGODB_URI=mongodb+srv://...     ← Copy từ MongoDB Atlas
NODE_ENV=production               ← QUAN TRỌNG: đổi sang production
JWT_SECRET=chuoi_bi_mat_xxx       ← Giữ bí mật
JWT_REFRESH_SECRET=chuoi_xxx      ← Giữ bí mật
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```
- `NODE_ENV=production`: Tắt morgan log + ẩn stack trace lỗi → Bảo mật + Hiệu suất.

### Bước 3: Whitelist IP MongoDB Atlas

- Vào MongoDB Atlas → Network Access → Add IP Address → `0.0.0.0/0` (Allow from anywhere).
- Render dùng dynamic IP → Không thể whitelist cụ thể → Phải mở toàn bộ.

### Bước 4: Tạo Web Service trên Render

1. Đăng nhập [render.com](https://render.com) → New → Web Service.
2. Kết nối GitHub repo `taskflow-backend`.
3. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance: Free (0$).
4. Add tất cả Environment Variables từ bước 2.
5. Bấm Deploy.

### Bước 5: Kiểm tra

```
https://taskflow-backend-xxxx.onrender.com/api/v1/health
```
- Phải trả JSON: `{ "status": "success", "message": "Server đang chạy!" }`.
- Nếu lỗi: Vào Render Dashboard → Logs → Đọc error log.
