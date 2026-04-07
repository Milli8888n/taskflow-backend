# BỔ SUNG KẾ HOẠCH KIỂM THỬ TÍCH HỢP VÀO TỪNG MICRO-TASK (TEST PLAN)

Tài liệu này bổ sung **Test Cases** gắn trực tiếp vào từng Micro-Task đã được định nghĩa trong `agile_sprint_plan.md`. Mỗi task code xong BẮT BUỘC phải chạy qua các bài test tương ứng mới được chuyển trạng thái "Done".

> **Nguyên tắc DoD (Definition of Done):** Một task chỉ được coi là HOÀN THÀNH khi:
> 1. Code chạy không lỗi.
> 2. Postman test pass tất cả test cases tương ứng.
> 3. Đã xử lý Edge Cases (Gửi thiếu dữ liệu, Token sai, ID không tồn tại).
> 4. Đã được 1 người khác trong team review code.

---

## 🟢 SPRINT 1: TEST CASES CHO NỀN MÓNG & AUTH

### S1-04: Kết nối MongoDB Atlas
| # | Test Case | Input | Expected Output | Loại |
|:--|:---|:---|:---|:---|
| TC-01 | Kết nối DB thành công với URI đúng | URI hợp lệ trong .env | Console log "MongoDB Connected: ..." | Happy |
| TC-02 | Kết nối DB thất bại với URI sai | URI sai/thiếu | Console log lỗi, process.exit(1) | Sad |

### S1-08: User Model (Schema + Hooks)
| # | Test Case | Input | Expected Output | Loại |
|:--|:---|:---|:---|:---|
| TC-03 | Tạo user thành công | { name, email, password } đầy đủ | Document được lưu, password đã bị hash (bắt đầu bằng `$2b$`) | Happy |
| TC-04 | Tạo user thiếu email | { name, password } | Mongoose ValidationError: "email is required" | Sad |
| TC-05 | Tạo user email sai format | { email: "abc" } | Mongoose ValidationError: "Email không hợp lệ" | Sad |
| TC-06 | Tạo user email trùng | Email đã tồn tại trong DB | MongoDB Error code 11000 (Duplicate Key) | Sad |
| TC-07 | Password bị hash tự động | Tạo user, rồi đọc lại từ DB | field `password` !== password gốc, bắt đầu bằng `$2b$10$` | Happy |
| TC-08 | comparePassword đúng | Gọi user.comparePassword("đúng_pass") | return true | Happy |
| TC-09 | comparePassword sai | Gọi user.comparePassword("sai_pass") | return false | Sad |

### S1-09 + S1-10: API Register
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-10 | Đăng ký thành công | POST /api/v1/auth/register, body: { name, email, password } | Status 201, trả về user object (KHÔNG có trường password) | Happy |
| TC-11 | Đăng ký thiếu field | Body thiếu `email` | Status 400, message: "Vui lòng cung cấp email" | Sad |
| TC-12 | Đăng ký email đã tồn tại | Email trùng với user đã có | Status 400, message: "Email đã được đăng ký" | Sad |
| TC-13 | Đăng ký password quá ngắn | password: "123" | Status 400, message: "Mật khẩu phải lớn hơn 6 ký tự" | Sad |

### S1-09 + S1-10: API Login
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-14 | Đăng nhập thành công | POST /api/v1/auth/login, body: { email, password đúng } | Status 200, trả về accessToken + refreshToken | Happy |
| TC-15 | Đăng nhập sai password | password sai | Status 401, message: "Sai mật khẩu" | Sad |
| TC-16 | Đăng nhập email không tồn tại | email chưa đăng ký | Status 404, message: "Email chưa được đăng ký" | Sad |
| TC-17 | Đăng nhập thiếu field | Body rỗng {} | Status 400, message: "Vui lòng cung cấp email và mật khẩu" | Sad |

### S1-12: Auth Middleware (Protect)
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-18 | Gọi API có token hợp lệ | Header: Bearer <valid_token> | Đi qua middleware, req.user được gắn | Happy |
| TC-19 | Gọi API không có token | Không có header Authorization | Status 401, message: "Bạn chưa đăng nhập" | Sad |
| TC-20 | Gọi API token hết hạn | Token đã expire | Status 401, message: "Token hết hạn" | Sad |
| TC-21 | Gọi API token fake/bị sửa | Token bị thay đổi 1 ký tự | Status 401, message: "Token không hợp lệ" | Sad |

