# HƯỚNG DẪN TỪNG BƯỚC – SPRINT 4: HOÀN THIỆN, KIỂM THỬ & ĐÓNG GÓI

Sprint cuối cùng: Polish UI, Bug fix, Seed Data, viết README, quay video demo, chuẩn bị nộp bài.

---

## S4-01: Hoàn thiện Navbar động + CSS Variables

**Mục tiêu:** Navbar thay đổi theo trạng thái đăng nhập. Khai báo CSS Variables toàn cục.

**Bước 1:** Mở `public/css/style.css`, thêm CSS Variables vào đầu file:
```css
:root {
  --primary-color: #6366f1;
  --primary-hover: #4f46e5;
  --danger-color: #ef4444;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --text-color: #1e293b;
  --text-muted: #94a3b8;
  --card-bg: #ffffff;
  --bg-color: #f8fafc;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
```

*Giải thích:*
- CSS Variables (`--ten-bien`): Khai báo 1 lần, dùng ở khắp nơi bằng `var(--ten-bien)`.
- Khi cần đổi toàn bộ theme (vd: dark mode), chỉ cần đổi giá trị trong `:root`.

**Bước 2:** Thêm CSS Reset + Base styles toàn cục:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}
```

**Bước 3:** Cập nhật `src/views/partials/_header.ejs` với inline script kiểm tra token:
- Có token → Menu: Dự Án, Dashboard, Hồ Sơ, Đăng Xuất.
- Không token → Menu: Đăng Nhập, Đăng Ký.
- Nút Đăng Xuất gọi API `POST /api/v1/auth/logout` rồi xóa localStorage, redirect `/login`.

**Bước 4:** Viết CSS Navbar (sticky, flex, hover effects).

**Kiểm tra:** Đăng nhập → Navbar hiện 4 mục. Đăng xuất → Chỉ còn 2 mục. Scroll xuống → Navbar dính đầu trang.

---

## S4-02: Thêm ảnh mặc định + CSS Utilities

**Mục tiêu:** Chuẩn bị asset tĩnh và các class CSS dùng chung.

**Bước 1:** Tạo ảnh `public/images/default-avatar.png` – Ảnh tròn xám với icon người (dùng bất kỳ ảnh placeholder nào, hoặc tạo 1 file SVG đơn giản).

**Bước 2:** Thêm CSS utilities vào `style.css`:
```css
.text-muted { color: var(--text-muted); }
.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s ease;
}
.btn-primary:hover { background: var(--primary-hover); }
.btn-secondary {
  background: #f1f5f9;
  color: var(--text-color);
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
}
.btn-danger-small {
  background: var(--danger-color);
  color: white;
  border: none;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}
