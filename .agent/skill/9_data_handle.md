# Hướng dẫn Xử lý Dữ liệu trong Express.js: Query, Params và Body

## 1. Cấu hình bắt buộc
Để Express có thể đọc được dữ liệu từ Form (phương thức POST), cần phải cấu hình Middleware để giải mã dữ liệu định dạng `application/x-www-form-urlencoded`.

Thêm dòng sau vào file `app.js`:
```javascript
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Hỗ trợ nếu dữ liệu gửi lên dạng JSON (API)
```

---

## 2. Query String (Chuỗi truy vấn)
Query string là dữ liệu nằm sau dấu `?` trên URL. Thường được sử dụng cho các chức năng lọc, tìm kiếm hoặc phân trang.

*   **URL ví dụ:** `http://localhost:3000/search?keyword=iphone&sort=desc`
*   **Truy xuất:** Sử dụng `req.query`.

### Ví dụ Controller:
```javascript
app.get('/search', (req, res) => {
    // Truy xuất giá trị từ query string
    const queryData = req.query;
    const keyword = req.query.keyword;
    const sort = req.query.sort;

    console.log(`Tìm kiếm: ${keyword}, Sắp xếp: ${sort}`);
    res.send(`Kết quả tìm kiếm cho: ${keyword}`);
});
```

---

## 3. Path Parameters (Tham số đường dẫn)
Path parameters là các biến được định nghĩa trực tiếp trong cấu trúc URL của Route, bắt đầu bằng dấu `:`. Thường dùng để định danh một tài nguyên cụ thể (ID).

*   **URL ví dụ:** `http://localhost:3000/users/123/posts/456`
*   **Định nghĩa route:** `/users/:userId/posts/:postId`
*   **Truy xuất:** Sử dụng `req.params`.

### Ví dụ Controller:
```javascript
app.get('/users/:userId/posts/:postId', (req, res) => {
    // Truy xuất các biến từ URL
    const params = req.params;
    const userId = req.params.userId;
    const postId = req.params.postId;

    res.json({
        message: "Truy xuất tham số đường dẫn thành công",
        userId: userId,
        postId: postId
    });
});
```

---

## 4. Form Data (Dữ liệu từ Form POST)
Dữ liệu được gửi ngầm trong thân của HTTP Request (Body). Đây là cách phổ biến để gửi thông tin nhạy cảm hoặc dữ liệu lớn như khi đăng ký tài khoản hoặc tạo bài viết.

*   **Phương thức:** `POST`.
*   **Truy xuất:** Sử dụng `req.body`.

### Ví dụ HTML Form (`views/register.ejs`):
```html
<form action="/register" method="POST">
    <input type="text" name="username" placeholder="Tên đăng nhập">
    <input type="password" name="password" placeholder="Mật khẩu">
    <button type="submit">Đăng ký</button>
</form>
```

### Ví dụ Controller:
```javascript
app.post('/register', (req, res) => {
    // Truy xuất dữ liệu từ body (thuộc tính 'name' trong thẻ input)
    const username = req.body.username;
    const password = req.body.password;

    console.log(`Đăng ký mới: ${username}`);
    
    // Sau khi xử lý xong thường chuyển hướng hoặc thông báo
    res.redirect('/');
});
```

---

## 5. Bảng tổng hợp so sánh

| Loại dữ liệu | Vị trí trên Request | Cách lấy trong Express | Trường hợp sử dụng |
| :--- | :--- | :--- | :--- |
| **Query String** | Sau dấu `?` trên URL | `req.query` | Tìm kiếm, lọc, phân trang. |
| **Path Params** | Nằm trong đường dẫn | `req.params` | Xác định ID tài nguyên cụ thể. |
| **Form Body** | Thân của Request (POST) | `req.body` | Gửi dữ liệu từ Form, tạo mới/cập nhật. |

---

## 6. Ví dụ tổng hợp
Một Controller kết hợp cả ba loại dữ liệu: Cập nhật thông tin sản phẩm dựa trên ID từ URL, sử dụng mã xác thực từ Query và dữ liệu mới từ Form.

```javascript
// URL: /product/update/99?token=abc-123
app.post('/product/update/:id', (req, res) => {
    const productId = req.params.id;         // Lấy 99
    const accessToken = req.query.token;     // Lấy abc-123
    const newName = req.body.productName;   // Lấy từ input form

    if (accessToken === 'abc-123') {
        // Thực hiện cập nhật vào database...
        res.send(`Sản phẩm ${productId} đã đổi tên thành ${newName}`);
    } else {
        res.status(403).send("Không có quyền truy cập");
    }
});
```