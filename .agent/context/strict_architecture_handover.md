# TÀI LIỆU CẤU TRÚC KIẾN TRÚC & THƯ MỤC CỐT LÕI (STRICT SKILL-BASED DESIGN)

Sau khi đối chiếu nghiêm ngặt với các tiêu chuẩn trong bộ tài liệu `skill` của dự án (đặc biệt là `10_project_structure`), kiến trúc của dự án **TaskFlow** bắt buộc phải tuân thủ mô hình **Phân tầng rõ rệt (Layered Architecture)** có bao gồm **Tầng Service (Service Layer)** và tích hợp **View Engine (EJS)**.

Việc tuân thủ đúng bộ skill này không chỉ phân định rõ trách nhiệm (Single Responsibility) mà còn giúp team dễ dàng chấm lỗi và chấm điểm kiến trúc.

---

## 1. CẤU TRÚC THƯ MỤC CHUẨN (FOLDER BOILERPLATE)

Bạn tiến hành tạo cấu trúc thư mục từ thư mục gốc của dự án chính xác như sau:

```text
TaskFlow-Project/
├── public/                 # Chứa tài nguyên tĩnh (Static files)
│   ├── css/                # style.css (Custom CSS cho giao diện)
│   ├── js/                 # Client-side javascript (xử lý Socket.io phía client)
│   └── images/             # Lưu trữ ảnh (vd: avatar)
├── src/                    # Toàn bộ mã nguồn chạy trên Server
│   ├── config/             # Cấu hình hệ thống
│   │   └── db.js           # Kết nối Mongoose tới MongoDB
│   ├── controllers/        # Điều hướng Request/Response
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── models/             # Mongoose Schema & Middleware (Hooks)
│   │   ├── userModel.js
│   │   ├── projectModel.js
│   │   └── taskModel.js
│   ├── services/           # [QUAN TRỌNG] Tầng Business Logic (Nghiệp vụ cốt lõi)
│   │   ├── authService.js
│   │   ├── projectService.js
│   │   └── taskService.js
│   ├── routes/             # Cấu hình Endpoint API
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── index.js        # File gom tất cả Routes lại
│   ├── middlewares/        # Hàm trung gian bảo vệ logic
│   │   ├── authMiddleware.js # Kiểm tra mã JWT
│   │   └── errorHandler.js   # Bắt lỗi nguyên khối (Global)
│   ├── utils/              # Các hàm tiện ích dùng chung
│   ├── views/              # Giao diện Render HTML (Sử dụng EJS)
│   │   ├── partials/       # Header, Footer, Sidebar chung
│   │   ├── layouts/        # Khung giao diện chính
│   │   ├── auth/           # Trang Login/Register (.ejs)
│   │   └── dashboard/      # Trang quản lý Board/Task (.ejs)
│   ├── app.js              # Cấu hình Express, View Engine EJS và Middlewares
│   └── server.js           # Điểm khởi chạy (Entry point) gắn process.env.PORT và chạy Socket.io
├── .env                    # Biến môi trường (PORT, MONGO_URI, JWT_SECRET)
├── .gitignore              # Bỏ qua node_modules, .env
├── package.json            # Thư viện (express, mongoose, ejs, bcrypt, jsonwebtoken, socket.io...)
└── README.md
```

---

## 2. QUY CHUẨN ĐƯỜNG ĐI DỮ LIỆU (THE 4-LAYER DATA FLOW)

Điểm khác biệt quan trọng theo đúng bộ `skill`: Dữ liệu bắt buộc phải đi qua **4 tầng riêng biệt**. Controller **tuyệt đối không** gọi thẳng Mongoose Database.

### Tầng 1: Route Layer (`src/routes`)
- Chỉ đóng vai trò nhận đường dẫn URL.
- Ví dụ: `router.post('/register', authController.register);`

### Tầng 2: Controller Layer (`src/controllers`) - "Người điều phối mỏng" (Thin Controller)
- Chỉ trích xuất `req.body`, `req.params`.
- Chuyển Data xuống cho **Service Layer**.
- Nhận kết quả từ Service và gọi API `res.json()` hoặc render giao diện `res.render()`.
- Chứa khối `try-catch` và đẩy lỗi vào `next(error)`.

### Tầng 3: Service Layer (`src/services`) - "Bộ não xử lý" (Fat Service)
- Toàn bộ logic kiểm tra mảng, xử lý điều kiện (VD: *Chỉ thành viên mới được xoá Task*, *Check email đã tồn tại*).
- Gọi phương thức điều khiển **Model Layer** (`.find()`, `.save()`).
- Nếu có lỗi nghiệp vụ rẽ nhánh, dùng `throw new Error('Đã có người dùng email này')`.

### Tầng 4: Mongoose Model Layer (`src/models`)
- Khởi tạo Schema với các Validation Type của MongoDB.
- Tận dụng sức mạnh của **Mongoose Middleware (Hooks)**: Phải đặt logic mã hoá (Bcrypt hashing password) ở hàm `pre('save')` trực tiếp trong file model thay vì băm bên trong Service.
- Định nghĩa các phương thức tĩnh (Statics) và phương thức cá nhân (Instance Methods) ví dụ: `user.comparePassword()`.

---

## 3. TÍCH HỢP VIEW ENGINE (EJS) THEO CHUẨN SKILLS

Trong tệp `src/app.js`, Express sẽ được setup như sau để hỗ trợ vừa cung cấp API cho Socket ở client, vừa render EJS:

```javascript
/* --- TRÍCH ĐOẠN APP.JS PHẢI CÓ --- */
const path = require('path');
const express = require('express');
const app = express();

// 1. Cấu hình View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Phục vụ tài nguyên tĩnh (CSS/JS FrontEnd)
app.use(express.static(path.join(__dirname, '../public')));

// 3. Phân tách Routes
// - Các Routes render màn hình HTML
app.use('/', require('./routes/viewRoutes')); 
// - Các Routes thuần Data (AJAX/Fetch trên Client gọi)
app.use('/api/v1', require('./routes/apiRoutes')); 
```

**TIPS Bàn Giao Cốt Lõi:** Bằng việc ép buộc các bạn Dev phân rã logic ra đưa vào **Thư mục `services`**, ứng dụng sẽ không bao giờ bị "phình" tệp Controller. Ngoài ra, việc dùng Models để thực thi "pre-save hooks" sẽ đạt thiết kế nguyên tắc SOLID rất cao.
