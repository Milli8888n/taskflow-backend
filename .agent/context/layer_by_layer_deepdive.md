# CHUYÊN ĐỀ CHUYÊN SÂU: KIẾN TRÚC VÀ RÀNG BUỘC CỦA 5 TẦNG LÕI

Tài liệu này bóc tách tường tận 5 thành phần cốt lõi của ứng dụng (Routes, Controller, View, Service, Middleware), mô tả khối lượng công việc, trách nhiệm và đưa ra các thiết kế hàm (Function Design) dành riêng cho dự án **TaskFlow – Mini Trello**.

---

## 1. TẦNG ROUTES (BỘ ĐỊNH TUYẾN)
**Bản chất:** Là "bảng chỉ dẫn giao thông" của hệ thống. Nó không thực hiện công việc, chỉ chỉ đường.
**Quy tắc ngầm định:** File route KHÔNG được chứa bất kỳ block `try/catch` hay lệnh `const abc = ...` nào. Mỗi dòng của nó chỉ định nghĩa 1 HTTP Method, 1 URL, các chốt chặn (Middlewares), và điểm đến (Controller).

**Thiết kế cho dự án TaskFlow:**
Nên chia làm 4 file Routes trong folder `src/routes/`:
1. `authRoutes.js`: 
   - `router.post('/register', authController.register);`
   - `router.post('/login', authController.login);`
2. `projectRoutes.js`:
   - `router.route('/')` -> `.get(protect, projectCtrl.getAll)` -> `.post(protect, projectCtrl.create)`
   - `router.route('/:id')` -> `.delete(protect, restrictToOwner, projectCtrl.delete)`
3. `taskRoutes.js`:
   - Khuyên dùng kỹ thuật **Merge Params** của Express (`express.Router({ mergeParams: true })`) để có thể lồng task vào project URL dạng: `/api/projects/:projectId/tasks`.
4. `viewRoutes.js`:
   - Dùng để phục vụ giao diện Web (EJS). Return ra file html thay vì JSON.
   - `router.get('/', viewCtrl.getHomePage);`

---

## 2. TẦNG CONTROLLER (BỘ ĐIỀU HƯỚNG VÀ NGƯỜI NHẬN REQUEST)
**Bản chất:** Giống như "Lễ tân" của khách sạn. Nhận yêu cầu của khách (`req`), tổng hợp thông tin, đưa yêu cầu cho bộ phận bếp (`Service`) làm, lấy kết quả từ bếp và trình bày đẹp đẽ trên đĩa để bê ra cho khách (`res`).

**Thiết kế cho dự án TaskFlow:**
Các Controllers ứng với từng Module (`authController`, `projectController`, `taskController`):
- **Trích xuất nguyên liệu:** Mọi controller phải bắt đầu bằng việc gom data: 
  - `const token = req.cookies.jwt;`
  - `const { title, deadline } = req.body;`
  - `const { projectId } = req.params;`
- **Gọi bếp (Service):**
  - `const newProject = await projectService.createProject(req.user.id, name, desc);`
- **Trình bày (Response Formatting):**
  - Trả API: `res.status(200).json({ status: 'success', data: { project: newProject } });`
  - Render View (EJS): `res.status(200).render('projectBoard', { title: 'Bảng làm việc', project: newProject });`
  
*(Lưu ý: Không viết các truy vấn `Model.find()` hoặc vòng lặp For phức tạp liên quan tới business trong Controller).*

---

## 3. TẦNG SERVICE (Khu vực Bếp - Xử lý tính toán & DB)
**Bản chất:** Là "Trái tim" của hệ thống. Chứa 100% Core Business Logic. Các thao tác rắc rối nhất của Mini Trello nằm ở đây.

**Thiết kế hàm (Functions) trong `taskService.js`:**
* **Hàm `getAllTasks(projectId, filters)`:** Gọi tới `TaskModel.find({ projectId, ...filters })`. Sắp xếp (sort) theo tên hoăc độ ưu tiên (Priority).
* **Hàm `updateTaskStatus(taskId, newStatus, currentUserId, projectId)`:**
  1. Yêu cầu `ProjectModel` tìm xem `currentUserId` có nằm trong mảng `members` không? Nếu không, `throw new Error('Cấm truy cập')`.
  2. Bênh cạnh đó, nếu cập nhật thành công, Service còn có thể được thiết kế để *Trigger (bóp cò)* hệ thống Email tĩnh hoặc bắn tín hiệu cho Socket Server để báo Realtime (Dù đôi khi Realtime có thể bắn từ Controller tuỳ kiến trúc nhóm).
