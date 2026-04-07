# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 4 (FINAL: LOGOUT, NAVBAR, MEMBER UI, TỔNG HỢP APP.JS)

Sprint cuối cùng: Hoàn thiện Logout, Navbar động, Quản lý thành viên Frontend, tổng hợp toàn bộ `app.js`, và file `server.js` hoàn chỉnh.

---

# FILE 1: Logout API (Bổ sung `authService.js`)

```javascript
exports.logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: undefined });
```
- `{ refreshToken: undefined }`: Xóa refresh token khỏi DB.
- Khi refresh token bị xóa → Hacker dù có refresh token cũ cũng không thể lấy access token mới (vì service so sánh token trong DB = undefined ≠ token gửi lên).

```javascript
  return { message: 'Đăng xuất thành công' };
};
```

**Controller:**
```javascript
exports.logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    next(error);
  }
};
```

**Route (thêm vào `authRoutes.js`):**
```javascript
router.post('/logout', protect, authController.logout);
```
- `protect`: Phải đang login mới logout được (cần biết userId để xóa refresh token).
- `POST /api/v1/auth/logout`.

---

# FILE 2: `src/views/partials/_header.ejs` (Phiên bản hoàn chỉnh – Navbar động)

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= typeof title !== 'undefined' ? title : 'TaskFlow' %></title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```
- `fonts.googleapis.com`: Nhúng font Inter từ Google Fonts.
- `wght@400;500;600;700`: Chỉ tải 4 độ đậm cần thiết (tiết kiệm bandwidth).
- `display=swap`: Hiện text bằng font fallback trước, đổi sang Inter khi load xong → Tránh FOUT (Flash of Unstyled Text) gây trống trang.

```html
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/board.css">
  <link rel="stylesheet" href="/css/dashboard.css">
</head>
<body>
```
- Load 3 file CSS. Trình duyệt load song song.

```html
  <nav class="navbar">
    <div class="navbar-brand">
      <a href="/projects" class="logo">
        <span class="logo-icon">📋</span>
        <span class="logo-text">TaskFlow</span>
      </a>
    </div>
    <div class="navbar-menu" id="navbar-menu">
      <!-- JS sẽ render menu items vào đây -->
    </div>
  </nav>
