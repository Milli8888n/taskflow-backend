# ĐÀO SÂU TRONG MODULE 7: TÍNH NĂNG NÂNG CAO (ADVANCED & EXTENSIONS)

Đây là 2 tính năng (+2 điểm) tùy chọn mà đề bài đề cập để giúp dự án TaskFlow từ mức "Đáp ứng yêu cầu" leo lên mức "Xuất sắc/Tuyệt đối" và sát nhất với bản thể Trello ngoài đời thực.

---

## 📸 Sub-Item 1: Triển khai Upload Avatar (Multer + Cloudinary)

Upload file là cơn ác mộng đối với API JSON thuần túy (vì JSON không thể bọc file ảnh gửi đi được). API phải được chuyển sang dạng gửi `multipart/form-data`. Nếu lưu thẳng file hình vào máy chủ Node.js cục bộ thì sẽ rất nguy hiểm, tốn ổ cứng và bị xoá sạch nếu deploy lại Server ở Render. Cách giải quyết là đưa cho ông kệ trung gian Cloudinary giữ hộ.

* **Kiến trúc luồng Upload (Bắt buộc chia 2 nhịp):**
  1. `Multer`: Middleware ở máy chủ Node chặn cái request chứa File Ảnh lại. Lưu tạm hình bằng RAM hoặc trong ổ `/tmp`.
  2. `Cloudinary Upload`: Bóc tấm hình lưu tạm, tải thẳng qua hệ thống Cloudinary để lấy về đường Link Ảnh tĩnh (vd: `https://resp.cloudinary.com/..img.png`).
  3. `Mongoose Save`: Lưu chuỗi Link Ảnh đẹp đẽ đó vào DB `User.avatar`. Rất nhẹ cho DB cục bộ.

* **Code Skeleton Triển khai (Bàn Cân Middleware):**
  Cần một tệp Router riêng, ví dụ: `PATCH /api/v1/users/update-avatar`.

  ```javascript
  // 1. Khai báo Middleware Multer đánh võng lấy Data
  const multer = require('multer');
  // Cấu hình Multer lưu bằng RAM (MemoryStorage) cực kì sạch, khỏi tạo tệp rác. Phù hợp xài chung Cloudinary.
  const upload = multer({ storage: multer.memoryStorage() }); 

  // 2. Bên trong Route khai báo 2 nút chặn Middlewares (Chặn Đăng nhập Cùng Nút Bắt Tệp)
  router.patch(
      '/update-avatar', 
      protect, // Check Login bắt JWT
      upload.single('avatar_file_input_name'), // Middleware đớp ảnh từ cái Form có tên input này
      userController.uploadAvatar // Chạy Controller xử lí gọi Cloudinary
  );
  ```

* **Controller Logic (`userController.js`):**
  Lúc sang tới Controller, bản thân thuộc tính Request đã có đính kèm một cục Rác Nhớ gọi là `req.file`. Chỉ việc móc `req.file.buffer` nạp vào gói SDK Cloudinary, lấy cái Link URL cập nhật vào `User.findByIdAndUpdate` là hoàn hảo vòng tròn Avatar.

---

## ↕️ Sub-Item 2: Xử Lý Trật Tự Dòng Thẻ (Trello Order Index Sorting)

Trong Trello xịn, kéo thẻ qua lại giữa To Do - In progress không chỉ đổi Thuộc tính Cột (Status). Bạn còn có thể đổi thứ tự xếp từ trên xuống dưới của tấm thẻ.

* **Thiết kế Database (Model Rework):**
  Bắt buộc phải bổ sung 1 thuộc tính Cấp bậc số nguyên vào Schema.
  ```javascript
  // Tại taskModel.js
  const taskSchema = new mongoose.Schema({
    status: { enum: ['To Do',...]},
    indexOrder: { type: Number, required: true } // Vd: 1000, 2000, 3000
  });
  ```

* **Thuật Toán LexoRank Logic (Lexicographical Kéo Thả Mảng Array):**
  Việc bấm nút kéo thả 1 thẻ chen giữa 2 thẻ khác (Kẹp thịt) đòi hỏi tính toán khá khét lẹt. Thay vì bạn đổi tay indexOrder của hàng ngàn tấm thẻ theo kiểu 1-2-3-4-5-6 khi chèn vô giữa. Có 1 kĩ năng tính toán phân phân số `Logic Mid-Number`.
  
  **Cách Tính Nhanh:**
  - Board gốc có 3 lá bài: A (Order 1000), B (Order 2000).
  - Khách kéo 1 lá C chèn ngâm vô chính giữa A và B.
  - Phía FrontEnd gửi lên Server: "Ê API, tao mới quăng lá C zô giữa hai lá kia. Lá Nằm Trên Mày cầm mốc là Order 1000, lá Nằm Dưới là Order 2000 nhe!".
  - Server (Service Layer) sẽ xử lí phép tính: `(1000 + 2000) / 2 = 1500`. 
  - Khắc cái Order `1500` vào DB của lá bài C. Chỉ Cập nhật đúng 1 tấm lá C. Bỏ qua các lá râu ria còn lại. `UPDATE task SET indexOrder = 1500 WHERE id = C`.
  
  Khi Load Dashboard lại, `Task.find(...).sort({ indexOrder: 1 })`. Hệ thống sẽ dọn nguyên mảng Array đúng thứ hạng (A 1000, C 1500, B 2000). Rất nhanh và không xáo trộn DB.

---

## 💡 Tổng Kết Mở Rộng:
Module 7 không mang tính ép buộc nhưng lại cho thấy trình độ cấu trúc dữ liệu của bạn nếu thực thi (nhất là thuật toán Sort Order kẹp thịt phía trên). Nếu có thời gian, khi hoàn thiện 100% 6 module trước, bạn hãy vác Multer vào bổ sung luồng Update Avatar để ứng dụng bóng bẩy và mang dáng dấp 1 cái Cổng System chuẩn chỉ ngoài doanh nghiệp hơn!
