# KẾ HOẠCH PHÁT TRIỂN AGILE/SCRUM – DỰ ÁN TASKFLOW (TÍCH HỢP TEST)
**Thời gian:** 2 tuần (14 ngày) | **Team Size:** 4 người | **Deadline:** 17/04/2026

> **Nguyên tắc DoD (Definition of Done):** Một task chỉ được coi là HOÀN THÀNH khi:
> 1. Code chạy không lỗi.
> 2. Postman test pass tất cả test cases tương ứng (liệt kê ngay bên dưới mỗi task).
> 3. Đã xử lý Edge Cases (Gửi thiếu dữ liệu, Token sai, ID không tồn tại).
> 4. Đã được 1 người khác trong team review code.

---

## 1. PHÂN BỔ VAI TRÒ NHÓM (TEAM ROLES)

| Ký hiệu | Vai trò đề xuất | Trách nhiệm chính |
|:---:|:---|:---|
| **DEV-1** | Backend Lead (Scrum Master kiêm nhiệm) | Module Auth, Middleware, Error Handler, Dashboard, Review code |
| **DEV-2** | Backend Core | Module Project, Module Task (CRUD), Avatar Upload |
| **DEV-3** | Backend Realtime + Comment | Module Comment, Module Socket.io |
| **DEV-4** | Frontend (EJS) + DevOps | Toàn bộ Views/EJS, Public Assets, Deploy Render, README, Postman, Video Demo |

---

## 2. TỔNG QUAN 4 SPRINT

| Sprint | Thời gian | Tên giai đoạn | Mục tiêu chính |
|:---:|:---|:---|:---|
| **Sprint 1** | Ngày 1 → 3 | Foundation & Auth | Dựng xong Server, DB, hoàn thiện đăng ký/đăng nhập JWT |
| **Sprint 2** | Ngày 4 → 7 | Core CRUD | CRUD Project, Task, Comment. Phân quyền Owner/Member |
| **Sprint 3** | Ngày 8 → 11 | Realtime & Dashboard | Socket.io, Dashboard cá nhân, Filter/Search, Avatar |
| **Sprint 4** | Ngày 12 → 14 | Polish, Test & Deploy | Sửa bug, Deploy Render, Postman Export, Video Demo, README |

---

## 3. ĐẶC TẢ MICRO-TASK + TEST CASES TỪNG SPRINT

---

### 🟢 SPRINT 1: NỀN MÓNG & XÁC THỰC (Ngày 1 → 3)
**Sprint Goal:** *"Kết thúc Sprint này, hệ thống có thể Đăng ký, Đăng nhập, và chặn API bằng JWT Token."*

---

#### DEV-1 (Backend Lead)

**S1-01** | Khởi tạo repo GitHub, `.gitignore`, nhánh `develop` | SP: 1 | Ngày: D1
- *Không cần test – Task cấu hình.*

**S1-02** | `npm init`, cài dependencies (express, mongoose, dotenv, cors, morgan, bcrypt, jsonwebtoken, socket.io, nodemon) | SP: 1 | Ngày: D1
- *Test:* Chạy `npm start` không crash. `node -e "require('express')"` không lỗi.

**S1-03** | Tạo toàn bộ cấu trúc thư mục chuẩn MVC | SP: 2 | Ngày: D1
- *Test:* Kiểm tra tồn tại các folder: `src/config`, `controllers`, `models`, `services`, `routes`, `middlewares`, `utils`, `views`.

**S1-04** | Viết `src/config/db.js` – Kết nối MongoDB Atlas | SP: 2 | Ngày: D1
| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-01 | Kết nối DB với URI đúng | Console log "MongoDB Connected" | Happy |
| TC-02 | Kết nối DB với URI sai | Console log lỗi, process.exit(1) | Sad |

**S1-05** | Viết `src/app.js` – Express, cors, morgan, EJS, static, error handler | SP: 3 | Ngày: D1
- *Test:* `GET /` trả về 200 hoặc render trang EJS mà không crash.

**S1-06** | Viết `src/server.js` – Entry point, connectDB, PORT listen | SP: 2 | Ngày: D1
- *Test:* Terminal hiện "Server running on port 5000".

**S1-07** | Viết `src/middlewares/errorHandler.js` – AppError class + Global Middleware | SP: 3 | Ngày: D2
| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-03 | Gọi route không tồn tại | Status 404, JSON: { status: "fail", message: "..." } | Sad |
| TC-04 | Truyền ID sai format (CastError) | Status 404, message rõ ràng | Sad |