```
- `id="navbar-menu"`: Container rỗng. JS sẽ kiểm tra login state và render menu tương ứng.

```html
  <script>
    // Inline script nhỏ chạy ngay khi HTML load
    (function() {
```
- `(function() { ... })()`: IIFE (Immediately Invoked Function Expression).
  - Hàm tự gọi ngay khi được khai báo.
  - Tại sao dùng IIFE? Để tạo scope riêng → Biến bên trong không ô nhiễm global scope.

```javascript
      const token = localStorage.getItem('accessToken');
      const menu = document.getElementById('navbar-menu');
```
- Kiểm tra có token trong localStorage không.

```javascript
      if (token) {
        menu.innerHTML = `
          <a href="/projects" class="nav-link">Dự Án</a>
          <a href="/dashboard" class="nav-link">Dashboard</a>
          <a href="/profile" class="nav-link">Hồ Sơ</a>
          <button class="btn-logout" id="btn-logout">Đăng Xuất</button>
        `;
```
- Nếu CÓ token (đã login) → Hiện menu đầy đủ: Dự Án, Dashboard, Hồ Sơ, Đăng Xuất.

```javascript
        document.getElementById('btn-logout').addEventListener('click', async () => {
          try {
            await fetch('/api/v1/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (e) {
            // Bỏ qua lỗi network – dù API fail vẫn logout phía client
          }
```
- Gọi API logout (xóa refresh token trên server).
- `try-catch` bọc: Nếu server chết (không gọi được API) → Vẫn tiếp tục logout phía client.
- Logout client-side quan trọng hơn server-side vì nó xóa token khỏi trình duyệt.

```javascript
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        });
```
- Xóa 2 token khỏi localStorage → Trình duyệt "quên" đăng nhập.
- Redirect về trang login.

```javascript
      } else {
        menu.innerHTML = `
          <a href="/login" class="nav-link">Đăng Nhập</a>
          <a href="/register" class="nav-link nav-link-primary">Đăng Ký</a>
        `;
      }
    })();
  </script>
```
- Nếu KHÔNG có token (chưa login) → Chỉ hiện 2 link: Đăng Nhập, Đăng Ký.
- `nav-link-primary`: CSS class làm nút Đăng Ký nổi bật hơn (màu chính, viền).

---

# FILE 3: CSS Navbar hoàn chỉnh (thêm vào `style.css`)

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  height: 64px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
```
- `position: sticky`: Navbar dính ở đầu trang khi scroll xuống.
  - `sticky` = kết hợp `relative` và `fixed`. Bình thường nằm trong flow, khi scroll qua vị trí `top: 0` thì dính.
- `z-index: 100`: Nằm trên nội dung trang (nhưng dưới modal `z-index: 1000`).
- `height: 64px`: Chiều cao cố định. Chuẩn Material Design.

```css
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 700;
  font-size: 1.25rem;
}
```
- `text-decoration: none`: Bỏ gạch chân mặc định của `<a>`.
- `gap: 0.5rem`: Khoảng cách giữa icon emoji và chữ "TaskFlow".

```css
.navbar-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-muted);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s ease, background 0.2s ease;
}

.nav-link:hover {
  color: var(--primary-color);
  background: #f1f5f9;
}
```
- Hover: Chữ đổi sang indigo, nền xám nhẹ → Phản hồi trực quan.

```css
.nav-link-primary {
  background: var(--primary-color);
  color: white !important;
  border-radius: 8px;
}

.nav-link-primary:hover {
  background: var(--primary-hover);
}
```
- Nút Đăng Ký nổi bật: Nền indigo, chữ trắng.
- `!important`: Ép buộc ghi đè `color: var(--text-muted)` từ `.nav-link` cha.

```css
.btn-logout {
  background: none;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.btn-logout:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
}
```
- Nút Đăng Xuất: Viền nhẹ, hover đổi sang đỏ → Cảnh báo hành động nguy hiểm.

---

# FILE 4: `public/js/board.js` (Bổ sung – Quản lý thành viên trên Board)

### Nút mời thành viên trên Board Header

```javascript
const btnMembers = document.getElementById('btn-manage-members');

btnMembers.addEventListener('click', () => {
  showMembersModal();
});
```

### Modal quản lý thành viên

```javascript
async function showMembersModal() {
  let modal = document.getElementById('members-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'members-modal';
  modal.className = 'modal-overlay';
```

```javascript
  // Fetch danh sách thành viên
  const response = await fetch(`${API_BASE}/members`, {
    headers: authHeaders()
  });
  const data = await response.json();
  const { owner, members } = data.data;
```
- `{ owner, members }`: Destructuring. `owner` = object chủ dự án, `members` = mảng thành viên.

```javascript
  let membersHTML = members.map(member => {
    const isOwner = member._id === owner._id;
```
- Kiểm tra member này có phải owner hay không (để hiện badge "Chủ dự án").

```javascript
    return `
      <div class="member-item">
        <div class="member-info">
          <img src="${member.avatar || '/images/default-avatar.png'}" class="avatar-small">
          <div>
            <strong>${member.name}</strong>
            ${isOwner ? '<span class="badge-owner">👑 Chủ dự án</span>' : ''}
            <br>
            <span class="text-muted">${member.email}</span>
          </div>
        </div>
        ${!isOwner ? `
          <button class="btn-danger-small" onclick="removeMember('${member._id}')">
            Xóa
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
```
- `.map(...)`: Tạo mảng HTML string cho mỗi member.
- `${isOwner ? '<span>👑...</span>' : ''}`: Nếu là owner → Hiện crown emoji. Nếu không → Bỏ trống.
- `${!isOwner ? '<button ...>Xóa</button>' : ''}`: Nút Xóa chỉ hiện cho member thường, KHÔNG hiện cho owner.
- `onclick="removeMember('${member._id}')"`: Gọi hàm JS khi bấm. Truyền member ID.
- `.join('')`: Nối mảng HTML string thành 1 chuỗi duy nhất (không có dấu phẩy).

```javascript
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</div>
      <h2>👥 Thành Viên Dự Án</h2>

      <form id="invite-form" style="margin-bottom: 1.5rem;">
        <div class="form-group" style="display: flex; gap: 0.5rem;">
          <input type="email" id="invite-email" placeholder="Nhập email để mời..." style="flex: 1;">
          <button type="submit" class="btn-primary">Mời</button>
        </div>
      </form>

      <div id="members-list">${membersHTML}</div>
    </div>
  `;
```
- `this.closest('.modal-overlay').remove()`: Khi click nút ✕, tìm ancestor gần nhất có class `modal-overlay` rồi xóa.
  - `.closest(selector)`: Duyệt lên cây DOM tìm element cha gần nhất khớp selector.
- `style="flex: 1"`: Input email chiếm hết chiều rộng còn lại (nút "Mời" chiếm phần còn lại).

```javascript
  document.body.appendChild(modal);
  modal.style.display = 'flex';
```

### Xử lý mời thành viên

```javascript
  document.getElementById('invite-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('invite-email').value.trim();
    if (!email) return;

    try {
      const response = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      alert('Mời thành viên thành công!');
      modal.remove();
      showMembersModal(); // Reload modal hiện member mới
    } catch (error) {
      alert(error.message);
    }
  });
}
```
- Sau mời thành công: Đóng modal cũ → Mở lại (reload) để hiện member mới trong danh sách.

### Xử lý xóa thành viên

```javascript
async function removeMember(memberId) {
  if (!confirm('Bạn chắc chắn muốn xóa thành viên này?')) return;
```
- `confirm(...)`: Hộp thoại xác nhận OK/Cancel. Trả `true` nếu OK, `false` nếu Cancel.
- `!confirm(...)`: Nếu Cancel → `return` → Dừng hàm.
- Tại sao hỏi xác nhận? Xóa thành viên là hành động không thể undo dễ dàng.

```javascript
  try {
    const response = await fetch(`${API_BASE}/members/${memberId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    const memberModal = document.getElementById('members-modal');
    if (memberModal) memberModal.remove();
    showMembersModal();
  } catch (error) {
    alert(error.message);
  }
}
```
- `method: 'DELETE'`: HTTP DELETE = xóa tài nguyên.
- Sau xóa: Reload modal hiện danh sách đã cập nhật.

---

# FILE 5: `src/app.js` HOÀN CHỈNH (Toàn bộ routes đã gắn)

```javascript
// ========== IMPORT THƯ VIỆN ==========
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// ========== IMPORT CUSTOM MODULES ==========
const AppError = require('./utils/AppError');
const { errorHandler } = require('./middlewares/errorHandler');

// ========== IMPORT ROUTES ==========
const viewRoutes = require('./routes/viewRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
```
- Import tất cả routes. Mỗi file route quản lý 1 chức năng.

```javascript
// ========== KHỞI TẠO APP ==========
const app = express();

// ========== MIDDLEWARE CHUNG ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ========== VIEW ENGINE ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '../public')));
```
- Phần này giải thích rồi ở Sprint 1 Part 2.

```javascript
// ========== GẮN ROUTES ==========

// 1. View Routes (render trang HTML) – ĐẶT TRƯỚC API routes
app.use('/', viewRoutes);

// 2. API Routes
app.use('/api/v1/auth', authRoutes);          // /api/v1/auth/login, /register, /logout
app.use('/api/v1/projects', projectRoutes);    // /api/v1/projects, /projects/:id
app.use('/api/v1/users', userRoutes);          // /api/v1/users/profile, /avatar
app.use('/api/v1/dashboard', dashboardRoutes); // /api/v1/dashboard/stats
```
- **THỨ TỰ QUAN TRỌNG:**
  1. View Routes trước: Khi gõ `/projects`, Express khớp viewRoutes trước → Render HTML.
  2. API Routes sau: Khi gọi `/api/v1/projects`, Express khớp projectRoutes → Trả JSON.
  3. Error handlers cuối cùng.

```javascript
// ========== XỬ LÝ ROUTE KHÔNG TỒN TẠI ==========
app.all('*', (req, res, next) => {
  next(new AppError(`Không tìm thấy ${req.originalUrl} trên server`, 404));
});

// ========== ERROR HANDLER (CUỐI CÙNG) ==========
app.use(errorHandler);

// ========== XUẤT APP ==========
module.exports = app;
```

---

# FILE 6: `src/server.js` HOÀN CHỈNH (Với Socket.io)

```javascript
// ĐỌC BIẾN MÔI TRƯỜNG – DÒNG ĐẦU TIÊN
require('dotenv').config();

// IMPORTS
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

// KẾT NỐI DATABASE
connectDB();

// TẠO HTTP SERVER (để gắn Socket.io)
const server = http.createServer(app);

// KHỞI TẠO SOCKET.IO
initSocket(server);

// KHỞI CHẠY SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 http://localhost:${PORT}`);
});
```

---

# FILE 7: `.env` HOÀN CHỈNH (Template mẫu)

```env
# ===== SERVER =====
PORT=5000
NODE_ENV=development

