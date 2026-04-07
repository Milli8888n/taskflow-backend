# TÍCH HỢP EJS VIEW ENGINE VÀ XỬ LÝ GIAO DIỆN

Việc sử dụng EJS cho phép kết hợp mã JavaScript trực tiếp vào HTML, giúp xây dựng giao diện động từ dữ liệu trả về của Server.

## 1. Cập nhật cấu trúc thư mục

Bổ sung thư mục `views` để chứa các tệp giao diện và `public` để chứa các tệp tĩnh (CSS, JS client-side, hình ảnh).

```text
project-root/
├── public/                 # Tệp tĩnh (Static files)
│   ├── css/
│   ├── js/
│   └── images/
├── src/
│   ├── views/              # Thư mục chứa các tệp .ejs
│   │   ├── partials/       # Các thành phần dùng chung (Header, Footer)
│   │   ├── layouts/        # Bố cục chính của trang
│   │   └── users/          # Giao diện riêng cho module User
│   │       └── index.ejs
...
```

## 2. Cấu hình ứng dụng

### Bước 1: Cài đặt thư viện
Chạy lệnh sau để cài đặt EJS:
```bash
npm install ejs
```

### Bước 2: Cấu hình View Engine trong `src/app.js`
Cần khai báo cho Express biết việc sử dụng EJS và vị trí các tệp tĩnh.

```javascript
const path = require('path');
// ... các import khác

// Cấu hình View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cấu hình thư mục chứa tệp tĩnh (CSS, JS, Images)
app.use(express.static(path.join(__dirname, '../public')));

// Middleware xử lý dữ liệu từ Form (URL Encoded)
app.use(express.urlencoded({ extended: true }));

// ... các cấu hình route và error handler
```

## 3. Xây dựng giao diện mẫu

### Bước 1: Tạo tệp dùng chung (`src/views/partials/header.ejs`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản lý người dùng</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav>
        <a href="/api/v1/users">Danh sách người dùng</a>
    </nav>
```

### Bước 2: Tạo tệp giao diện chính (`src/views/users/index.ejs`)
Sử dụng cú pháp EJS để duyệt qua danh sách dữ liệu được gửi từ Controller.

```html
<%- include('../partials/header') %>

<main>
    <h1>Danh sách người dùng</h1>
    <ul>
        <% if (users.length > 0) { %>
            <% users.forEach(user => { %>
                <li><%= user.name %> - <%= user.email %></li>
            <% }) %>
        <% } else { %>
            <p>Không có người dùng nào.</p>
        <% } %>
    </ul>
</main>

<%- include('../partials/footer') %>
```

## 4. Cập nhật Controller để Render giao diện

Thay vì trả về JSON bằng `res.json()`, Controller sẽ sử dụng hàm `res.render()` để trả về tệp HTML đã được xử lý bởi EJS.

**Tệp `src/controllers/userController.js`:**
```javascript
const userService = require('../services/userService');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await userService.findAllUsers();
    
    // Render tệp views/users/index.ejs và truyền dữ liệu 'users'
    res.render('users/index', { 
      users: users,
      pageTitle: 'Trang chủ' 
    });
  } catch (error) {
    next(error);
  }
};
```

## 5. Xử lý tệp tĩnh (CSS)

Tạo tệp `public/css/style.css` để định dạng giao diện:
```css
body {
    font-family: Arial, sans-serif;
    margin: 20px;
    background-color: #f4f4f4;
}
nav {
    margin-bottom: 20px;
    padding: 10px;
    background: #333;
}
nav a {
    color: #fff;
    text-decoration: none;
}
```

---

## 6. Tổng kết quy trình hoạt động

1.  **Request:** Người dùng truy cập trình duyệt tại địa chỉ `/api/v1/users`.
2.  **Route:** Hệ thống điều hướng yêu cầu đến `userController.getUsers`.
3.  **Service:** Controller gọi Service để lấy dữ liệu từ MongoDB thông qua Mongoose.
4.  **Render:** Controller nhận dữ liệu và gọi `res.render('users/index', { users })`.
5.  **EJS Engine:** Express tìm tệp `src/views/users/index.ejs`, nhúng dữ liệu vào mã HTML, sau đó biên dịch thành HTML thuần.
6.  **Response:** Server gửi mã HTML hoàn chỉnh về trình duyệt của người dùng.

Cấu trúc này đảm bảo tách biệt giữa **Dữ liệu (Model)**, **Logic xử lý (Controller/Service)** và **Hiển thị (View)**, giúp việc thay đổi giao diện không ảnh hưởng đến logic hệ thống.