**S1-08** | Viết `src/models/userModel.js` – Schema, pre-save bcrypt, comparePassword | SP: 5 | Ngày: D2
| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-05 | Tạo user đầy đủ { name, email, password } | Document lưu thành công, password bắt đầu bằng `$2b$` | Happy |
| TC-06 | Tạo user thiếu email | ValidationError: "email is required" | Sad |
| TC-07 | Tạo user email sai format | ValidationError: "Email không hợp lệ" | Sad |
| TC-08 | Tạo user email trùng | Error code 11000 (Duplicate Key) | Sad |
| TC-09 | comparePassword("đúng_pass") | return true | Happy |
| TC-10 | comparePassword("sai_pass") | return false | Sad |

**S1-09** | Viết `src/services/authService.js` – register(), login() | SP: 5 | Ngày: D2
- *Test:* Gọi trực tiếp hàm service với params giả, kiểm tra return đúng object / throw đúng Error.

**S1-10** | Viết `src/controllers/authController.js` – register(), login() | SP: 3 | Ngày: D2

**S1-11** | Viết `src/routes/authRoutes.js` – POST /register, POST /login | SP: 1 | Ngày: D2

> **📮 Test tổng hợp cho S1-09 → S1-11 (API Register + Login):**

| TC | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-11 | Đăng ký thành công | POST /api/v1/auth/register { name, email, password } | 201, trả user object (KHÔNG có password) | Happy |
| TC-12 | Đăng ký thiếu field | Body thiếu email | 400, "Vui lòng cung cấp email" | Sad |
| TC-13 | Đăng ký email trùng | Email đã có trong DB | 400, "Email đã được đăng ký" | Sad |
| TC-14 | Đăng ký password ngắn | password: "123" | 400, "Mật khẩu phải lớn hơn 6 ký tự" | Sad |
| TC-15 | Đăng nhập thành công | POST /api/v1/auth/login { email, password đúng } | 200, accessToken + refreshToken | Happy |
| TC-16 | Đăng nhập sai password | password sai | 401, "Sai mật khẩu" | Sad |
| TC-17 | Đăng nhập email không tồn tại | email chưa đăng ký | 404, "Email chưa được đăng ký" | Sad |
| TC-18 | Đăng nhập thiếu field | Body rỗng {} | 400, "Vui lòng cung cấp email và mật khẩu" | Sad |

**S1-12** | Viết `src/middlewares/authMiddleware.js` – protect() verify JWT | SP: 5 | Ngày: D3
| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-19 | Header Bearer <valid_token> | Đi qua middleware, req.user được gắn | Happy |
| TC-20 | Không có header Authorization | 401, "Bạn chưa đăng nhập" | Sad |
| TC-21 | Token đã expire | 401, "Token hết hạn" | Sad |
| TC-22 | Token fake/bị sửa 1 ký tự | 401, "Token không hợp lệ" | Sad |

**S1-13** | Viết `src/utils/generateToken.js` – signAccessToken (15m), signRefreshToken (7d) | SP: 3 | Ngày: D3
- *Test:* Gọi hàm, decode JWT kiểm tra payload có `id`, `exp` đúng thời hạn.

**S1-14** | Viết API Refresh Token | SP: 5 | Ngày: D3
| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-23 | POST /api/v1/auth/refresh { refreshToken hợp lệ } | 200, trả accessToken mới | Happy |
| TC-24 | refreshToken đã bị thu hồi/xóa trong DB | 403, "Token bị thu hồi" | Sad |
| TC-25 | refreshToken hết hạn (>7 ngày) | 401, "Refresh token hết hạn" | Sad |

---

#### DEV-4 (Frontend + DevOps)

**S1-15** | Tạo `views/partials/_header.ejs`, `_footer.ejs` | SP: 2 | Ngày: D1
- *Test:* Include vào trang EJS bất kỳ, render không lỗi.

**S1-16** | Tạo `public/css/style.css` – Reset, biến màu, typography | SP: 3 | Ngày: D1
- *Test:* Mở trình duyệt, CSS load không bị 404.

**S1-17** | Viết `views/auth/login.ejs` (Form đăng nhập) | SP: 3 | Ngày: D2
- *Test:* Trang render đúng, form có 2 input (email, password) + nút Submit.

**S1-18** | Viết `views/auth/register.ejs` (Form đăng ký) | SP: 3 | Ngày: D2
- *Test:* Trang render đúng, form có 3 input (name, email, password).

