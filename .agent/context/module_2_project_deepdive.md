# ĐÀO SÂU TRONG MODULE 2: QUẢN LÝ DỰ ÁN (PROJECT MODULE)

Nếu Module 1 xử lý việc nhận diện người dùng, thì Module 2 xử lý yếu tố nền tảng của hệ thống là Không Gian Làm Việc (Workspace). Đây là nơi xác định phạm vi giao tiếp, phân quyền Chủ-Thợ (Owner/Member) và là nòng cốt để cấp quyền cho Module Task phía sau.

---

## 🏗 Sub-Item 1: Khởi tạo dữ liệu (Project Model)

Đây là ranh giới "Gom nhóm" của hệ thống Mini Trello.

* **Nghiệp vụ cốt lõi:**
  - Cần phải có 1 chủ hộ (`owner`) để xác định quyền "Sinh - Sát" (xóa bỏ) dự án.
  - Cần 1 mảng chứa cư dân (`members`). Chủ hộ cũng là một thành viên mặc định trong nhà.
  - Phải có cơ chế `Soft Delete` (Xóa mềm) để tránh việc Owner lỡ tay xóa mất cả ngàn task công việc.

* **Định vị:** Làm việc tại `/src/models/projectModel.js`
* **Mã giả triển khai (Code Design):**
  - Khai báo Mongoose Schema với các cột: 
    - `name` (String, required).
    - `description` (String, default là chuỗi rỗng).
    - `owner` (ObjectId, ref tới model `User`). Chú ý khai báo Ref thì sau này hàm `.populate()` mới có tác dụng móc tên từ ID.
    - `members` (Mảng Array các chuỗi ObjectId, cũng Ref tới `User`).
    - `isDeleted` (Boolean, default: false).
  - Kỹ thuật nâng cao: Áp dụng Mongoose Query Middleware `projectSchema.pre(/^find/, function() { this.find({ isDeleted: { $ne: true } }) })`. Nghĩa là chặn đứng mọi truy vấn gõ lệnh Find, tự động lén gắn cái filter (Chỉ lấy mấy project `isDeleted` là false).

---

## 🏗 Sub-Item 2: API Tạo Dự án Mới (Create Project)

Hành vi người dùng tự mình khởi tạo 1 Board mới ngẫu nhiên.

* **Routing:** `POST /api/v1/projects` (Kèm theo Middlewares: `protect`)
* **Xử lý tính toán (Layer Service):**
  1. Người gọi là AI ĐÓ? Trả lời: Controller đã moi được `req.user.id` thông qua cái thẻ AuthToken giấu trong Route.
  2. Tạo bản ghi mới thông qua Mongoose: `Project.create({ name: req.body.name, description: req.body.desc, owner: req.user.id, members: [req.user.id] })`.
  3. Notice: Rất quan trọng khi bạn phải tự ép `owner` thành chính họ, và dồn luôn họ vào mảng `members[0]` ngay từ đầu tiên để lấy quyền quản lý Task later.

---

## 🤝 Sub-Item 3: API Cấp Quyền/Thêm Thành Viên (Add Member)

Tính năng "Invite to Board". Kết nối sức mạnh làm việc nhóm.

* **Routing:** `POST /api/v1/projects/:projectId/members`
* **Luồng chạy Logic (Service - projectService.js):**
  1. **Chốt an ninh số 1:** Project này có tồn tại không? `Project.findById(req.params.projectId)`. Ko thấy -> Quăng 404.
  2. **Chốt an ninh số 2 (Rất Quan Trọng):** Người gửi Request này (req.user.id) có phải đúng là `owner` của Project kia không? `if (project.owner.toString() !== currentUserId.toString()) throw new Error('Chi owner moi co quyen', 403)`.
  3. **Kiểm tra người mời:** Dựa vào `email` truyền lên, tìm xem thành viên đó có xài App không bằng cách chọc vô bảng DB User `User.findOne({ email })`. Ko có -> Báo lỗi ko tìm thấy tài khoản.
  4. **Kiểm tra trùng rập:** Kiểm tra ID của thành viên tìm được ở bước 3 xem đã có mặt sẵn trong mảng `project.members` chưa? Tránh việc mời 1 thẻ 2 lần. Phân tích hàm `.includes(userId)`.
  5. Đẩy thành viên vào: `project.members.push(userId)` và lưu `await project.save()`.

---

## 📋 Sub-Item 4: API Xem Danh Sách Dự Án (List Personal Projects)

Khi User tải trang Homepage, hiện ra tất cả các "Hình chữ nhật" Board để họ bấm vào làm việc.

* **Routing:** `GET /api/v1/projects` (Kèm `protect`)
* **Xử lý (Service Layer):**
  - Không phải lấy hết Projects của thiên hạ.
  - Viết câu lệnh MongoDB Filter (Mongoose Query): `Project.find({ members: { $in: [req.user.id] } })`. (Lấy ra các Project mà ID của mình nằm chễm chệ trong mảng members).
  - Ứng dụng `.populate('owner', 'name email avatar')` của Mongoose để lúc trả JSON giao diện, trả về thành 1 cây Object hiển thị thông tin người thiết kế "Board" tuyệt đẹp với Avatar và Tên, thay vì 1 dãy ký tự ID xấu xí.

---

## 🗑️ Sub-Item 5: API Xóa Soft Delete Dự Án (Delete Workspace)

Nghiệp vụ xóa an toàn. Thay vì Drop mất sạch Data gây rủi ro cao, chúng ta xài cờ (Flag State).

* **Routing:** `DELETE /api/v1/projects/:projectId` (Kèm bảo vệ Auth)
* **Xử lý nghiệp vụ:**
  1. Kiểm tra ID Dự Án.
  2. Kiểm tra `req.user.id === project.owner`. **Luật bất thành văn: Thành viên cãi cọ có thể Leave Project (Thoát mảng Members), nhưng tuyệt đối chỉ có Owner mới được Xóa.**
  3. Chuyển đổi cờ: `project.isDeleted = true`. Gọi lưu trữ `project.save()`.
  4. Hệ quả đi kèm: Thông thường khi xoá Project, các Dev cứng tay sẽ bắn 1 event để đổi toàn bộ cờ của các Tasks thuộc Project này thành xoá theo: `Task.updateMany({ projectId: id }, { isDeleted: true })`.

* **Nâng cao (Điểm cộng nếu có Middleware):** Bạn có thể viết thêm 1 file `middlewares/roleMiddleware.js` chuyên biệt kiểm tra Owner. Đặt code kiểm tra ra ngoài Router cho Clean Architecture thay vì gõ nhét chung vào Service. Ví dụ route sẽ mang dạng: `router.delete('/:id', protect, restrictToOwner, deleteAction)`.
