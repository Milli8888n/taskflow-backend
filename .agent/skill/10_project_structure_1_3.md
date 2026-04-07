# PHÂN TÍCH VAI TRÒ GIỮA CONTROLLER, SERVICE VÀ MONGOOSE SCHEMA

Trong kiến trúc phần mềm chuyên nghiệp, việc phân định rõ trách nhiệm của từng tầng (Layer) giúp hệ thống trở nên minh bạch, dễ kiểm thử và bảo trì. Tài liệu này phân tích sâu về vai trò của Controller, Service và các tính năng mạnh mẽ của Mongoose Schema.

---

## 1. Mongoose Schema & Model (Tầng Dữ liệu - Data Layer)

Mongoose Schema không chỉ đơn thuần là định nghĩa cấu trúc bảng (Collection), mà còn là nơi thực hiện các ràng buộc dữ liệu và các logic nội tại của đối tượng.

### Các hàm và tính năng quan trọng:
*   **Validation (Kiểm tra dữ liệu):** Thực hiện kiểm tra tính hợp lệ ngay tại tầng Schema (ví dụ: `required`, `enum`, `min/max`, `match` cho Regex).
*   **Middleware (Hooks):** Cho phép can thiệp vào vòng đời của dữ liệu.
    *   *Pre-save:* Thường dùng để mã hóa mật khẩu trước khi lưu vào database.
    *   *Post-save:* Thường dùng để gửi email thông báo sau khi tạo tài khoản thành công.
*   **Instance Methods (Phương thức thực thể):** Các hàm xử lý logic trên một bản ghi cụ thể. Ví dụ: `user.comparePassword()`.
*   **Statics (Phương thức tĩnh):** Các hàm xử lý trên toàn bộ Collection. Ví dụ: `User.findByEmail()`.
*   **Virtuals:** Tạo ra các trường dữ liệu ảo không lưu trong database nhưng có thể truy xuất (ví dụ: `fullName` được kết hợp từ `firstName` và `lastName`).

---

## 2. Service Layer (Tầng Logic Nghiệp vụ - Business Logic Layer)

Service Layer đóng vai trò là "bộ não" của ứng dụng. Đây là nơi chứa các quy tắc nghiệp vụ (Business Rules) và tương tác trực tiếp với cơ sở dữ liệu thông qua Mongoose Model.

### Vai trò chính:
*   **Xử lý logic phức tạp:** Nếu một chức năng đòi hỏi tính toán, gọi nhiều Model cùng lúc hoặc gọi API từ bên thứ ba, toàn bộ code này phải nằm ở Service.
*   **Tính tái sử dụng:** Một hàm trong Service có thể được gọi bởi nhiều Controller khác nhau (ví dụ: hàm `createUser` có thể dùng cho cả trang đăng ký của khách hàng và trang quản trị của Admin).
*   **Tách biệt Database:** Controller không cần quan tâm dữ liệu được lấy từ MongoDB, PostgreSQL hay một API khác; nó chỉ việc gọi Service và nhận kết quả.

---

## 3. Controller Layer (Tầng Điều hướng - Request/Response Layer)

Controller đóng vai trò là "người điều phối" (Orchestrator). Nó tiếp nhận yêu cầu từ người dùng và quyết định phải làm gì tiếp theo.

### Vai trò chính:
*   **Trích xuất dữ liệu:** Lấy thông tin từ `req.params`, `req.query`, hoặc `req.body`.
*   **Gọi Service:** Chuyển dữ liệu đã trích xuất xuống tầng Service để xử lý.
*   **Điều hướng kết quả (Flow Control):** Dựa trên kết quả trả về từ Service để quyết định:
    *   Trả về mã lỗi (400, 404, 500...).
    *   Trả về dữ liệu JSON (cho API).
    *   Render giao diện EJS (cho Website).
*   **Không chứa logic nghiệp vụ:** Controller không nên thực hiện các phép tính toán hay kiểm tra database trực tiếp.

---

## 4. Ví dụ minh họa sự phối hợp

Giả sử thực hiện chức năng **Đăng ký người dùng**:

### Bước 1: Mongoose Schema (`models/userModel.js`)
Sử dụng **Middleware** để tự động mã hóa mật khẩu.
```javascript
const userSchema = new mongoose.Schema({ /* ... */ });

// Middleware: Tự động băm mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
```

### Bước 2: Service Layer (`services/userService.js`)
Xử lý logic kiểm tra sự tồn tại của người dùng.
```javascript
const User = require('../models/userModel');

exports.registerUser = async (userData) => {
  // Logic nghiệp vụ: Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('Email này đã được sử dụng');
  }
  
  // Lưu vào DB (Schema Middleware sẽ tự mã hóa mật khẩu)
  const user = new User(userData);
  return await user.save();
};
```

### Bước 3: Controller Layer (`controllers/userController.js`)
Điều phối dữ liệu và trả về phản hồi cho client.
```javascript
const userService = require('../services/userService');

exports.register = async (req, res, next) => {
  try {
    // 1. Lấy dữ liệu từ Request
    const userData = req.body;

    // 2. Gọi Service xử lý
    const newUser = await userService.registerUser(userData);

    // 3. Phản hồi kết quả
    res.status(201).render('auth/success', { user: newUser });
  } catch (error) {
    // Chuyển lỗi sang Middleware xử lý lỗi tập trung
    next(error);
  }
};
```

---

## 5. Bảng tóm tắt so sánh

| Đặc điểm | Mongoose Schema | Service | Controller |
| :--- | :--- | :--- | :--- |
| **Trọng tâm** | Cấu trúc dữ liệu & Ràng buộc | Logic nghiệp vụ (Business Rules) | Giao tiếp người dùng (Req/Res) |
| **Tương tác DB** | Trực tiếp thông qua API Mongoose | Gọi các phương thức của Model | Không tương tác trực tiếp |
| **Đầu vào** | Schema Definition | Các tham số từ Controller | `req` (Request object) |
| **Đầu ra** | Mongoose Document | Dữ liệu thô / Object | `res` (Response / HTML) |

### Kết luận:
Việc tuân thủ sự phân tầng này giúp tránh tình trạng **"Fat Controller"** (Controller chứa quá nhiều code xử lý). Khi Controller "mỏng" (Thin Controller), ứng dụng sẽ rất linh hoạt: bạn có thể thay đổi giao diện từ EJS sang React mà không cần sửa một dòng code nào trong Service hay Model.