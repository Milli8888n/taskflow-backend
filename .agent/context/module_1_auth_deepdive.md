# ĐÀO SÂU TRONG MODULE 1: XÁC THỰC & ĐỊNH DANH (AUTH MODULE)

Tài liệu này bóc tách tận cùng đến từng dòng logic và luồng thuật toán dành riêng cho **Module 1 (Xác thực và phân quyền User bằng JWT)**. Việc nắm chắc module này quyết định 80% độ an toàn của hệ thống.

---

## 🏗 Sub-Item 1: Khởi tạo dữ liệu (User Model)

Đây là nơi cấu trúc tài nguyên bảng (collection) `Users` trong MongoDB bằng công cụ `Mongoose`.

* **Logic thiết yếu:**
  * Giới hạn thông tin: Chỉ thu thập `name`, `email`, `password`, và `avatar` (tuỳ chọn).
  * Unique Constraint: Kỹ thuật chặn trùng rập Email từ gốc CSDL. `email: { unique: true }`.
  * Ràng buộc mật khẩu: Chỉ nhận Hash bcrypt, tuyệt đối không chứa chữ Text-plain. Tích hợp `pre-save hook`.

* **Định vị:** Làm việc tại `/src/models/userModel.js`
* **Mã giả triển khai (Code Design):**
  - Mongoose Schema cấu hình `match:` cho Regex regex chuẩn để lọc email.
  - Xây build-in method `comparePassword` để sau này Controller gọi check pass (Trả về true/false).

---

## 🔗 Sub-Item 2: API Đăng ký Tài khoản (Register)

Người dùng cung cấp thông tin thô để tạo tài khoản lần đầu.

* **Routing (File `authRoutes.js`):** `POST /api/v1/auth/register`
* **Xử lý tính toán Layer Service (`authService.js`):**
  1. Nhận Object `{ name, email, password }`.
  2. Query hàm tìm kiếm `User.findOne({ email })`. Nếu đã tồn tại -> `throw new Error('Email đã được đăng ký', 400)`.
  3. Nếu không trùng, dùng `User.create(userData)`. Lúc này, hook bên Model tự chạy và hash cái mật khẩu thành rác `("$2b$10...")`.
  4. Ẩn password trước khi ném cục dữ liệu lại cho Controller (Bảo vệ thông tin rò rỉ).
* **Kết xuất Controller (`authController.js`):**
  - Bọc `try-catch`, nhận data sạch từ Service trả ra JSON trạng thái `201 Created`.

---

## 🔐 Sub-Item 3: API Đăng nhập (Login)

Kiểm tra định danh và cấp cho User cái thẻ ra vào (JWT Access Token) và Chứng minh nhân dân (Refresh Token).

* **Routing:** `POST /api/v1/auth/login`
* **Xử lý tính toán Layer Service:**
  1. Kiểm tra hụt nguyên liệu: Nếu user gửi thiếu email hoặc pass -> Vang lỗi 400.
  2. Tra cứu tồn tại: Dùng `User.findOne({ email }).select('+password')` (Tại vì ở Schema có thể cấu hình `select: false` để giấu đi, lúc check pass phải khai quật nó lên lại).
  3. So khớp bằng Hashing: Chạy `user.comparePassword(password)`. Nếu false -> Văng lỗi `Sai mật khẩu`.
  4. Nếu khớp: Chạy hàm Utils sinh ra `AccessToken` (payload chứa `{ id: user._id }`, hạn `15m`) và `RefreshToken` (hạn `7d`).
  5. Cập nhật lại chuỗi `RefreshToken` mới vào mảng `refreshTokens` nằm trong document CSDL của User (để có thể "thu hồi" từ xa nếu muốn).
* **Trả về (Controller):** Đính kèm AccessToken qua response JSON cho Client Frontend cầm, và khuyên dùng set `HttpOnly Cookie` chứa RefreshToken.

---

## 🔄 Sub-Item 4: Cấp đổi JWT Token mới (Refresh Token)

Do AccessToken cực kỳ ngắn (15 phút) nhằm an toàn, nên khi Frontend gọi API bị báo lỗi `401 Expired`, Frontend sẽ ngầm gửi `RefreshToken` để xin một `AccessToken` mới.

* **Routing:** `POST /api/v1/auth/refresh`
* **Luồng chạy:**
  1. Controller moi `refreshToken` ra từ JSON Body hoặc HTTP Cookie. Đẩy vô Service.
  2. Service check trong DB `User.findOne({ refreshToken })`.
  3. Nếu DB báo tìm thấy thẻ này (nghĩa là thẻ chưa bị thu hồi), tiến hành trích xuất ID ở trong để sinh ngay `AccessToken mới` và ném về lại JSON.

---

## 🛡️ Sub-Item 5: Vành đai bảo vệ API (Auth Middleware)

Cửa ngõ quan trọng ở thư mục `middlewares/authMiddleware.js`. Bất cứ ai muốn tạo Task hay Update Dự án đều phải bước qua đây.

* **Vai trò:** Phân tách luồng thông suốt và bảo mật.
* **Chiến lược lọc:**
  1. Tìm Header `Authorization: Bearer <token_string>` từ Request bắn lên.
  2. Nếu không tìm thấy chữ Bearer -> Kick `401 Unauthorized`.
  3. Gọi thư viện `jwt.verify(token, mập_khẩu_chìa_khoá_mật_từ_file_ENV)`. Nếu sai (do thư viện này báo lỗi Fake Token, hết hạn) -> Handler bắt và báo 401.
  4. Nếu giải mã (verify) thành công, lấy được `userId` (Payload).
  5. Tìm `User` này trong DB. Rất có mảng trường hợp: Vừa có bằng thật nhưng User này vừa bị xoá mất tiêu rồi (bị ban nick). Khúc này phải check kĩ `if (!userExists)` thì ko pass.
  6. **ĐIỂM NHẤN:** Xong xuôi thì gắn cái id đó vào bộ nhớ đệm: `req.user = user`. Đẩy cờ đi tiếp `next()`. 

*Điều tuyệt diệu là nhờ có `req.user` ở đây, bất kể Controller nào đứng đằng sau bảo vệ (Ví dụ API Xoá Dự án) đều biết chính xác ai đang xoá (Gõ `req.user._id`), qua đó chống Hacker chèn fake ID được.*
