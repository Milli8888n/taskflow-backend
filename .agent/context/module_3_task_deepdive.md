# ĐÀO SÂU TRONG MODULE 3: QUẢN LÝ CÔNG VIỆC (TASK MODULE)

Đây là khoang trung tâm của ứng dụng TaskFlow (Mini Trello). Module 3 xử lý dữ liệu phức tạp nhất, tần suất đọc/ghi cao nhất và yêu cầu kỹ thuật bảo mật chéo (Cross-check Authorization) gắt gao nhất để đảm bảo Không ai được phép chọc phá "Bảng Kanban" của người khác.

---

## 🏗 Sub-Item 1: Khởi tạo mô hình (Task Model)

Thể hiện từng thẻ (Card) công việc trên board. Cần ràng buộc Enum nghiêm ngặt để giao diện không bị nổ nếu người dùng đánh sai chữ.

* **Định vị:** Nằm ở `/src/models/taskModel.js`
* **Mã giả triển khai (Schema Focus):**
  - `projectId`: (Type: ObjectId, Ref: `Project`, Required) - Nhiệm vụ không thể mồ côi, phải thuộc về 1 nhà.
  - `title`: (String, Required)
  - `description`: (String, Mặc định: "")
  - `status`: Chặn cứng định dạng bằng `enum: ['To Do', 'In Progress', 'Done']`. Default luôn là `'To Do'`.
  - `priority`: Chặn cứng `enum: ['Low', 'Medium', 'High']`. Default có thể là `'Medium'`.
  - `deadline`: (Type: Date).
  - `assignee`: (Type: ObjectId, Ref: `User`) - Người bị gắn tên (Giao việc).
  - Khuyến nghị: Đánh **Index** tại Data Layer: `taskSchema.index({ projectId: 1, status: 1 });` để làm cho việc truy vấn hàng ngàn Task lúc kéo thả Frontend nhanh hơn gấp nhiều lần.

---

## 🛡 Sub-Item 2: Rào chắn chặn nguồn (Project Members Shield)

Trước khi viết bất cứ hàm Tạo/Sửa/Xóa Task nào, ta phải giải quyết bài toán: *Làm sao biết thanh niên A (có quyền cầm con dao) có nằm trong danh sách Project B để đâm vào cái Task C nằm trong Project B không?*

* **Cách thiết kế:** 
  Có 2 phương án: Viết trực tiếp chặn bên trong file `taskService.js`, hoặc gõ thành 1 middleware tái sử dụng có tên `checkProjectMembership.js`. Khuyên dùng viết thành hàm tái sử dụng.
* **Luồng Logic Middleware:**
  1. Hút `projectId` từ URL (`req.params.projectId`).
  2. Bắt `ProjectModel.findById(projectId)`.
  3. Lục xem `req.user.id` có nằm trong `project.members` không. Nếu hàm `includes()` trả False -> Ném thẳng lỗi `403 Forbidden - Bạn không có phận sự ở Board này`. Lệnh cấm thi hành.

---

## ✨ Sub-Item 3: API Tạo Task Mới (Create Task)

Người dùng bấm nút dấu "Cộng" bên dưới cột To-Do. Đẩy dữ liệu lên.

* **Routing Cấu trúc Nested:** Để URL đẹp theo chuẩn RESTful Trello, khai báo ở `projectRoutes` rồi đẩy qua `taskRoutes`. 
  Lệnh URL: `POST /api/v1/projects/:projectId/tasks`
* **Xử lý thuật toán ở Service:**
  1. Check quyền (Bằng cơ chế nêu trên).
  2. Gom nhóm Payload: Cục Data là bảng kết hợp của thông tin nhập tay `req.body` và thông tin mã nhúng `projectId`.
  3. **Check lồng (Nested Constraint):** Nếu Request cố tình gán Assignment (giao việc) cho một anh C nào đó ngay trong lúc tạo -> Lại phải quét xem cái ID anh C kia có nằm trong mảng `Project.members` không? Nếu thằng C là khách ngoại lai thì không thể giao việc cho nó làm được! Lỗi 400.
  4. Trả thành công `Task.create()`.

---

## 🔁 Sub-Item 4: Cập nhật Trạng thái (Drag & Drop Move Task)

Là API bị gọi nhiều nhất nhì hệ thống. Cứ mỗi lần bạn cầm con chuột ở Trello, nhấc tấm thẻ chữ nhật kéo từ cột 'To Do' quăng sang 'In Progress', Front-end sẽ ngầm bắn 1 phát súng gọi hàm Cập nhật này.

* **Routing:** `PUT /api/v1/tasks/:taskId` (Vì lúc kéo thả đã có cụ thể ID của Task, không cần URL dài dòng đính kèm projectId nữa).
* **Xử lý Tính toán Cấp tốc (Patch/Update):**
  1. Trích xuất Payload: Có thể chỉ mang một trường `{"status": "Done"}`.
  2. Query lấy Task cũ ra trước: `Task.findById()`. Check thử xem cái Task này có nằm trong Project mà người gọi thuộc về hay không.
  3. Cập nhật và lưu `task.save()`.
  4. **[HỆ QUẢ REALTIME - CỰC KỲ QUAN TRỌNG]:** Khoảnh khắc Save thành công xuống DB, lập tức bắt lấy gói dữ liệu mới, chạy hàm Trigger cho **Module 6 (Socket.io)** báo một tin nhắn Broadcast. Máy chủ sẽ la to: *"Ê mấy mạng đang dòm cái Board kia, cái task 123 mới bị chuyển qua Done nha"*, toàn bộ các máy khác lập tức thấy lá bài chuyển dịch không cần ép F5 web lại.

---

## 🔎 Sub-Item 5: Lọc Dữ Liệu Nâng Cao (Filter & Querying)

Khi Trello board quá dài, Owner nhập vào ô Search "Cho tao các Task ưu tiên High và đang In Progress".

* **Routing:** `GET /api/v1/projects/:projectId/tasks`
* **Thuật toán Query (Mongoose Magic):**
  1. Tại tầng Controller, lấy đống bùi nhùi từ phía sau dấu hỏi chấm `req.query` (Vd: `?status=In Progress&priority=High`).
  2. Truyền đống object đó qua Service.
  3. Service nối đuôi tham số truy tìm: `Task.find({ projectId: currentProjectId, ...req.query })`.
  4. Nâng lên tầm cao mới cho việc Phân trang (Pagination) nếu cần bằng Mongoose `.limit()` và `.skip()`.
  5. Luôn `.populate('assignee', 'name avatar')` để lúc trả mảng danh sách cho web, nó hiển thị icon mặt người nằm gọn lỏn góc dưới cái thẻ báo hiệu ai đang cầm thẻ này.
