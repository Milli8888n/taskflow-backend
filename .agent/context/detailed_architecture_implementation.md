# HƯỚNG DẪN TRIỂN KHAI KIẾN TRÚC CHI TIẾT (IMPLEMENTATION GUIDE)

Tài liệu này đi sâu vào **chức năng, nguyên tắc code và cung cấp template chi tiết** cho từng lớp (Layer) trong kiến trúc thư mục chuẩn đã định nghĩa. Đội ngũ Lập trình viên (Devs) cần lấy các snippets ở đây làm bộ khung tiêu chuẩn (Boilerplate).

---

## 1. TẦNG DATA & MODEL (MONGOOSE SCHEMAS & HOOKS)
Tầng thấp nhất. Đảm nhận việc giao tiếp cơ sở dữ liệu và "tự động hóa" các nghiệp vụ liên quan đến lưu trữ.

**Nguyên tắc triển khai:**
- Bắt buộc khai báo các Validation (Xác thực ràng buộc) chặt chẽ nhất có thể.
- **[QUAN TRỌNG]** Mọi thao tác *băm mật khẩu (Hash)* trước khi Insert database phải thực hiện tại đây nhờ cơ chế `pre('save')` Middleware của Mongoose.

📌 **Code Skeleton Template (models/userModel.js):**
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, 'Vui lòng cung cấp email'], 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: { 
    type: String, 
    required: true,
    minlength: [6, 'Mật khẩu phải lớn hơn 6 ký tự']
  }
}, { timestamps: true });

// Mongoose Pre-save Hook: Mã hóa mật khẩu
userSchema.pre('save', async function(next) {
  // Nếu password không bị thay đổi (vd: update name), nhảy qua ko mã hoá lại
  if (!this.isModified('password')) return next();
  
  // Băm mật khẩu (Salt Rounds = 10)
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance Method: So sánh mật khẩu bằng hàm tự định nghĩa
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

---

## 2. TẦNG LOGIC NGHIỆP VỤ (SERVICE LAYER)
Nơi chứa toàn bộ cốt lõi phân tích, tính toán, và quy tắc kinh doanh. (Phần khó nhất nằm ở đây).

**Nguyên tắc triển khai:**
- **Tuyệt đối không** truyền đối tượng `req, res` vào Service. Service chỉ nhận giá trị tham số thuần túy (Mảng, Object, Biến).
- Nếu gặp lỗi nghiệp vụ (Vd: Task sai, Dữ liệu trùng, Không đủ quyền), dùng lệnh `throw new Error('Message')` để ném thẳng ra cho Controller bắt bằng `catch`.
- Tách bạch logic ra từng hàm con nhỏ.

📌 **Code Skeleton Template (services/taskService.js):**
```javascript
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');

exports.createTask = async (projectId, taskData, userId) => {
  // 1. Kiểm tra Project có tồn tại
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Dự án không tồn tại');

  // 2. Logic: Chỉ thành viên mới được thêm Task
  // Chuyển Object ID sang String để check
  const isMember = project.members.some(id => id.toString() === userId.toString());
  if (!isMember) throw new Error('Bạn không có quyền thao tác trên Dự án này');

  // 3. Thực thi Database
  const newTask = await Task.create({
    ...taskData,
    projectId: projectId,
  });
  
  // 4. Return Object thuần
  return newTask;
};
```

---

## 3. TẦNG ĐIỀU HƯỚNG REQUEST/RESPONSE (CONTROLLER LAYER)
"Bộ não mỏng". Đóng vai trò kiểm soát luồng giao tiếp với Frontend. 

**Nguyên tắc triển khai:**
- Chỉ trích xuất Dữ liệu (từ `req.body`, `req.params`, `req.user`).
- Nắm bắt Ngoại lệ (Exceptions) toàn cục: Phải bọc mọi thứ trong khối `try...catch` và đá lỗi đi bằng `next(error)`.
- Chịu trách nhiệm Format JSON trả về: `res.status(200).json(...)`.
- Nếu trang web xài EJS: Sử dụng format `res.render('viewFile', { data })`.

📌 **Code Skeleton Template (controllers/taskController.js):**
```javascript
const taskService = require('../services/taskService');

exports.createTask = async (req, res, next) => {
  try {
    // Thu thập Input
    const { projectId } = req.params;
    const taskData = req.body;
    const userId = req.user.id; // Lấy từ middleware auth

    // Giao phó cho Bộ phận Xử lý Logic (Service)
    const task = await taskService.createTask(projectId, taskData, userId);

    // Gửi kết quả JSON tiêu chuẩn
    res.status(201).json({
      status: 'success',
      data: task,
      message: 'Tạo nhiệm vụ thành công'
    });
    
  } catch (error) {
    // Đẩy bất cứ lỗi nào (Lỗi Schema Mongoose, lỗi 'Bạn ko có quyền' từ Service) 
    // đến Global Error Handler
    next(error); 
  }
};
```

---

## 4. TẦNG BẢO VỆ VÀ ĐỊNH TUYẾN (ROUTE & MIDDLEWARE LAYER)
Đây là các trạm thu phí và chốt kiểm tra an ninh trước khi thông tin được phép vào Controller.

**Nguyên tắc triển khai:**
- Một Route thường gắn liền với **AuthMiddleware** (Chống vào nếu chưa Login).
- Có thể gắn thêm RoleMiddleware (Check xem có phải Owner không).

📌 **Code Skeleton Template (middlewares/authMiddleware.js):**
```javascript
const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  try {
    // 1. Kiểm tra Bearer Token ở vùng Headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      throw new Error('Bạn chưa đăng nhập. Vui lòng cung cấp token!');
    }

    // 2. Xác thực (Verify Token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Truyền data User xuống Controller
    req.user = decoded; 
    next(); // Cho xe qua trạm
  } catch (error) {
    // Gắn statusCode = 401 Unauthorized trước khi đi vào Handler
    res.status(401);
    next(error);
  }
};
```

📌 **Router Kết Nối (routes/taskRoutes.js):**
```javascript
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

// Mọi Route bên dưới qua màng lọc Protect
router.use(protect); 

// Thiết lập Method và Endpoint
router.post('/projects/:projectId/tasks', taskController.createTask);

module.exports = router;
```

---

## 5. CỖ MÁY XỬ LÝ LỖI CUỐI ĐƯỜNG ỐNG (GLOBAL ERROR HANDLER)
Dự án được cho điểm cao hay thấp phụ thuộc vào cách bạn Format Lỗi (Error Formatting) đẹp đến mức nào. 

Nằm tại tệp `middlewares/errorHandler.js` và cắm tại `app.js` bằng lệnh `app.use(errorHandler`.

📌 **Code Skeleton Template:**
```javascript
exports.errorHandler = (err, req, res, next) => {
  // Lấy trạng thái lỗi hiện tại, nếu đang 200 (OK) mà gặp lỗi thì quy về 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Xử lý Lỗi đặc thù của Mongoose (VD: Lỗi ID ObjectId bị sai)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Không tìm thấy tài nguyên. ID không hợp lệ';
  }

  // Xử lý Lỗi Schema Field Require (Lỗi xác thực do Mongoose ném về khi .save())
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(val => val.message);
    message = `Dữ liệu không hợp lệ: ${errors.join('. ')}`;
  }

  // Trả về luồng JSON theo thiết kế
  res.status(statusCode).json({
    status: 'fail',
    message: message,
    // Hiện báo cáo Stack-trace kĩ thuật nếu đang chạy dev (tắt khi lên deploy)
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
```