* **Hàm `addComment(taskId, content, authorId)`:** Ghi data vào collection `Comments`.

**Ràng buộc lỗi (Throw Behavior):** Tầng Service khi gặp chuyện không vui (như sai Pass, Email đăng ký trùng) thì chỉ việc `throw new AppError('Message', statusCode)`. Tầng Controller đang gọi nó bằng `await` sẽ tự động bị quăng lỗi vào nhánh `catch` và tuồn về Global Error Handler.

---

## 4. TẦNG MIDDLEWARE (HÀM TRUNG GIAN & KIỂM ĐỊNH)
**Bản chất:** Các lính gác đứng dọc đường ống từ Route tới Controller. Request phải vượt qua chúng. Có quyền truy cập can thiệp vào bộ nhớ `req` để bổ sung thông số.

**Thiết kế Middlewares quan trọng cho TaskFlow:**
1. **Lính gác cổng `protect` (Xác thực JWT):**
   Tuốt mã JWT từ `req.headers` hoặc `req.cookies`. Dùng hàm của thư viện `jsonwebtoken` để bóc ra `userId`. Query xuống Data xem User đó có còn tồn tại không hay vừa bị xóa? Nếu ổn thì nhét `req.user = currentUser` vào bộ nhớ và bật cờ `next()` cho đi tiếp.
2. **Lính gác quyền `restrictToOwner`:**
   Nhận vào danh sách chức vụ. Ví dụ `router.delete('/:id', protect, restrictToOwner)`. Nó sẽ lục tìm trong cơ sở dữ liệu xem cái Project có `:id` đó có `owner` === `req.user.id` hay không. Nếu trùng thì cho xóa, không thì cản lại báo 403 Forbidden.
3. **Lính cứu thương `errorHandler`:**
   Đã mô tả ở tệp trước, bắt 100% các lỗi của ứng dụng rơi rụng để dọn dẹp JSON cho đẹp.
4. **Lọc dữ liệu `multer` (Upload File Trung Gian):**
   Nếu có tính năng Nâng cao là Avatars, Multer là middleware nằm chặn giữa lúc user upload tệp, Multer bóc tệp ảnh ra lưu tạm vô ổ cứng, rồi cho đi qua Controller lấy thông tin file tải.

---

## 5. TẦNG VIEW (EJS & GIAO DIỆN TRỰC QUAN SERVER-SIDE)
**Bản chất:** Theo bộ Skill, do không viết Frontend bằng React/Vue tách rời, mà dùng EJS (Embedded JavaScript templates), nên giao diện sẽ do chính bản thân Node.js "trộn" Dữ liệu vào HTML và trả về cho trình duyệt 1 trang web hoàn chỉnh.

**Thiết kế cấu trúc `view/` cho TaskFlow:**
```html
views/
├── partials/
│   ├── _header.ejs     (Thanh điều hướng chung: Logo, Nút Login/Logout, Hiển thị Avatar góc phải)
│   ├── _footer.ejs     (Bản quyền, link liên kết)
├── auth/
│   ├── login.ejs       (Form nhập email, pass. Có JS gọi API /api/v1/auth/login)
│   ├── register.ejs
├── project/
│   ├── index.ejs       (Trang danh sách các project dưới dạng thẻ Card)
│   ├── board.ejs       (Trang Trello Board quan trọng. Render 3 cột To-Do, In-Progress, Done)
└── error.ejs           (Trang báo lỗi 404 hoặc 500 kèm ảnh con mèo khóc)
```

**Cách hoạt động của 1 trang EJS Board (`board.ejs`):**
1. Controller chạy hàm `res.render('project/board', { projectInfo, listTasks })`.
2. File EJS dùng vòng lặp `<% listTasks.forEach(task => { %>` để in ra các thẻ HTML `div.task-card` tương ứng.
3. **Tích hợp Real-time Socket.io ở EJS:** Ở dưới cùng file `board.ejs`, sẽ chèn thẻ `<script src="/socket.io/socket.io.js"></script>`. Viết code Client-side Javascript ngay tại đó để bắt sự kiện từ thẻ kéo-thả (Drag & Drop) và gửi hàm `socket.emit('task_move', ...)` lên server, khiến cột bên máy khác tự động dịch chuyển.

---
*(Tài liệu này được biên soạn bám cực kì sát sườn theo file base kỹ năng số 10 nhằm chuẩn bị mọi phương án cấu trúc phòng trường hợp dự án quyết định tự build UI View Engine thay vì làm Frontend độc lập).*
