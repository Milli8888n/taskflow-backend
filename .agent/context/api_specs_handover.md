# TÀI LIỆU CHI TIẾT API & LOW-LEVEL DESIGN (API SPECS)

Tài liệu này cung cấp bản thiết kế đặc tả API (API Specification) và từ điển sự kiện Realtime dành cho đội Backend để lập trình một cách chuẩn xác, nhất quán.

---

## 1. QUY CHUẨN GIAO TIẾP (API STANDARDS)
* **Base URL:** `/api/v1`
* **Content-Type:** `application/json` (Ngoại trừ API upload file dùng `multipart/form-data`)
* **Kiểu Response Mặc Định:**
```json
{
  "status": "success | error | fail",
  "data": { ... },     // Payload (Chỉ có khi status là success)
  "message": "...",    // Thông báo cho con người đọc
  "statusCode": 200    // Mã Code HTTP
}
```

---

## 2. API ENDPOINT ĐẶC TẢ CHI TIẾT

### Module 1: Authentication (Auth)
#### 1. Đăng ký tài khoản (Register)
* **Route:** `POST /api/v1/auth/register`
* **Bảo vệ (Protected):** Không
* **Request Body:**
  ```json
  {
    "name": "Nguyen Van A",
    "email": "nva@gmail.com",
    "password": "Password123!"
  }
  ```
* **Response (201 Created):** `data` chứa thông tin user (đã ẩn password).

#### 2. Đăng nhập (Login)
* **Route:** `POST /api/v1/auth/login`
* **Bảo vệ:** Không
* **Request Body:** `{ "email": "...", "password": "..." }`
* **Response (200 OK):**
  ```json
  {
    "user": { ... },
    "accessToken": "ey...",
    "refreshToken": "ey..." // Có thể trả về trong body hoặc set bằng HTTP-Only Cookie
  }
  ```

### Module 2: Projects (Dự án)
*(Tất cả API từ đây trở đi yêu cầu có header: `Authorization: Bearer <accessToken>`)*

#### 1. Tạo Project Mới
* **Route:** `POST /api/v1/projects`
* **Request Body:** `{ "name": "Sprint 1", "description": "Làm module A" }`
* **Nghiệp vụ ngầm:** Server tự động lấy ID của User đang đăng nhập dán vào trường `owner` và mảng `members`.

#### 2. Lấy danh sách Project của tôi
* **Route:** `GET /api/v1/projects`
* **Response (200):** Trả về mảng các projects mà User ID hiện tại nằm trong mảng `members` hoặc là `owner`.

#### 3. Thêm thành viên vào Project
* **Route:** `POST /api/v1/projects/:projectId/members`
* **Request Body:** `{ "email": "thanhvienmoi@gmail.com" }`
* **Rule:** Chỉ `owner` của projectId này mới có quyền thêm người khác.

#### 4. Xoá mềm Dự án
* **Route:** `DELETE /api/v1/projects/:projectId`
* **Rule:** Chỉ User hiện tại nếu là `owner` của dự án mới gọi được, đổi trạng thái `isDeleted = true`.

### Module 3: Tasks (Công việc)
*(Dành cho tất cả User đang nằm trong `members` của project đó)*

#### 1. Tạo Task mới
* **Route:** `POST /api/v1/projects/:projectId/tasks`
* **Request Body:**
  ```json
  {
    "title": "Viết API Đăng nhập",
    "description": "Tạo JWT",
    "priority": "High",
    "deadline": "2026-04-20T12:00:00Z",
    "assignee": "64bc123..." // Có thể bỏ trống
  }
  ```
* **Mặc định ngầm đính kèm:** `status: "To Do"`.

#### 2. Chuyển trạng thái / Sửa Task
* **Route:** `PUT /api/v1/tasks/:taskId`
* **Request Body:** Chấp nhận thay đổi linh hoạt (`status`, `title`, `assignee`).
  ```json
  { "status": "In Progress" }
  ```
* **Rule:** Nếu sửa thành công, gọi Socket báo `task_updated`.

#### 3. Lấy full danh sách Task của một Project (Kèm Filter/Lưới tìm kiếm)
* **Route:** `GET /api/v1/projects/:projectId/tasks?status=Done&priority=High`
* **Nghiệp vụ:** Cắt query params ra để filter truy vấn bằng Mongoose `.find(query)`.

#### 4. Dashboard Cá Nhân (Lấy Task được gán)
* **Route:** `GET /api/v1/users/me/tasks`
* **Kì vọng:** Lấy danh sách các Task chưa xoá, mà `assignee` là mình. Kèm theo flag `isOverdue` (So sánh mốc thời gian `deadline` < `Date.now()` và `status !== "Done"`).

---

## 3. TỪ ĐIỂN SỰ KIỆN REALTIME (SOCKET.IO DICTIONARY)

Realtime là yêu cầu **Critical** để có 2 điểm. Đây là quy chuẩn các luồng kênh để FE & BE gửi/nhận sự kiện.

| Kênh (Event Name) | Chiều gửi | Dữ liệu mang theo (Payload) | Mô tả & Cách ứng dụng |
| :--- | :--- | :--- | :--- |
| `join_project` | FE -> BE | `{ "projectId": "abc" }` | FE sẽ chui vào phòng (Room) có mã "abc". Bắt buộc gửi lúc trang Board load xong. |
| `task_updated` | BE -> FE | `Task_Object` | Cập nhật lại UI thẻ Task khi bất kì trường nào (Title, Status, Priority) thay đổi. |
| `new_comment` | BE -> FE | `{ "taskId", "comment_Object" }` | Khi có người Comment thành công qua API HTTP, BE phát tin này. FE tóm được sẽ push vào list view comment. |
| `member_assigned` | BE -> FE | `{ "taskTitle", "assignee_Id" }` | Kèm thông báo (Toastr/Notification alert) "Bạn vừa được giao việc...". |
| `leave_project` | FE -> BE | `{ "projectId": "abc" }` | Rời khỏi phòng Socket khi người dùng đóng trang hoặc về trang chủ để tiết kiệm RAM server. |

---

## 4. CHIẾN LƯỢC QUẢN LÝ LỖI (ERROR HANDLING STRATEGY)
Backend khi cấu hình `errorHandler` middleware cần trả các mã HTTP sau một cách nhất quán (Dev không được mix lung tung):
- `400 Bad Request:` Dữ liệu Payload gửi lên thiếu, hoặc Mongoose Schema validation quăng lỗi rớt (vd: Email không đúng định dạng).
- `401 Unauthorized:` Request không dính kèm/hoặc truyền sai Bearer Token ở header (Access Token hết hạn). Token Fake.
- `403 Forbidden:` Có Token chuẩn, dĩ nhiên login thành công, nhưng User cố gắng **xoá Project của người khác** hoặc cố **tương tác trong một Project mình chưa được mời**.
- `404 Not Found:` User truyền lên ID không đúng, ID đã bị đánh soft delete.
- `500 Internal Server Error:` Các lỗi do Backend exception mà không đoán trước (vd đứt cáp đứt kết nối vào Mongo Atlas).
