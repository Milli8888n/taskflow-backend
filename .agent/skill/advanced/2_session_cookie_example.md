# Triển khai **Cookie** và **Session** trong ứng dụng Node.js Express.

### 1. Cài đặt các thư viện cần thiết

Để làm việc với Cookie và Session, cần cài đặt hai thư viện trung gian (middleware) phổ biến:
*   `cookie-parser`: Hỗ trợ đọc và ghi dữ liệu Cookie từ Request/Response.
*   `express-session`: Hỗ trợ quản lý phiên làm việc của người dùng trên Server.

```bash
npm install express cookie-parser express-session
```

---

### 2. Mã nguồn triển khai chi tiết (`app.js`)

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();

// --- CẤU HÌNH MIDDLEWARE ---

// Sử dụng cookie-parser để có thể đọc dữ liệu cookie qua req.cookies
app.use(cookieParser());

// Cấu hình express-session
app.use(session({
    secret: 'my-secret-key', // Chuỗi bí mật để mã hóa Session ID
    resave: false,           // Không lưu lại session nếu không có sự thay đổi
    saveUninitialized: true, // Lưu session mới ngay cả khi chưa có dữ liệu
    cookie: { 
        secure: false,       // Nếu là true, chỉ gửi cookie qua HTTPS
        httpOnly: true,      // Ngăn chặn JavaScript truy cập cookie (chống XSS)
        maxAge: 3600000      // Thời gian sống của session cookie (1 giờ - tính bằng ms)
    }
}));

// --- TRIỂN KHAI CÁC ROUTES ---

// 1. Route Demo về Cookie: Thiết lập một Cookie mới
app.get('/set-cookie', (req, res) => {
    // res.cookie(tên_cookie, giá_tri, options)
    res.cookie('user_lang', 'vi', { 
        maxAge: 900000,      // Cookie tồn tại trong 15 phút
        httpOnly: true 
    });
    res.send('Đã thiết lập Cookie: user_lang = vi');
});

// 2. Route Demo về Cookie: Đọc giá trị Cookie đã lưu
app.get('/get-cookie', (req, res) => {
    // Truy cập cookie thông qua đối tượng req.cookies
    const lang = req.cookies.user_lang;
    res.send(`Ngôn ngữ người dùng đang dùng là: ${lang || 'Chưa thiết lập'}`);
});

// 3. Route Demo về Session: Lưu thông tin vào Session
app.get('/login', (req, res) => {
    // Giả lập thông tin đăng nhập thành công
    // Dữ liệu được lưu trực tiếp vào đối tượng req.session trên Server
    req.session.username = 'admin';
    req.session.role = 'administrator';
    
    res.send('Đã đăng nhập và lưu thông tin vào Session.');
});

// 4. Route Demo về Session: Truy xuất dữ liệu từ Session
app.get('/profile', (req, res) => {
    // Kiểm tra xem session có tồn tại thông tin người dùng hay không
    if (req.session.username) {
        res.send(`Chào mừng ${req.session.username}, vai trò của bạn là: ${req.session.role}`);
    } else {
        res.status(401).send('Bạn chưa đăng nhập. Vui lòng truy cập /login');
    }
});

// 5. Route Demo về Session: Hủy Session (Đăng xuất)
app.get('/logout', (req, res) => {
    // Xóa toàn bộ dữ liệu session trên server
    req.session.destroy((err) => {
        if (err) {
            return res.send('Không thể đăng xuất');
        }
        res.clearCookie('connect.sid'); // Xóa cookie chứa Session ID ở trình duyệt
        res.send('Đã đăng xuất và hủy Session thành công.');
    });
});

// Khởi chạy server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
```

---

### 3. Phân tích chi tiết mã nguồn

#### Đối với Cookie (`cookie-parser`):
*   **Ghi dữ liệu:** Sử dụng `res.cookie()`. Trình duyệt sẽ nhận được tiêu đề `Set-Cookie` trong HTTP Response và tự động lưu lại tệp tin này.
*   **Đọc dữ liệu:** Middleware `cookie-parser` sẽ phân tích tiêu đề `Cookie` từ HTTP Request của trình duyệt và chuyển đổi nó thành một đối tượng JavaScript nằm trong `req.cookies`.

#### Đối với Session (`express-session`):
*   **Cơ chế định danh:** Khi `express-session` được kích hoạt, nó tự động tạo ra một **Session ID** duy nhất cho mỗi khách truy cập. Mã định danh này được lưu ở trình duyệt dưới dạng một cookie mặc định có tên là `connect.sid`.
*   **Lưu trữ dữ liệu:** Dữ liệu gán vào `req.session` (ví dụ: `req.session.username`) không được gửi về trình duyệt. Nó được giữ lại ở bộ nhớ RAM của Server (mặc định là `MemoryStore`).
*   **Tính bảo mật:** Do trình duyệt chỉ giữ mã ID (`connect.sid`), người dùng không thể biết hoặc chỉnh sửa các thông tin nhạy cảm như `role` hay `userId` được lưu bên trong session trên server.

---

### 4. Mở rộng: Lưu trữ Session trong thực tế

Trong môi trường thực tế (Production), không nên lưu session trong bộ nhớ RAM (mặc định) vì dữ liệu sẽ mất khi server khởi động lại và gây tốn RAM. Giải pháp phổ biến là lưu Session vào **MongoDB** thông qua thư viện `connect-mongo`.

**Ví dụ cấu hình lưu Session vào MongoDB:**

```javascript
const MongoStore = require('connect-mongo');

app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/pet_management', // Kết nối DB hiện có
        collectionName: 'sessions' // Tự động tạo bảng lưu trữ session
    }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session tồn tại 1 ngày
}));
```

Việc kết hợp này giúp hệ thống quản lý phiên làm việc ổn định, an toàn và có khả năng khôi phục ngay cả khi server bị ngắt kết nối.