**S1-19** | Viết `public/js/auth.js` – fetch API login/register, lưu token localStorage | SP: 5 | Ngày: D3
- *Test:* Bấm Submit -> gọi API -> nhận token -> `localStorage.getItem('token')` có giá trị.

**S1-20** | Viết `routes/viewRoutes.js` – GET /, /login, /register | SP: 2 | Ngày: D3
- *Test:* Truy cập trình duyệt `localhost:5000/login` hiện form.

**S1-21** | Tạo MongoDB Atlas, lấy Connection String, cấu hình `.env` | SP: 2 | Ngày: D1
- *Test:* Server khởi động, log "MongoDB Connected".

---

#### DEV-2 & DEV-3

**S1-22** | Nghiên cứu tài liệu skill | SP: 2 | Ngày: D1 | Cả 2
- *Không cần test.*

**S1-23** | Viết `models/projectModel.js` (Schema) | SP: 3 | Ngày: D2 | DEV-2
- *Test:* Tạo document Project với đầy đủ field, kiểm tra ref được khai báo đúng.

**S1-24** | Viết `models/taskModel.js` (Schema) | SP: 3 | Ngày: D2 | DEV-2
- *Test:* Tạo Task với status = "Hacking" -> Mongoose ném ValidationError (Enum chặn).

**S1-25** | Viết `models/commentModel.js` (Schema) | SP: 2 | Ngày: D2 | DEV-3
- *Test:* Tạo Comment thiếu content -> ValidationError.

**S1-26** | Test toàn bộ luồng Auth bằng Postman | SP: 3 | Ngày: D3 | Cả 2
- *Test:* Chạy lại TC-11 → TC-25 trên Postman, tất cả pass.

**✅ Sprint 1 Deliverable:** Server chạy, DB kết nối, 4 Model Schema xong, Auth API hoạt động, Postman test pass.

---

### 🔵 SPRINT 2: CRUD CỐT LÕI (Ngày 4 → 7)
**Sprint Goal:** *"Kết thúc Sprint này, hệ thống có thể tạo Project, mời Member, tạo/sửa/xóa Task, gửi Comment."*

---

#### DEV-2 (Project & Task)

**S2-01** | `projectService.js` – createProject() | SP: 3 | Ngày: D4
**S2-02** | `projectService.js` – getMyProjects() | SP: 3 | Ngày: D4
**S2-03** | `projectService.js` – addMember() | SP: 5 | Ngày: D4
**S2-04** | `projectService.js` – deleteProject() soft delete | SP: 3 | Ngày: D5
**S2-05** | `projectController.js` – create, getAll, addMember, delete | SP: 3 | Ngày: D5
**S2-06** | `projectRoutes.js` – POST /, GET /, POST /:id/members, DELETE /:id | SP: 2 | Ngày: D5

> **📮 Test tổng hợp cho S2-01 → S2-06 (Project APIs):**

| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-26 | POST /projects { name, desc } | 201, owner = req.user.id, members chứa owner | Happy |
| TC-27 | POST /projects thiếu tên | 400, "name is required" | Sad |
| TC-28 | GET /projects | 200, chỉ trả projects mà tôi là member/owner | Happy |
| TC-29 | GET /projects (user mới chưa có project) | 200, data: [] | Edge |
| TC-30 | POST /projects/:id/members { email hợp lệ } | 200, members tăng 1 | Happy |
| TC-31 | Thêm member - không phải owner | 403, "Chỉ chủ dự án mới có quyền" | Sad |
| TC-32 | Thêm member - email chưa đăng ký | 404, "Không tìm thấy tài khoản" | Sad |
| TC-33 | Thêm member đã có trong project | 400, "Thành viên đã có trong dự án" | Sad |
| TC-34 | DELETE /projects/:id (là owner) | 200, isDeleted = true | Happy |
| TC-35 | DELETE /projects/:id (là member thường) | 403, "Chỉ chủ dự án mới được xóa" | Sad |
| TC-36 | DELETE /projects/:id (ID không tồn tại) | 404, "Không tìm thấy dự án" | Sad |

**S2-07** | `taskService.js` – createTask() | SP: 5 | Ngày: D6
**S2-08** | `taskService.js` – updateTask() | SP: 5 | Ngày: D6
**S2-09** | `taskService.js` – getProjectTasks() + filter | SP: 5 | Ngày: D7
**S2-10** | `taskController.js` + `taskRoutes.js` (mergeParams) | SP: 3 | Ngày: D7