.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 500;
  font-size: 0.9rem;
}
.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
}
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
```

*Giải thích:*
- `font-family: inherit`: Textarea/Select mặc định dùng font monospace. `inherit` buộc dùng font cha (Inter).
- `box-shadow: 0 0 0 3px rgba(...)`: Ring effect khi focus – giống chuẩn Tailwind CSS.

**Kiểm tra:** Mọi form trên toàn site hiển thị đồng nhất.

---

## S4-03: CSS cho Modal + Comment + Avatar

**Bước 1:** Thêm CSS modal vào `style.css`:
```css
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-card { background: white; border-radius: 12px; padding: 2rem; width: 90%; max-width: 480px; position: relative; max-height: 90vh; overflow-y: auto; }
.modal-large { max-width: 600px; }
.modal-close { position: absolute; top: 1rem; right: 1rem; font-size: 1.5rem; cursor: pointer; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; border-radius: 50%; }
.modal-close:hover { background: #f1f5f9; }
```

**Bước 2:** Thêm CSS comment:
```css
.comment-item { padding: 0.75rem; border-left: 3px solid var(--primary-color); background: #f8fafc; border-radius: 0 8px 8px 0; margin-bottom: 0.75rem; }
```

**Bước 3:** Thêm CSS avatar:
```css
.avatar-large { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; }
.avatar-small { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.avatar-wrapper { position: relative; cursor: pointer; display: inline-block; }
.avatar-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background: rgba(0,0,0,0.5); color: white; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.2s; }
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
```

*Giải thích:*
- `object-fit: cover`: Ảnh lấp đầy container, giữ tỷ lệ gốc (không méo). Phần thừa bị cắt.
- Avatar overlay ẩn mặc định (`opacity: 0`), hover mới hiện (`opacity: 1`) → UX chuyên nghiệp.

---

## S4-04: Tạo Seed Data cho Demo

**Mục tiêu:** Tạo dữ liệu mẫu để demo cho giáo viên.

**Bước 1:** Tạo file `src/utils/seedData.js`:
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const Comment = require('../models/commentModel');

const seedDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Xóa dữ liệu cũ
  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
  await Comment.deleteMany({});

  // Tạo users
  const user1 = await User.create({ name: 'Nguyễn Văn A', email: 'a@test.com', password: '123456' });
  const user2 = await User.create({ name: 'Trần Thị B', email: 'b@test.com', password: '123456' });
  const user3 = await User.create({ name: 'Lê Văn C', email: 'c@test.com', password: '123456' });

  // Tạo project
  const project = await Project.create({
    name: 'Dự án Website Bán Hàng',
    description: 'Phát triển website thương mại điện tử cho khách hàng',
    owner: user1._id,
    members: [user1._id, user2._id, user3._id]
  });

  // Tạo tasks
  const tasks = await Task.insertMany([
    { title: 'Thiết kế database', projectId: project._id, status: 'Done', priority: 'High', assignee: user1._id },
    { title: 'Viết API Auth', projectId: project._id, status: 'Done', priority: 'High', assignee: user2._id },
    { title: 'Viết API Products', projectId: project._id, status: 'In Progress', priority: 'Medium', assignee: user3._id },
    { title: 'Viết API Orders', projectId: project._id, status: 'In Progress', priority: 'Medium', assignee: user1._id },
    { title: 'Viết Frontend Login', projectId: project._id, status: 'To Do', priority: 'Low', assignee: user2._id },
    { title: 'Viết Frontend Dashboard', projectId: project._id, status: 'To Do', priority: 'Low', assignee: null,
      deadline: new Date('2026-04-01') },
    { title: 'Deploy lên Render', projectId: project._id, status: 'To Do', priority: 'High', assignee: null },
  ]);

  // Tạo comments
  await Comment.create({ taskId: tasks[0]._id, author: user2._id, content: 'Đã review, LGTM!' });
  await Comment.create({ taskId: tasks[0]._id, author: user1._id, content: 'Cảm ơn bạn đã review.' });
  await Comment.create({ taskId: tasks[2]._id, author: user3._id, content: 'Đang xử lý phần pagination.' });

  console.log('Seed data thành công!');
  process.exit(0);
};

seedDB();
```

**Bước 2:** Thêm script vào `package.json`:
```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "seed": "node src/utils/seedData.js"
}
```

**Bước 3:** Chạy seed:
```bash
npm run seed
```

*Giải thích:*
- `deleteMany({})`: Xóa TOÀN BỘ documents trong collection. `{}` = không lọc = xóa hết.
- `insertMany([...])`: Chèn nhiều documents 1 lần. Nhanh hơn `create()` nhiều lần.
- Task "Viết Frontend Dashboard" có deadline quá hạn → Dashboard sẽ hiện 1 task trễ hạn.

**Kiểm tra:** Đăng nhập `a@test.com / 123456` → Thấy 1 project, 7 tasks phân bổ 3 cột, 3 comments.

---

## S4-05: Viết file README.md

**Mục tiêu:** README chuyên nghiệp cho repo GitHub.

**Bước 1:** Tạo `README.md` ở thư mục gốc:
```markdown
# TaskFlow – Mini Trello

Ứng dụng quản lý công việc nhóm realtime sử dụng mô hình Kanban Board.

## 🚀 Công nghệ sử dụng

- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Frontend:** EJS, HTML/CSS/JavaScript
- **Realtime:** Socket.io
- **Xác thực:** JWT (Access/Refresh Token), Bcrypt
- **Upload ảnh:** Multer + Cloudinary
- **Deploy:** Render

## 📁 Kiến trúc

Kiến trúc 4 tầng: Route → Controller → Service → Model

## ⚡ Cài đặt

\`\`\`bash
git clone https://github.com/<tên>/taskflow-backend.git
cd taskflow-backend
npm install
cp .env.example .env  # Điền thông tin vào .env
npm run seed           # Tạo dữ liệu demo
npm run dev            # Chạy development server
\`\`\`

## 📋 API Endpoints

| Method | Endpoint | Mô tả |
|:---:|:---|:---|
| POST | /api/v1/auth/register | Đăng ký |
| POST | /api/v1/auth/login | Đăng nhập |
| POST | /api/v1/auth/logout | Đăng xuất |
| GET | /api/v1/projects | Danh sách dự án |
| POST | /api/v1/projects | Tạo dự án |
| GET | /api/v1/projects/:id/tasks | Tasks của project |
| POST | /api/v1/projects/:id/tasks | Tạo task |
| GET | /api/v1/dashboard/stats | Thống kê |

## 👥 Team

| STT | Tên | MSSV | Vai trò |
|:---:|:---|:---:|:---|
| 1 | ... | ... | Team Lead / Backend |
| 2 | ... | ... | Backend |
| 3 | ... | ... | Frontend |
| 4 | ... | ... | Tester / Docs |

## 📝 License

ISC
```

**Bước 2:** Tạo file `.env.example` (copy `.env`, xóa hết giá trị):
```env
PORT=5000
MONGODB_URI=
NODE_ENV=development
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

*Giải thích:*
- `.env.example` commit lên GitHub (an toàn vì không có giá trị bí mật).
- Người clone repo sẽ copy thành `.env` rồi tự điền giá trị.

---

## S4-06: Kiểm tra lỗi phổ biến + Bug Fix

**Mục tiêu:** Rà soát các lỗi thường gặp trước khi nộp bài.

**Checklist kiểm tra:**

| # | Kiểm tra | Cách test | Kỳ vọng |
|:---:|:---|:---|:---|
| 1 | Đăng ký trùng email | POST register 2 lần cùng email | 400 "Email đã được đăng ký" |
| 2 | Đăng nhập sai pass | POST login pass sai | 401 "Sai mật khẩu" |
| 3 | Truy cập không token | GET /projects (no header) | 401 "Bạn chưa đăng nhập" |
| 4 | Token hết hạn | Đợi 15 phút hoặc đổi JWT_EXPIRE=5s | 401 "Token đã hết hạn" |
| 5 | Refresh token | POST /refresh với refresh token | 200 + new access token |
| 6 | Tạo project thiếu tên | POST /projects `{}` | 400 validation error |
| 7 | Xem project không phải member | Dùng token user khác | 403 "Không phải thành viên" |
| 8 | Xóa project không phải owner | Dùng token member (không phải owner) | 403 "Chỉ chủ dự án" |
| 9 | Tạo task status sai enum | `{ "status": "ABC" }` | 400 validation error |
| 10 | Upload file .pdf | POST /avatar với file PDF | Error "Chỉ chấp nhận ảnh" |
| 11 | Route không tồn tại | GET /api/v1/xyz | 404 |
| 12 | ID MongoDB sai format | GET /projects/abcxyz | 400 "ID không hợp lệ" |
| 13 | Socket.io kết nối | Mở 2 tab, tạo task tab A | Tab B thấy task mới |
| 14 | Soft delete | DELETE task → GET tasks | Task đã xóa không hiện |

**Lỗi phổ biến cần fix:**
1. Quên `await` trước MongoDB query → Trả về Promise thay vì data.
2. Quên `next(error)` trong catch → Request treo mãi (timeout).
3. CSS không load → Kiểm tra `express.static` path.
4. EJS lỗi render → Kiểm tra `app.set('views', path.join(...))`.

---

## S4-07: Commit cuối + Quay Video Demo

**Bước 1:** Commit và push code hoàn chỉnh:
```bash
git add .
git commit -m "feat: hoàn thành MVP TaskFlow"
git push origin develop

# Merge develop vào main
git checkout main
git merge develop
git push origin main
```

**Bước 2:** Quay video demo (2-3 phút). Kịch bản:
1. Mở trình duyệt → Truy cập URL deploy.
2. Đăng ký tài khoản mới → Đăng nhập.
3. Tạo project mới.
4. Thêm 3 tasks (To Do, In Progress, Done).
5. Đổi status task (click card → select status → Lưu).
6. Thêm comment vào 1 task.
7. Mời thành viên vào project.
8. Mở 2 tab cùng project → Tab A thêm task → Tab B thấy task mới (realtime).
9. Vào Dashboard → Thấy thống kê.
10. Vào Profile → Upload avatar → Đổi tên.
11. Đăng xuất.

**Bước 3:** Kiểm tra Render deploy vẫn chạy → Gửi link cho giáo viên.

**Kiểm tra cuối cùng:**
- [ ] Tất cả 22 API endpoints hoạt động.
- [ ] Frontend 5 trang render đúng.
- [ ] Socket.io realtime hoạt động.
- [ ] README.md có trên GitHub.
- [ ] Video demo quay xong.
- [ ] Link Render deploy truy cập được.