# ===== DATABASE =====
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority

# ===== JWT =====
JWT_SECRET=taskflow_super_secret_key_2026_abc123!@#
JWT_REFRESH_SECRET=taskflow_refresh_secret_key_2026_xyz789!@#
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# ===== CLOUDINARY =====
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# FILE 8: Cấu trúc thư mục cuối cùng

```
taskflow-backend/
├── .env                          ← Biến môi trường (KHÔNG push GitHub)
├── .gitignore                    ← Bỏ qua node_modules, .env
├── package.json                  ← Quản lý dependencies + scripts
├── public/                       ← File tĩnh (CSS, JS client, ảnh)
│   ├── css/
│   │   ├── style.css             ← CSS chung (reset, form, modal, navbar)
│   │   ├── board.css             ← CSS trang Board Kanban
│   │   └── dashboard.css         ← CSS trang Dashboard
│   ├── js/
│   │   ├── auth.js               ← JS đăng nhập/đăng ký
│   │   ├── projects.js           ← JS trang danh sách project
│   │   ├── board.js              ← JS trang Board + Socket.io client
│   │   ├── dashboard.js          ← JS trang Dashboard
│   │   └── profile.js            ← JS trang Profile + upload avatar
│   └── images/
│       └── default-avatar.png    ← Ảnh mặc định khi chưa có avatar
│
└── src/                          ← Source code server
    ├── app.js                    ← Cấu hình Express + gắn routes
    ├── server.js                 ← Khởi chạy server + Socket.io
    │
    ├── config/
    │   ├── db.js                 ← Kết nối MongoDB
    │   ├── cloudinary.js         ← Cấu hình Cloudinary
    │   └── socket.js             ← Cấu hình Socket.io
    │
    ├── models/
    │   ├── userModel.js          ← Schema User (bcrypt hooks)
    │   ├── projectModel.js       ← Schema Project (owner, members)
    │   ├── taskModel.js          ← Schema Task (status, priority, deadline)
    │   └── commentModel.js       ← Schema Comment (taskId, author)
    │
    ├── services/
    │   ├── authService.js        ← Logic: register, login, refresh, changePassword, logout
    │   ├── projectService.js     ← Logic: CRUD project, addMember, removeMember
    │   ├── taskService.js        ← Logic: CRUD task, search/filter, soft delete
    │   ├── commentService.js     ← Logic: addComment, getComments
    │   ├── dashboardService.js   ← Logic: thống kê stats
    │   └── userService.js        ← Logic: profile, uploadAvatar
    │
    ├── controllers/
    │   ├── authController.js     ← Điều phối Auth
    │   ├── projectController.js  ← Điều phối Project
    │   ├── taskController.js     ← Điều phối Task
    │   ├── commentController.js  ← Điều phối Comment
    │   ├── dashboardController.js← Điều phối Dashboard
    │   └── userController.js     ← Điều phối User
    │
    ├── routes/
    │   ├── viewRoutes.js         ← Render trang EJS (/, /login, /projects, /board)
    │   ├── authRoutes.js         ← API Auth endpoints
    │   ├── projectRoutes.js      ← API Project endpoints + nested task routes
    │   ├── taskRoutes.js         ← API Task endpoints + nested comment routes
    │   ├── commentRoutes.js      ← API Comment endpoints
    │   ├── dashboardRoutes.js    ← API Dashboard endpoints
    │   └── userRoutes.js         ← API User/Profile endpoints
    │
    ├── middlewares/
    │   ├── authMiddleware.js     ← protect (check JWT)
    │   ├── checkProjectMembership.js ← Check user thuộc project
    │   ├── restrictToOwner.js    ← Check user là owner
    │   ├── errorHandler.js       ← Global error handler
    │   └── upload.js             ← Multer middleware (file upload)
    │
    ├── utils/
    │   ├── AppError.js           ← Class lỗi tùy chỉnh
    │   └── generateToken.js      ← Tạo JWT tokens
    │
    └── views/
        ├── partials/
        │   ├── _header.ejs       ← HTML head + navbar
        │   └── _footer.ejs       ← Footer + close body/html
        ├── auth/
        │   ├── login.ejs         ← Form đăng nhập
        │   └── register.ejs      ← Form đăng ký
        ├── project/
        │   ├── index.ejs         ← Grid danh sách project
        │   └── board.ejs         ← Board Kanban 3 cột
        ├── dashboard/
        │   └── index.ejs         ← Trang thống kê
        └── user/
            └── profile.ejs       ← Trang hồ sơ cá nhân
```

