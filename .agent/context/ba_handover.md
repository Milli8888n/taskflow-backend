# TÀI LIỆU ĐẶC TẢ YÊU CẦU DỰ ÁN TASKFLOW (BA HANDOVER TO TEAM)

## Phần 1. Tổng Quan Sản Phẩm (Product Overview)
* **Tầm nhìn (Vision):** Xây dựng một ứng dụng quản lý nhiệm vụ tinh gọn giúp các cá nhân/nhóm theo dõi tiến độ công việc theo thời gian thực (Realtime), mang lại trải nghiệm mượt mà không độ trễ.
* **Mục tiêu (Goals):** Đạt điểm tối đa (10/10) theo tiêu chí của đề bài, đáp ứng cả phần Bắt buộc (7đ) và Nâng cao (2đ) cùng điểm Kiến trúc (1đ).
* **Phạm vi ngoài dự án (Out of Scope):** Không có tính năng thanh toán, không làm ứng dụng di động (Mobile App), không phức tạp hóa các quyền như "Guest" hoặc "Admin hệ thống quản trị chung".

## Phần 2. Chân Dung Người Dùng & Phân Quyền (Roles & Permissions)
Hệ thống xoay quanh 2 quyền hạn nằm ở cấp độ **Dự án (Project Level)**:
1. **Project Owner (Chủ dự án):**
   - Định nghĩa: Người trực tiếp tạo ra Dự án.
   - Quyền hạn bổ sung: Cấp quyền vào dự án cho người khác; Xóa toàn bộ dự án.
2. **Project Member (Thành viên):**
   - Định nghĩa: Người được Owner mời vào Dự án.
   - Quyền hạn cốt lõi: Xem thông tin dự án, Tạo Task, Chuyển trạng thái Task, Assign member, và Cập nhật Comment. (Tuyệt đối không được gỡ dự án).

## Phần 3. Danh Sách User Story (Giao Việc Trực Tiếp Cho Dev)

**Epic 1: Định danh (Authentication)**
* **US 1.1:** Là một Người truy cập, tôi muốn đăng ký bằng email và mật khẩu để sử dụng dịch vụ.
* **US 1.2:** Là một Người dùng (User), tôi muốn đăng nhập vào hệ thống để nhận Access Token & Refresh Token bảo vệ tài khoản.

**Epic 2: Quản lý Dự án (Project Management)**
* **US 2.1:** Là một User, tôi muốn tạo một Project mới để bắt đầu một luồng công việc mới. Do tôi là người tạo nên tôi là Owner.
* **US 2.2:** Là Chủ dự án (Owner), tôi muốn thêm các User khác (bằng email/ID) vào danh sách Thành viên (Members) để họ vào cùng làm việc.
* **US 2.3:** Là Chủ dự án, tôi muốn xoá dự án nếu công việc đã hoàn thành hoặc dự án bị hủy (Xóa mềm - isDeleted).

**Epic 3: Công việc & Tương tác (Task & Comment)**
* **US 3.1:** Là một Thành viên trong dự án, tôi muốn tạo một Task (chứa Title, Desc, Priority, Deadline) để theo dõi đầu việc.
* **US 3.2:** Là một Thành viên, tôi muốn chuyển trạng thái Task (To Do -> In Progress -> Done) để nhóm nắm được tiến độ.
* **US 3.3:** Là một Thành viên, tôi muốn gán Task cho bản thân hoặc cho đồng đội (Assignee).
* **US 3.4:** Là một Thành viên, tôi muốn thêm nội dung bình luận (Comment) ở mỗi Task để trao đổi cụ thể lý do vướng mắc.

**Epic 4: Trải nghiệm Thời gian thực & Dashboard (Realtime & Dashboard)**
* **US 4.1:** Là một Thành viên, khi người khác đổi Trạng thái Task, tôi muốn thấy sự thay đổi ngay trên màn hình mà không cần reload trang (Sử dụng Socket.io).
* **US 4.2:** Là một User, khi mới vào ứng dụng, tôi muốn xem ngay một Dashboard thống kê tất cả các Task *được gán cho tôi* chưa hoàn thành, kèm cảnh báo các Task đã trễ hạn (Overdue).

## Phần 4. Quy Tắc Nghiệp Vụ Chặt Chẽ (Business Rules & Validation)
* **BR1 (Quy tắc mật khẩu):** Mật khẩu phải mã hoá, tuyệt đối không truyền password clear text dưới database.
* **BR2 (Quy tắc giới hạn Task):** Một người cố tình gõ /api/tasks để xem task của Project A. Hệ thống phải báo lỗi 403 Forbidden nếu người đó không nằm trong mảng `members` của Project A.
* **BR3 (Quy tắc gán người):** Khi gán Assignee cho Task, User ID được chọn phải là thành viên hợp lệ nằm trong Project đó.
* **BR4 (Xóa dữ liệu mềm):** Các Object Project/Task khi bấm Delete chỉ cập nhật trạng thái `isDeleted: true` chứ không xóa vĩnh viễn khỏi Database để dễ dàng khôi phục khi cần.

## Phần 5. Tiêu Chuẩn Nghiệm Thu & Non-Functional (Acceptance Criteria & NFR)
- **Tiêu chuẩn kiểm thử:** Luồng Realtime chạy song song 2 trình duyệt độ trễ dưới 1.5s.
- **Tuân thủ công nghệ:** Core API sử dụng JWT chặn đầu ra vào.
- **Yêu cầu Báo cáo:** Code push GitHub đều, Postman API Document, và Server deploy hoạt động tốt để quay Video chứng minh.