> **📮 Test tổng hợp cho S2-07 → S2-10 (Task APIs):**

| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-37 | POST /projects/:pId/tasks { đầy đủ } | 201, task.status = "To Do" | Happy |
| TC-38 | Tạo task - user không thuộc project | 403, "Bạn không có quyền" | Sad |
| TC-39 | Tạo task - assign người ngoài project | 400, "Người được giao không thuộc dự án" | Sad |
| TC-40 | PUT /tasks/:id { status: "In Progress" } | 200, status cập nhật | Happy |
| TC-41 | PUT /tasks/:id { status: "Hacking" } | 400, enum validation error | Sad |
| TC-42 | GET /projects/:pId/tasks?status=Done | 200, tất cả có status=Done | Happy |
| TC-43 | GET /projects/:pId/tasks?priority=High | 200, tất cả có priority=High | Happy |
| TC-44 | GET tasks project rỗng | 200, data: [] | Edge |

---

#### DEV-3 (Comment)

**S2-11** | `commentService.js` – addComment() | SP: 5 | Ngày: D4
**S2-12** | `commentService.js` – getCommentsByTask() | SP: 3 | Ngày: D5
**S2-13** | `commentController.js` + `commentRoutes.js` | SP: 3 | Ngày: D5

> **📮 Test tổng hợp cho S2-11 → S2-13 (Comment APIs):**

| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-45 | POST /tasks/:tId/comments { content } | 201, author = req.user.id | Happy |
| TC-46 | Comment nội dung rỗng | 400, "content is required" | Sad |
| TC-47 | Comment - user ngoài project | 403 | Sad |
| TC-48 | GET /tasks/:tId/comments | 200, sorted mới nhất, author populate (name, avatar) | Happy |

**S2-14** | Middleware `checkProjectMembership.js` | SP: 5 | Ngày: D6
- *Test:* User trong project -> next(). User ngoài project -> 403.

**S2-15** | Nghiên cứu Socket.io | SP: 3 | Ngày: D7
- *Không cần test – Task nghiên cứu.*

---

#### DEV-1 (Review & Support)

**S2-16** | Review PR cho DEV-2 (Project APIs) | SP: 2 | Ngày: D5
**S2-17** | Review PR cho DEV-3 (Comment APIs) | SP: 2 | Ngày: D6
**S2-18** | Middleware `restrictToOwner.js` | SP: 3 | Ngày: D6
- *Test:* Owner gọi -> next(). Member gọi -> 403.

**S2-19** | Bổ sung Error Handler: CastError, ValidationError, DuplicateKey | SP: 3 | Ngày: D7
- *Test:* Mỗi loại lỗi đều trả JSON format chuẩn với statusCode phù hợp.

---

#### DEV-4 (Frontend)

**S2-20** | `views/project/index.ejs` – Card Grid | SP: 5 | Ngày: D4
- *Test:* Render đúng danh sách project, hiện tên + mô tả + avatar owner.

**S2-21** | `views/project/board.ejs` – 3 cột Kanban | SP: 8 | Ngày: D5-D6
- *Test:* Trang load đúng 3 cột To Do / In Progress / Done. Responsive không vỡ.

**S2-22** | `public/js/board.js` – Client JS fetch + render DOM | SP: 5 | Ngày: D6-D7
- *Test:* Fetch API lấy tasks -> render card vào đúng cột status.

**S2-23** | `views/partials/_taskCard.ejs` – Template thẻ Task | SP: 3 | Ngày: D7
- *Test:* Card hiện title, priority badge màu, avatar assignee, deadline.

**✅ Sprint 2 Deliverable:** CRUD hoàn chỉnh Project/Task/Comment. Board 3 cột. Postman TC-26 → TC-48 pass.

---

### 🟡 SPRINT 3: REALTIME & DASHBOARD (Ngày 8 → 11)
**Sprint Goal:** *"Kết thúc Sprint này, 2 trình duyệt mở cùng Board sẽ tự đồng bộ khi thay đổi Task."*

---

#### DEV-3 (Socket.io)

**S3-01** | Refactor `server.js` – http.createServer + Socket.io + app.set('socketio') | SP: 5 | Ngày: D8
**S3-02** | Socket Auth Middleware – io.use() verify JWT | SP: 5 | Ngày: D8
**S3-03** | io.on('connection') – join_project, leave_project, disconnect | SP: 3 | Ngày: D8

> **📮 Test cho S3-01 → S3-03 (Socket Setup):**

| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-49 | Client connect với auth token hợp lệ | Server log "User vào mạng" | Happy |
| TC-50 | Client connect không có token | Server từ chối, emit error | Sad |
| TC-51 | Client emit 'join_project' + projectId | Server log "User vô phòng ..." | Happy |

**S3-04** | Trigger emit trong taskController.updateTask – 'task_status_changed' | SP: 3 | Ngày: D9
**S3-05** | Trigger emit trong commentController – 'new_comment' | SP: 3 | Ngày: D9
**S3-06** | Trigger emit khi gán assignee – 'task_assigned' | SP: 3 | Ngày: D9
**S3-07** | Test Realtime mở 2 tab trình duyệt | SP: 5 | Ngày: D10

> **📮 Test cho S3-04 → S3-07 (Realtime Events):**

| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-52 | Tab A đổi status task, Tab B cùng board | Tab B tự động thấy card nhảy cột | Happy |
| TC-53 | Tab A thêm comment, Tab B cùng task | Tab B hiện comment mới không reload | Happy |
| TC-54 | Gán assignee cho task | Tất cả member trong room nhận thông báo | Happy |
| TC-55 | User ở Project X đổi task | User ở Project Y KHÔNG nhận event | Isolation |

---

#### DEV-1 (Dashboard)

**S3-08** | `dashboardService.js` – getMyTasks() | SP: 3 | Ngày: D8
**S3-09** | Logic tính Overdue on-the-fly | SP: 5 | Ngày: D8
**S3-10** | Logic gom nhóm (overdue[], inProgress[], todo[]) + counts | SP: 5 | Ngày: D9
**S3-11** | `dashboardController.js` + `dashboardRoutes.js` | SP: 2 | Ngày: D9

> **📮 Test cho S3-08 → S3-11 (Dashboard APIs):**

| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-56 | GET /users/me/tasks | Chỉ chứa tasks assignee = tôi | Happy |
| TC-57 | Có task Done lẫn To Do | Response chỉ có To Do và In Progress | Happy |
| TC-58 | Task deadline = hôm qua, status != Done | isOverdue = true | Happy |
| TC-59 | Task deadline = ngày mai | isOverdue = false | Happy |
| TC-60 | Task deadline = null | isOverdue = false, không crash | Edge |
| TC-61 | User mới chưa được giao task | 200, { overdue: [], inProgress: [], todo: [] } | Edge |

**S3-12** | Bổ sung Filter nâng cao (status, priority, deadline range) | SP: 5 | Ngày: D10
**S3-13** | Soft delete task + pre-find hook ẩn tasks đã xóa | SP: 3 | Ngày: D10
- *Test:* Task bị soft delete -> GET tasks không trả về task đó.

---

#### DEV-2 (Avatar Upload)

**S3-14** | Cài Multer + Cloudinary, cấu hình env | SP: 3 | Ngày: D8
**S3-15** | `middlewares/upload.js` – memoryStorage, file filter image only | SP: 3 | Ngày: D9
**S3-16** | `userService.js` – uploadAvatar() Cloudinary | SP: 5 | Ngày: D9
**S3-17** | API PATCH /users/update-avatar | SP: 3 | Ngày: D10

> **📮 Test cho S3-14 → S3-17 (Avatar Upload):**

| TC | Test Case | Expected | Loại |
|:--|:---|:---|:---|
| TC-62 | PATCH form-data file .jpg | 200, user.avatar = URL Cloudinary | Happy |
| TC-63 | Upload file .pdf | 400, "Chỉ chấp nhận file ảnh" | Sad |
| TC-64 | Upload không đính kèm file | 400, "Vui lòng chọn ảnh" | Sad |

**S3-18** | Hỗ trợ DEV-3 test realtime, fix bugs | SP: 3 | Ngày: D11

---

#### DEV-4 (Frontend Realtime)

**S3-19** | Thêm socket.io.js vào board.ejs, client connect auth token | SP: 5 | Ngày: D8
- *Test:* Console trình duyệt log "socket connected".

**S3-20** | Client JS lắng nghe 'task_status_changed' – DOM di chuyển card | SP: 5 | Ngày: D9
- *Test:* Cùng TC-52: Tab B thấy card nhảy cột.

**S3-21** | Client JS lắng nghe 'new_comment' – Append comment | SP: 3 | Ngày: D9
- *Test:* Cùng TC-53: Tab B hiện comment mới.

**S3-22** | `views/dashboard/index.ejs` – 3 section: Overdue/Doing/Todo | SP: 5 | Ngày: D10
- *Test:* Dashboard hiện đúng 3 mục, task overdue nền đỏ.