---

# TỔNG KẾT TOÀN BỘ DỰ ÁN

### Số file code đã giải thích chi tiết: **~45 file** qua 9 phần tài liệu

| Sprint | Phần | Nội dung chính |
|:---:|:---:|:---|
| **S1** | Part 1 | .env, db.js, AppError, errorHandler, userModel, generateToken, authMiddleware |
| **S1** | Part 2 | authService, authController, authRoutes, app.js, server.js, 3 Models |
| **S1** | Part 3 | EJS partials, CSS chính, login/register EJS, auth.js client, viewRoutes |
| **S2** | Part 1 | checkProjectMembership, restrictToOwner, projectService, projectController, projectRoutes, taskService, taskController, taskRoutes |
| **S2** | Part 2 | commentService, commentController, commentRoutes, project/index.ejs, projects.js, board.ejs, board.js |
| **S2** | Part 3 | board.css, task detail modal JS, comments JS, viewRoutes mở rộng, modal/comment CSS |
| **S2** | Part 4 | Socket.io config, server.js tích hợp, emit events từ service, client socket.io |
| **S3** | Part 1 | Dashboard EJS+JS+CSS, Cloudinary config, Multer upload, userService, avatar upload, soft delete task, member management |
| **S3** | Part 2 | changePassword, search/filter ($regex), profile EJS+JS, deploy Render |
| **S4** | Final | Logout, navbar động, member UI, app.js hoàn chỉnh, server.js hoàn chỉnh, .env template, cấu trúc thư mục final |

### Luồng dữ liệu xuyên suốt ứng dụng:

```
┌─────────────────────────────────────────────────────────────┐
│                    LUỒNG REQUEST                            │
│                                                             │
│  Trình duyệt                                               │
│     │                                                       │
│     ├─── GET /projects ──────> viewRoutes ──> EJS render    │
│     │                                                       │
│     ├─── POST /api/v1/auth ──> authRoutes ──> middleware    │
│     │                          └─> controller               │
│     │                              └─> service              │
│     │                                  └─> model ──> MongoDB│
│     │                                                       │
│     ├─── WebSocket ──────────> socket.js                    │
│     │    connect                └─> auth middleware          │
│     │    joinProject               └─> join room            │
│     │                                                       │
│     │  ┌──── taskUpdated ◄──── io.to(room).emit()           │
│     │  │                       ↑ gọi từ taskService         │
│     │  ▼                                                    │
│     │  board.js loadBoard()                                 │
│                                                             │
│  Tầng:  Route → Controller → Service → Model → MongoDB     │
│         (URL)    (req/res)    (logic)   (schema) (data)     │
└─────────────────────────────────────────────────────────────┘
```
