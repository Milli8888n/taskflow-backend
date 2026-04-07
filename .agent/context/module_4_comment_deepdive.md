# ĐÀO SÂU TRONG MODULE 4: TƯƠNG TÁC BÌNH LUẬN (COMMENT MODULE)

Thành phần tối quan trọng mang lại tính tương tác và báo cáo tiến bộ cục bộ trên từng thẻ Task. Comment đóng vai trò giống như lịch sử hoạt động (Activity Log) để tổ đội cập nhật lý do và trao đổi thông tin đính kèm vào mỗi công việc.

---

## 🏗 Sub-Item 1: Xây dựng Schema Dữ liệu (Comment Model)

Đầu mối giao tiếp này cần móc nối cực kỳ nhẹ nhàng với Tác phần (Task) và Tác giả (User). Không nhồi nhét thuộc tính để tránh bảng Data bị phình to.

* **Định vị:** Làm việc tại `/src/models/commentModel.js`
* **Mã giả triển khai (Schema Focus):**
  - `taskId`: (Type: ObjectId, Ref: `Task`, Required) - Bình luận này nằm trong cái Task nào?
  - `author`: (Type: ObjectId, Ref: `User`, Required) - Ai là người gõ bình luận này?
  - `content`: (Type: String, Required, Mongoose trim: true) - Nội dung chữ thuần. Chặn người dùng gửi chuỗi rỗng khoảng trắng bằng độ dài tối thiểu (`minlength: 1`).
  - Hữu dụng với `timestamps: true` (Lợi dụng Mongoose tự thả tự động trường `createdAt` để lấy mốc thời gian hiển thị *Bình luận lúc 3 giờ trước* bên UI).
  - Tối ưu hiệu năng: Đánh mốc `commentSchema.index({ taskId: 1, createdAt: -1 })` để có thể truy vấn siêu tốc 500 cái bình luận của 1 Task rồi sắp xếp theo thứ tự mới nhất (Lộn ngược ngày) nằm phía trên cùng.

---

## 🚀 Sub-Item 2: API Gửi / Thêm Bình Luận Mới (Create Comment)

Khi UI hiện Form chát nhỏ trong chi tiết Card, User gõ thông tin và bấm Submit.

* **Routing Dạng Nested Rẽ Nhánh:** Nên để Route này thành con của TaskRoutes.
  Cấu trúc: `POST /api/v1/tasks/:taskId/comments`
* **Xử lý thuật toán Tầng Logic (Service):**
  1. Bảo vệ tầng quyền hạn: Không phải cứ có Token Login là được tha hồ đi bình luận. Service phải lục soát cấu trúc 3 tầng: `Từ TaskId -> Tìm ra cái Project chứa hàm Task -> Check xem Req.User.id có thuộc members của Project đó không?` (Lại ứng dụng Hàm lính gác check Membership quen thuộc).
  2. Bố trí Dữ Liệu: Gộp `taskId`, `content` từ Payload gửi lên cùng `req.user.id` thành cục JSON và gọi lệnh `Comment.create()`.
  3. Cực Kì Quan Trọng - **Móc Ngoặt Realtime:** Giống như module 3, ngay khi hàm lưu CSDL chạy rẹt rẹt thành công, CÒ NỔ Súng Realtime lại phải báo Event: `io.emit('new_comment_added', createdComment_Data)`. 
  Lúc đó Frontend đang xem card này sẽ tự động gắn cái Node HTML bình luận mới đó vào dưới dòng chat cũ mà người dùng không cần F5. Rất trơn tru!

---

## 📥 Sub-Item 3: API Load Lịch Sử Bình Luận (Fetch Comments List)

Khi bấm mở (Click) vào 1 tấm thẻ To-Do trên Trello, nó sẽ phóng to màn hình cái thẻ lên. Lúc này hệ thống phải Load toàn bộ dòng hội thoại bên dưới.

* **Routing:** `GET /api/v1/tasks/:taskId/comments`
* **Xử lý thuật toán Truy xuất (Mongoose Populate Tricks):**
  1. Yêu cầu đơn giản: Gọi hàm `Comment.find({ taskId: req.params.taskId })`
  2. Điểm ăn tiền giao diện: Đừng trả về nguyên chuỗi ID khó đọc cho Client. Luôn gắn theo đít dòng lệnh hàm `Populate`.
     Ví dụ: `.populate('author', 'name avatar')`.
  3. Lúc trả về, Controller sẽ có một dãy Array Response đẹp lung linh, trong mỗi Comment, trường `author` đã hoá thành một cụm Object có chứa Tên (để in đậm), và URL Avatar (chấm tròn nhỏ 30px bên cạnh bình luận).
  4. Phân trang ngầm (Pagination Limit): Đề phòng 1 task có 1000 bình luận gây sụp RAM truy vấn, thiết kế thêm param `?limit=20&page=1` để ngầm load dần nếu cần mở rộng chức năng tải thêm (Load more comments).

---

## ❌ Sub-Item 4: (Optional) Xóa/Sửa Bình Luận (Edit/Delete Comment)

Chức năng thường thấy dành cho đội nâng cao nếu dư dả thời gian sau khi làm xong 7 Điểm cơ bản.

* **Tham số An Toàn Bắt Buộc (Security Checks):**
  * Tương tự Module Project (Xoá Dự Án thì phải là Owner). Ở đây sửa hoặc xóa bình luận thì BẮT BUỘC ID người gọi API (req.user.id) **PHẢI** trùng khớp đúng với Id được lưu dưới nhãn `author` của cái bình luận đó. Không thể sửa chéo bình luận của thành viên khác.
  * Việc xóa bình luận trên Taskflow/Trello ưu tiên dùng Xoá vĩnh viễn (`.deleteOne`) hơn là Soft Delete cho sạch bảng CSDL. Đổi thay bằng nhãn "Tin nhắn đã bị thu hồi".

## CÂU CHUYỆN TIẾP THEO ->
Module 4 làm nhịp cầu quan trọng nhất cho phần **Realtime chát cá nhân** - nơi có khả năng gây choáng ngợp lớn nhất cho Giảng viên chấm thi. Sự phân rã này giúp BackEnd Dev không bị lộn xộn luồng Code, tách hẳn Comment ra khỏi cái Dây Tơ Rễ của Collection Task vốn dĩ đã có 1 đống hàm Status phức tạp. Ai code Task quản lí task, ai code Chat/Comment lo route chát riêng rẽ. Tách 2 Controller độc lập bảo vệ dự án tốt hơn.