**S3-23** | `views/error.ejs` – Trang lỗi 404/500 | SP: 2 | Ngày: D10
- *Test:* Truy cập URL sai -> hiện trang error thân thiện.

**✅ Sprint 3 Deliverable:** Realtime hoạt động, Dashboard Overdue, Avatar upload, Filter. TC-49 → TC-64 pass.

---

### 🔴 SPRINT 4: ĐÁNH BÓNG & TRIỂN KHAI (Ngày 12 → 14)
**Sprint Goal:** *"Dự án live trên Render, Postman Export xong, Video Demo quay xong."*

---

**S4-01** | Bug bash session: Cả team test chéo | SP: 5 | D12 | ALL
**S4-02** | Fix bugs từ bug bash | SP: 8 | D12 | ALL
**S4-03** | Code cleanup: Xóa console.log, thêm comment | SP: 3 | D12 | ALL

> **📮 Kịch bản Test Tích Hợp End-to-End (Bug Bash):**

| # | Kịch bản E2E | Người Test |
|:--|:---|:---|
| E2E-01 | Đăng ký User A → Đăng nhập → Tạo Project → Tạo 3 Task → Gán cho mình → Dashboard hiện 3 task | DEV-1 |
| E2E-02 | Đăng ký User B → User A mời B → User B tạo Task → User A thấy task mới (Realtime) | DEV-2 |
| E2E-03 | User B kéo Task To Do → Done → User A thấy card nhảy cột (2 browser) | DEV-3 |
| E2E-04 | User B comment → User A thấy comment mới (Realtime) → Kiểm tra populate author name + avatar | DEV-4 |
| E2E-05 | User B (member) cố xóa Project → 403. User A (owner) xóa → Thành công, biến mất khỏi list | DEV-1 |
| E2E-06 | Token hết hạn → Refresh → Token mới → Tiếp tục thao tác | DEV-3 |
| E2E-07 | User C (ngoài project) cố tạo Task/Comment → 403 | DEV-2 |
| E2E-08 | Deploy Render → Chạy lại E2E-01 → E2E-07 trên URL production | DEV-4 |

**S4-04** | DEV-1: Viết README.md chi tiết | SP: 5 | D13
**S4-05** | DEV-1: Rà soát Error Handler edge cases | SP: 3 | D13
**S4-06** | DEV-2: Viết báo cáo nhóm (1-2 trang) | SP: 3 | D13
**S4-07** | DEV-2: Hỗ trợ deploy, test production | SP: 3 | D14
**S4-08** | DEV-3: Xuất Postman Collection JSON | SP: 5 | D13
**S4-09** | DEV-3: Bổ sung Postman environment vars + mô tả | SP: 3 | D13
**S4-10** | DEV-4: Tạo tài khoản Render, kết nối GitHub | SP: 2 | D13
**S4-11** | DEV-4: Cấu hình env trên Render | SP: 2 | D13
**S4-12** | DEV-4: Deploy thành công, test live URL | SP: 3 | D13
**S4-13** | DEV-4: Quay Video Demo 5 phút (2 browser Realtime) | SP: 5 | D14
**S4-14** | DEV-4: Upload video YouTube/Drive, gắn link README | SP: 1 | D14

**✅ Sprint 4 Deliverable:** LIVE Internet, Postman, Video Demo, README, Báo cáo. **SẴN SÀNG NỘP BÀI.**

---

## 4. NGHI THỨC SCRUM HÀNG NGÀY

| Nghi thức | Thời lượng | Tần suất | Nội dung |
|:---|:---:|:---|:---|
| **Daily Standup** | 10 phút | Mỗi ngày (9h sáng) | 3 câu: Hôm qua? Hôm nay? Có kẹt gì? |
| **Sprint Review** | 15 phút | Cuối Sprint (D3, D7, D11) | Demo tính năng, feedback chéo |
| **Sprint Retro** | 10 phút | Cuối Sprint 2 & 3 | Tốt? Cần cải thiện? Action item? |

---

## 5. QUY TẮC GIT WORKFLOW

- **Nhánh chính:** `main` (production), `develop` (tích hợp).
- **Nhánh feature:** `feature/auth-login`, `feature/project-crud`...
- **Merge Rule:** Tạo Pull Request, DEV-1 review rồi mới merge vào `develop`.
- **Commit chuẩn:** `feat: thêm API login` / `fix: sửa lỗi check member` / `docs: cập nhật README`.