### S1-14: API Refresh Token
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-22 | Refresh thành công | POST /api/v1/auth/refresh, body: { refreshToken hợp lệ } | Status 200, trả về accessToken mới | Happy |
| TC-23 | Refresh token không tồn tại trong DB | refreshToken đã bị xóa/thu hồi | Status 403, message: "Token bị thu hồi" | Sad |
| TC-24 | Refresh token hết hạn | refreshToken cũ quá 7 ngày | Status 401, message: "Refresh token hết hạn" | Sad |

---

## 🔵 SPRINT 2: TEST CASES CHO CRUD

### S2-01 → S2-06: Project APIs
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-25 | Tạo project thành công | POST /api/v1/projects, body: { name, description } | Status 201, owner = req.user.id, members chứa owner | Happy |
| TC-26 | Tạo project thiếu tên | Body: { description } | Status 400, "name is required" | Sad |
| TC-27 | Lấy danh sách project của tôi | GET /api/v1/projects | Status 200, chỉ trả về projects mà tôi là member/owner | Happy |
| TC-28 | Lấy danh sách khi chưa có project | User mới, chưa tạo/join project nào | Status 200, data: [] (mảng rỗng) | Edge |
| TC-29 | Thêm member thành công | POST /api/v1/projects/:id/members, body: { email } | Status 200, members array tăng thêm 1 | Happy |
| TC-30 | Thêm member - không phải owner | User không phải owner gọi API | Status 403, "Chỉ chủ dự án mới có quyền" | Sad |
| TC-31 | Thêm member - email không tồn tại | email chưa đăng ký hệ thống | Status 404, "Không tìm thấy tài khoản" | Sad |
| TC-32 | Thêm member đã tồn tại trong project | email đã là member | Status 400, "Thành viên đã có trong dự án" | Sad |
| TC-33 | Xóa project (owner) | DELETE /api/v1/projects/:id, user = owner | Status 200, project.isDeleted = true | Happy |
| TC-34 | Xóa project (member thường) | DELETE, user ≠ owner | Status 403, "Chỉ chủ dự án mới được xóa" | Sad |
| TC-35 | Xóa project - ID không tồn tại | DELETE với ObjectId random | Status 404, "Không tìm thấy dự án" | Sad |

### S2-07 → S2-10: Task APIs
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-36 | Tạo task thành công | POST /api/v1/projects/:pId/tasks, body đầy đủ | Status 201, task.projectId = pId, status = "To Do" | Happy |
| TC-37 | Tạo task - user không thuộc project | User ngoài project gọi tạo task | Status 403, "Bạn không có quyền" | Sad |
| TC-38 | Tạo task - assign cho người ngoài project | assignee ID không nằm trong members | Status 400, "Người được giao không thuộc dự án" | Sad |
| TC-39 | Cập nhật status task | PUT /api/v1/tasks/:id, body: { status: "In Progress" } | Status 200, task.status = "In Progress" | Happy |
| TC-40 | Cập nhật status giá trị lạ | body: { status: "Hacking" } | Status 400, Mongoose enum validation error | Sad |
| TC-41 | Lấy tasks + filter status | GET /api/v1/projects/:pId/tasks?status=Done | Status 200, tất cả tasks trả về đều có status = "Done" | Happy |
| TC-42 | Lấy tasks + filter priority | GET ...?priority=High | Status 200, tất cả tasks trả về đều có priority = "High" | Happy |
| TC-43 | Lấy tasks project rỗng | Project chưa có task nào | Status 200, data: [] | Edge |

### S2-11 → S2-13: Comment APIs
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-44 | Thêm comment thành công | POST /api/v1/tasks/:tId/comments, body: { content } | Status 201, comment.author = req.user.id | Happy |
| TC-45 | Thêm comment - nội dung rỗng | body: { content: "" } | Status 400, "content is required" | Sad |
| TC-46 | Thêm comment - user ngoài project | User không thuộc project chứa task | Status 403 | Sad |
| TC-47 | Lấy danh sách comments | GET /api/v1/tasks/:tId/comments | Status 200, mảng comments sorted mới nhất trước, author đã populate (name, avatar) | Happy |

