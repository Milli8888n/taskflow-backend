# Hướng dẫn Node.js Express với EJS View Engine

## 1. Thiết lập dự án

Khởi tạo dự án và cài đặt các thư viện cần thiết:

```bash
mkdir express-ejs-demo
cd express-ejs-demo
npm init -y
# bắt đầu từ đây nếu đã tạo project
npm install express ejs
```

Cấu trúc thư mục chuẩn:
```text
express-ejs-demo/
├── views/           # Thư mục chứa các file giao diện (.ejs)
│   └── index.ejs
├── app.js           # File chạy chính của ứng dụng
└── package.json
```

## 2. Cấu hình Express để sử dụng EJS

Trong file `app.js`, cần khai báo View Engine là EJS:

```javascript
const express = require('express');
const app = express();
const PORT = 3000;

// Cấu hình View Engine
app.set('view engine', 'ejs');
app.set('views', './views');

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
```

---

## 3. Truyền tham số từ Controller ra View

Dữ liệu được truyền từ Route (Controller) vào View thông qua tham số thứ hai của hàm `res.render()`.

### Ví dụ trong `app.js`:
```javascript
app.get('/', (req, res) => {
    const data = {
        title: "Trang chủ hệ thống",
        user: {
            id: 1,
            name: "Nguyễn Văn A",
            role: "admin"
        },
        items: ["Laptop", "Điện thoại", "Máy tính bảng", "Tai nghe"],
        isLoggedIn: true
    };

    // Truyền object data ra file index.ejs
    res.render('index', data);
});
```

---

## 4. Xử lý logic trong EJS View

EJS sử dụng các cặp thẻ đặc biệt để thực thi mã JavaScript:
- `<%= value %>`: Hiển thị giá trị (đã được escape để chống XSS).
- `<%- value %>`: Hiển thị giá trị nguyên bản (dùng khi muốn render HTML).
- `<% code %>`: Thực thi mã logic (vòng lặp, điều kiện) mà không hiển thị kết quả ra màn hình.

### Ví dụ file `views/index.ejs`:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title><%= title %></title>
</head>
<body>
    <h1><%= title %></h1>

    <!-- 1. Sử dụng câu lệnh điều kiện (Condition) -->
    <% if (isLoggedIn) { %>
        <p>Chào mừng thành viên: <strong><%= user.name %></strong></p>
        
        <% if (user.role === 'admin') { %>
            <button>Quản lý hệ thống</button>
        <% } %>

    <% } else { %>
        <p>Vui lòng đăng nhập để tiếp tục.</p>
    <% } %>

    <hr>

    <!-- 2. Sử dụng vòng lặp (Loop) -->
    <h3>Danh mục sản phẩm:</h3>
    <ul>
        <% if (items.length > 0) { %>
            <% items.forEach(function(item, index) { %>
                <li>
                    Sản phẩm <%= index + 1 %>: <%= item %>
                </li>
            <% }); %>
        <% } else { %>
            <li>Không có sản phẩm nào.</li>
        <% } %>
    </ul>

    <!-- 3. Ví dụ về toán tử ba ngôi (Ternary operator) -->
    <p>Trạng thái tài khoản: <%= user.role === 'admin' ? "Quản trị viên" : "Người dùng" %></p>
</body>
</html>
```

---

## 5. Các cú pháp bổ sung cần lưu ý

### Nhúng file (Include)
Để chia nhỏ giao diện (Header, Footer), sử dụng cú pháp `include`:
```html
<%- include('partials/header') %>
<h1>Nội dung trang</h1>
<%- include('partials/footer') %>
```

### Xử lý dữ liệu thô (Raw HTML)
Nếu biến truyền ra có chứa thẻ HTML và muốn trình duyệt thực thi thẻ đó:
```javascript
// Controller
res.render('index', { content: "<b>Văn bản in đậm</b>" });

// View
<%- content %> <!-- Sẽ hiển thị chữ in đậm thay vì hiện cả thẻ <b> -->
```

## 6. Tổng kết quy trình
1. **Controller:** Chuẩn bị dữ liệu dưới dạng Object.
2. **res.render:** Gọi file EJS và gửi Object dữ liệu đi.
3. **View (EJS):** 
   - Dùng `<% ... %>` để bọc các từ khóa JavaScript (`if`, `for`, `forEach`, `switch`).
   - Đảm bảo đóng đầy đủ các dấu ngoặc nhọn `{ }` bên trong các thẻ EJS.
   - Truy xuất trực tiếp các thuộc tính của Object đã truyền vào.