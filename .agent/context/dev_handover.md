# TÀI LIỆU KỸ THUẬT PHÁT TRIỂN DỰ ÁN (DEV HANDOVER)
**Dự án:** TaskFlow – Hệ thống quản lý công việc (Mini Trello)
**Quy mô thời gian:** 2 tuần (Hoàn thiện chức năng & Triển khai)

---

## 1. TECH STACK (CÔNG NGHỆ BẮT BUỘC SỬ DỤNG)
* **Backend Framework:** Node.js + Express.js.
* **Cơ sở dữ liệu:** MongoDB (Atlas Cloud) giao tiếp qua thư viện **Mongoose v8+**.
* **Bảo mật & Phiên:** `bcrypt` (mã hóa mật khẩu), `jsonwebtoken` (Access + Refresh Token đính kèm Middleware bảo vệ Route).
* **Giao tiếp Realtime:** Socket.io.
* **Cấu trúc & Tiêu chuẩn:** Mô hình MVC (hoặc Folder-by-Feature), biến môi trường (`dotenv`), Global Error Handling.
* **Triển khai (Deploy):** Render, Railway hoặc Vercel.

---

## 2. THIẾT KẾ DATA SCHEMA (MONGODB + MONGOOSE)
Team Dev cần tạo 4 bảng (Collections) gốc và ánh xạ (References) chuẩn để tiện dùng `.populate()`.

### A. Bảng `Users`
* `_id`: ObjectId
* `email`: String (Unique, Required, Match Regex)
* `password`: String (Lưu chuỗi đã được Hash bằng bcrypt)
* `name`: String
* `avatar`: String (Nâng cao: Link URL cloudinary/local file)
* *Khuyến nghị:* Ẩn trường `password` khi return JSON (dùng tính năng `.select('-password')` của mongoose).

### B. Bảng `Projects`
* `_id`: ObjectId
* `name`: String (Required)
* `description`: String
* `owner`: ObjectId (Ref -> `User`) - Cần để check quyền xóa dự án.
* `members`: Array của ObjectId (Ref -> `User`).
* `isDeleted`: Boolean (Soft Delete - Default: false).

### C. Bảng `Tasks`
* `_id`: ObjectId
* `projectId`: ObjectId (Ref -> `Project`, Required)
* `title`: String (Required)
* `description`: String
* `status`: Enum String (`'To Do'`, `'In Progress'`, `'Done'`) - Mặc định là 'To Do'
* `priority`: Enum String (`'Low'`, `'Medium'`, `'High'`) 
* `deadline`: Date
* `assignee`: ObjectId (Ref -> `User` - Cần check là user này phải tồn tại trong project.members)
* `isDeleted`: Boolean (Soft Delete).

### D. Bảng `Comments`
* `_id`: ObjectId
* `taskId`: ObjectId (Ref -> `Task`, Required)
* `author`: ObjectId (Ref -> `User`, Required)
* `content`: String (Required)
* `createdAt` / `updatedAt`: Timestamps tự động của Mongoose.

---

## 3. THIẾT KẾ CẤU TRÚC THƯ MỤC CỐT LÕI (MVC STANDARD)
Dựa theo tài liệu Skill kiến trúc dự án, team nên theo khung sau:
```text
TaskFlow_Backend/
│
├── config/             # Cấu hình Database, Socket, Multer...
├── controllers/        # Nơi chứa Business Logic (Auth, Project, Task, Comment)
├── models/             # Chứa 4 Schema (Database) Mongoose
├── routes/             # Định tuyến API (AuthRoutes, ProjectRoutes...)
├── middlewares/        # Bảo vệ API (AuthMiddleware, RoleMiddleware, Validate...)
├── utils/              # Chứa Global Error Handler, Email service, Token Generator
├── servers.js / app.js # Chứa cấu hình Express App & kết nối Socket.io Server
├── .env                # Biến môi trường KHÔNG PUSH LÊN GITHUB
└── package.json
```

---

## 4. QUY CHUẨN API ENDPOINT & PHÂN QUYỀN LUỒNG (ROUTING)

**Nguyên tắc chung:**
- Response mẫu luôn phải quy chuẩn đồng nhất. Ví dụ:
  `{ "status": "success", "data": {...}, "message": "..." }`
- Mọi API dưới đây (trừ Auth) đều chạy qua `AuthMiddleware` (Kiểm tra token).

**A. Authentication APIs (Module Auth)**
* `POST /api/auth/register` : Đăng ký User mới.
* `POST /api/auth/login` : Đăng nhập -> Trả về Access Token & Refresh Token.
* `POST /api/auth/refresh-token` : Gia hạn token mới khi cái cũ hết hạn.

**B. Project APIs**
* `POST /api/projects` : Tạo Project mới (Gán user gọi hàm thành `owner`).
* `GET /api/projects` : Lấy danh sách Project mà user (đang đăng nhập) là owner hoặc member.
* `PUT /api/projects/:id` : Sửa dự án.
* `DELETE /api/projects/:id` : Xóa dự án (Chỉ cho phép user gọi có id === `project.owner`).
* `POST /api/projects/:id/members`: Thêm member vào dự án.

**C. Task APIs**
Luồng kiểm tra bảo mật (Critical Security Check): Trước khi thao tác tạo/sửa/xoá task, phải kiểm tra xem User có nằm trong `members` của Project đó.
* `GET /api/projects/:projectId/tasks` : Lấy toàn bộ task trong project (Hỗ trợ Filter qua query như `?status=Done&priority=High`).
* `POST /api/projects/:projectId/tasks` : Tạo task.
* `PUT /api/tasks/:taskId` : Cập nhật task (status, assignee).
* `GET /api/users/me/tasks` : API Dashboard Cá Nhân (Lấy tất cả task gán cho tôi đang overdue hoặc inprogress).

**D. Comment APIs**
* `POST /api/tasks/:taskId/comments`: Thêm bình luận.

---

## 5. THỰC THI SỰ KIỆN REALTIME (SOCKET.IO) CẦN CODE

Team Dev phân công 1 thành viên xử lý chuyên biệt về Socket để tránh conflict.
- **Logic Room:** Bắt buộc sử dụng khái niệm "Room" trong Socket. Khi một user bấm vào xem Project có ID là "123", phía giao diện sẽ gửi lệnh emit lên server: `socket.emit("join_project", "123")`. Server sẽ đưa user này vào kênh `socket.join("123")`.
- **Phát Event (Emit Events):**
  - **Sự kiện thay đổi Status:** Khi gọi API `PUT /api/tasks/:id`, backend đổi DB thành công xong, chèn thêm đoạn call socket: `io.to(projectId).emit("task_status_updated", updatedTask)`
  - **Sự kiện Comment:** Backend đổi DB xong -> `io.to(projectId).emit("new_comment", commentData)`
  - **Sự kiện Assign:** Backend thông báo ai đó vừa bị gắn tên: `io.to(projectId).emit("task_assigned", payload)`

---

## 6. LƯU Ý GLOBAL ERROR HANDLING (ĐỂ LẤY ĐIỂM CẤU TRÚC)
- Cần có một file `errorHandler.js` làm Middleware nằm dưới cùng ở `app.js` (Dưới tất cả các Route).
- Mọi Controller thay vì `try-catch` và `res.status(500).send("Lỗi")`, bắt buộc dùng hàm `next(err)` truyền lỗi xuống Handler.
- Handler sẽ bắt và tự phân loại các loại lỗi phổ biến (Lỗi Validation của Mongoose, lỗi JWT hết hạn, ID sai format...) để trả mã Error Code (400, 401, 403, 404, 500) tương ứng.
