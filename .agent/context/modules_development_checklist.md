# DANH SÁCH CÁC MODULE PHÁT TRIỂN DỰ ÁN TASKFLOW

Dựa trên yêu cầu gốc của đề tài, dự án **TaskFlow (Mini Trello)** được xé nhỏ thành **6 Module lõi** và **1 Module mở rộng**. Dưới đây là danh sách chi tiết các công việc cần code cho từng module. Team có thể dùng file này làm Check-list theo dõi tiến độ.

---

## 🏗️ MODULE 1: XÁC THỰC & ĐỊNH DANH (AUTH & USER MODULE)
> Đây là module "xây móng". Không có luồng này, các thao tác dữ liệu đều vô nghĩa vì không biết ai đang thực hiện.

- [ ] **Khởi tạo dữ liệu (User Model):** Thiết kế bảng User (Email, Password hash, Name, Avatar, Role).
- [ ] **API Đăng ký:** Tạo hàm kiểm tra format email, mã hóa bcrypt password, lưu database.
- [ ] **API Đăng nhập:** Kiểm tra pass khớp `bcrypt.compare`, đúc (sign) JWT Token.
- [ ] **JWT Refresh Token:** Xây dựng cơ chế cấp lại Access Token mới khi Token cũ (hạn ngắn 15p) hết hạn.
- [ ] **Auth Middleware (Cốt lõi):** Hàm `protect()` chặn ở các API nhạy cảm, chỉ mổ token hợp lệ ra lấy User ID truyền vào Request.

## 📁 MODULE 2: QUẢN LÝ DỰ ÁN (PROJECT MODULE)
> Nơi hình thành các không gian làm việc (Workspaces). Một người dùng có thể sỡ hữu nhiều Board.

- [ ] **Project Model:** Tạo bảng Project (Tên, Mô tả, Mảng Mảng ObjectId thành viên, Chủ dự án `owner`, Flag xoá mềm `isDeleted`).
- [ ] **API Tạo Dự án:** Người tạo tự động gắn mác `owner` và bị đẩy vào mảng `members`.
- [ ] **API Thêm thành viên:** Owner gán email người khác vào dự án để rủ làm chung.
- [ ] **API Xem danh sách Dự án:** Fetch danh sách Board theo User đang đăng nhập (Là owner hoặc nằm trong members).
- [ ] **API Xoá dự án (Soft Delete):** Chỉ Owner được bấm nút này, đổi `isDeleted = true`. API danh sách phải cất mấy cái đã xóa đi.

## 📝 MODULE 3: THEO DÕI CÔNG VIÊC (TASK MANAGEMENT MODULE)
> Module phức tạp nhất, trái tim của Trello. Giao việc và quản trị Card/Task nằm ở đây.

- [ ] **Task Model:** Schema gồm (Tên task, Mô tả, Trạng thái [To Do/In Progress/Done], Độ ưu tiên [Low/Mid/High], Deadline, Assignee).
- [ ] **Kiểm soát Quyền chặn (Security Auth):** Code block chặn nếu ai không nằm trong Project Members thì cấm tạo Task trong đó.
- [ ] **API Tạo Task mới:** Gán vào một ID Project cụ thể.
- [ ] **API Cập nhật trạng thái:** Logic cho phép đổi từ cột này sang cột khác (vd chuyển Task To Do sang In Progress).
- [ ] **Lọc danh mục (Filter):** Cập nhật tính năng lấy danh sách Task, cho phép chèn query filter ở thanh URL (Lọc những cái High priority hoặc status là Done).

## 💬 MODULE 4: TƯƠNG TÁC (COMMENT MODULE)
> Tính năng trao đổi thông tin cục bộ trên mỗi Task.

- [ ] **Comment Model:** Reference tới 2 đầu: `TaskId` và `UserId` của người viêt. Cùng Nội dung Text.
- [ ] **API Gửi Bình luận:** Đính kèm id Task và Id User, nạp vào Mongoose.
- [ ] **API Fetch Bình Lược:** Dùng `.populate()` móc tên (Name) và Ảnh (Avatar) của User ra trả về cho Frontend hiển thị list tin nhắn trong dĩa Task.

## 📊 MODULE 5: BẢNG THEO DÕI CHUNG (DASHBOARD MODULE)
> Module tiện ích tổng hợp, giúp cá nhân tracking độ trễ (Overdue).

- [ ] **API Lấy Task Cá Nhân:** Một API độc lập nằm ngoài phạm vi Project. Query chọc sâu vào DB: Lấy toàn bộ Task (trên khắp toàn dãi) mà trường `assignee === current_user_id`.
- [ ] **Logic tính Overdue (Trễ deadline):** Nếu dòng dữ liệu `deadline < Thời gian hiện tại` VÀ `status khác "Done"` -> Tính là một card bị trễ hạn. Đóng gói cho React/Vue hoặc EJS tô màu Đỏ báo động.

## ⚡ MODULE 6: KẾT NỐI THỜI GIAN THỰC (REALTIME SOCKET MODULE)
> Giá trị ăn điểm cao nhất. Bứt phá độ trễ Web. Đòi hỏi cấu hình khó.

- [ ] **Tích hợp Server-side:** Gắn `Socket.io` đè lên Express Node.js App.
- [ ] **Logic chia phòng (Room Emit):** Khi người dùng mở View Project A, gọi event đẩy họ vô phòng Room 'A'.
- [ ] **Kênh Bắn (Fire events):** 
    - Khi Cập nhật Status Task API xong -> Emit Event gửi UI Task mới tới toàn Room.
    - Khi API Add Comment lưu Data xong -> Emit Event gửi cục Data chữ đó tới toàn Room chèn vào thẻ HTML.
    - Khi Assign Tên ai đó -> Emit Event Alert rung chuông thông báo cá nhân "Bạn đã được giao thêm việc".

## 🚀 MODULE 7 (NÂNG CAO - ĐIỂM CỘNG)
> Các Option làm thêm nếu dư dã thời gian.

- [ ] **Tải Ảnh Đại Diện:** Tích hợp Middlewares Upload (`multer`) + Cloud API CDN (`cloudinary`) để giải quyết File Upload mà không lo đầy ổ cứng Server.
- [ ] **Tính năng Trello thuần:** Logic thuật toán sắp xếp thứ tự các thẻ Task khi Kéo/Thả (Drag & Drop order index) thay vì chỉ thay đổi trạng thái Enum cơ bản.