---

## 🟡 SPRINT 3: TEST CASES CHO REALTIME & DASHBOARD

### S3-01 → S3-07: Socket.io Realtime
| # | Test Case | Cách Test | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-48 | Socket connect với token hợp lệ | Client gửi auth: { token } | Server log "User vào mạng: ..." | Happy |
| TC-49 | Socket connect không có token | Client connect không gửi token | Server từ chối, emit error | Sad |
| TC-50 | Join room thành công | Client emit 'join_project' với projectId | Server log "User vô phòng ..." | Happy |
| TC-51 | Realtime task_status_changed | Tab A: PUT đổi status task. Tab B: đang mở cùng board | Tab B tự động nhận event, DOM card di chuyển sang cột mới | Happy |
| TC-52 | Realtime new_comment | Tab A: POST comment mới. Tab B: đang mở cùng task | Tab B tự động hiện comment mới mà không reload | Happy |
| TC-53 | Realtime task_assigned | Gán assignee cho task | Tất cả member trong room nhận thông báo | Happy |
| TC-54 | Realtime cross-project isolation | User ở Project X đổi task | User đang ở Project Y KHÔNG nhận được event | Isolation |

### S3-08 → S3-13: Dashboard
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-55 | Dashboard trả về tasks được giao cho tôi | GET /api/v1/users/me/tasks | Chỉ chứa tasks có assignee = tôi | Happy |
| TC-56 | Dashboard không chứa task đã Done | User có task Done lẫn To Do | Response chỉ có To Do và In Progress | Happy |
| TC-57 | Overdue flag đúng | Task có deadline = hôm qua, status != Done | isOverdue = true | Happy |
| TC-58 | Overdue flag sai | Task có deadline = ngày mai | isOverdue = false | Happy |
| TC-59 | Task không có deadline | deadline = null | isOverdue = false (không crash) | Edge |
| TC-60 | Dashboard user mới (chưa được giao task) | User chưa bị assign task | Status 200, data: { overdue: [], inProgress: [], todo: [] } | Edge |

### S3-14 → S3-17: Upload Avatar
| # | Test Case | Postman Request | Expected | Loại |
|:--|:---|:---|:---|:---|
| TC-61 | Upload avatar thành công | PATCH /api/v1/users/update-avatar, form-data: file ảnh .jpg | Status 200, user.avatar = URL Cloudinary | Happy |
| TC-62 | Upload file không phải ảnh | Gửi file .pdf | Status 400, "Chỉ chấp nhận file ảnh" | Sad |
| TC-63 | Upload không đính kèm file | Request không có file | Status 400, "Vui lòng chọn ảnh" | Sad |

---

## 🔴 SPRINT 4: INTEGRATION TEST & CHECKLIST NGHIỆM THU

### S4-01: Bug Bash Session (Toàn team)
| # | Kịch bản Test Tích Hợp End-to-End | Người Test |
|:--|:---|:---|
| E2E-01 | Đăng ký User A → Đăng nhập → Tạo Project → Tạo 3 Task → Gán Task cho chính mình → Kiểm tra Dashboard hiện 3 task | DEV-1 |
| E2E-02 | Đăng ký User B → User A mời User B vào Project → User B tạo Task → User A thấy task mới (Realtime) | DEV-2 |
| E2E-03 | User B kéo Task từ To Do sang Done → User A tự động thấy card nhảy cột (Realtime 2 browser) | DEV-3 |
| E2E-04 | User B comment vào Task → User A thấy comment mới xuất hiện (Realtime) → Kiểm tra populate author có name + avatar | DEV-4 |
| E2E-05 | User B (member) cố xóa Project → Bị chặn 403. User A (owner) xóa Project → Thành công, project biến mất khỏi list | DEV-1 |
| E2E-06 | Token hết hạn → Gọi refresh → Nhận token mới → Tiếp tục thao tác bình thường | DEV-3 |
| E2E-07 | User C (không thuộc project) cố gắng tạo Task/Comment trong project của A → Bị chặn 403 | DEV-2 |
| E2E-08 | Deploy trên Render → Chạy lại toàn bộ E2E-01 đến E2E-07 trên URL production | DEV-4 |
