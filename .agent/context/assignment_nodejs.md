# **ĐỀ TÀI ASSIGNMENT NodeJS**

#### **Môn học:** Node.js \+ Express \+ MongoDB

#### **Thời gian:** 2 tuần (17/04/2026)

#### **Nhóm:** 3–5 thành viên.

#### **Tổng điểm:** 10 điểm

## **Đề tài**

**Hệ thống Quản lý Nhiệm vụ với Realtime Updates (TaskFlow – Mini Trello)**

## **Tổng quan**

Xây dựng ứng dụng quản lý nhiệm vụ cá nhân / nhóm theo phong cách Trello / Linear.  
Ứng dụng cho phép người dùng tạo dự án, phân công nhiệm vụ, thay đổi trạng thái và **nhận cập nhật realtime** khi thành viên khác thay đổi nhiệm vụ hoặc thêm comment.

Lưu ý:

- Xây dựng ứng dụng với NodeJS Express, MongoDB.  
- Có Authentication & Authorization.  
- Realtime communication với **Socket.io**

## **Mục tiêu**

- Thành thạo CRUD với Mongoose  
- Xử lý authentication (JWT)  
- Thiết kế database quan hệ (populate, references)  
- Triển khai realtime (Socket.io)  
- Viết code sạch, có cấu trúc, dễ bảo trì  
- Deploy và viết tài liệu

## **Yêu cầu chức năng**

#### **Phần BẮT BUỘC – 7 điểm**

1. **Authentication & User**  
     
   - Đăng ký / Đăng nhập (email \+ password)  
   - JWT Access Token \+ Refresh Token  
   - Middleware bảo vệ route

   

2. **Project (Dự án)**  
     
   - CRUD Project (tạo, xem, sửa, xóa)  
   - Mỗi project có danh sách thành viên (members)

   

3. **Task (Nhiệm vụ)**  
     
   - CRUD Task trong project  
   - Các trường: title, description, status (To Do / In Progress / Done), priority (Low/Medium/High), deadline, assignee (gán cho user)  
   - Chỉ thành viên trong project mới được thao tác task

   

4. **Comment**  
     
   - Thêm / xem comment trong task

   

5. **Realtime (Socket.io)**  
     
   - Khi thay đổi status task → tất cả thành viên trong project nhận thông báo realtime  
   - Khi thêm comment → thông báo realtime cho các thành viên khác  
   - Khi gán assignee → thông báo realtime

   

6. **Dashboard cá nhân**  
     
   - Danh sách task của tôi (theo status và overdue)

#### **Phần NÂNG CAO – 2 điểm**

- Role trong project: Owner / Member (Owner mới được xóa project)  
- Filter & search task (theo status, priority, deadline)  
- Soft delete (isDeleted flag)  
- Upload avatar user (Multer \+ Cloudinary hoặc local)

### **Yêu cầu kỹ thuật**

| Yêu cầu | Công nghệ bắt buộc |
| :---- | :---- |
| Framework | Express.js |
| Database | MongoDB \+ Mongoose v8+ |
| Authentication | JWT \+ Refresh Token \+ bcrypt |
| Realtime | Socket.io |
| Validation | Mongoose schema validation |
| Environment | dotenv |
| Error handling | Global error handling middleware |
| Cấu trúc project | MVC hoặc folder-by-feature |
| Deploy | Render / Railway / Vercel (miễn phí) |

**Lưu ý**:

- Có `.env` (không commit file .env)  
- Code sạch, comment rõ ràng, có README chi tiết

### **Nộp bài**

1. Source code trên GitHub (có .gitignore, commit history)  
2. File `README.md` chi tiết (cách chạy, API list, link demo video trình bày về tính năng)  
3. Postman Collection (export JSON)  
4. Link deploy live (Render/Railway, gắn domain)  
5. Video demo 5 phút (chạy realtime trên 2 trình duyệt)  
6. Báo cáo nhóm (1–2 trang): phân công, khó khăn, bài học rút ra

### **THANG ĐIỂM CHI TIẾT (TỔNG 10 ĐIỂM)**

| Tiêu chí | Điểm | Ghi chú |
| :---- | :---- | :---- |
| **Authentication & Authorization** (JWT, refresh token, protect route) | 1.5 | Phải có refresh token |
| **Models & Database** (Schema hợp lý, validation, populate, index) | 1.5 | Mongoose schema sạch |
| **CRUD Project \+ Task \+ Comment** | 2.0 | Đầy đủ, đúng phân quyền |
| **Realtime Socket.io** (cập nhật status, comment, assignee) | 2.0 | Hoạt động realtime ổn định |
| **Dashboard & Business logic** (overdue, filter) | 1.0 | Logic đúng |
| **Code quality & Structure** (folder, error handling, middleware) | 1.0 | Code sạch, dễ đọc |
| **Documentation & Deploy** (README, Postman, live URL) | 1.0 | Đầy đủ |
| **Tổng** | **10** | \- |

**Điểm cộng (2)**: Thêm role Owner/Member, upload avatar, filter/search nâng cao, hoặc test case đơn giản.  
