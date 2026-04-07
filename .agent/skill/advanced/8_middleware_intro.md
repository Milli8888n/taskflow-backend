# HƯỚNG DẪN VỀ MIDDLEWARE TRONG EXPRESS.JS

Trong lập trình Web với Express.js, **Middleware** là một khái niệm cốt lõi. Có thể hiểu đơn giản Middleware là các hàm trung gian nằm giữa **Yêu cầu (Request)** từ người dùng và **Phản hồi (Response)** từ máy chủ.

---

## 1. Cơ chế hoạt động của Middleware

Khi một yêu cầu được gửi tới server, nó sẽ đi qua một chuỗi các hàm Middleware trước khi tới được logic xử lý cuối cùng (Route Handler). Mỗi hàm Middleware có quyền truy cập vào:
*   Đối tượng yêu cầu (`req`)
*   Đối tượng phản hồi (`res`)
*   Hàm tiếp theo trong chu kỳ (`next`)

**Vai trò của hàm `next()`:** Đây là chìa khóa của Middleware. Nếu một hàm Middleware không gọi `next()`, yêu cầu sẽ bị "treo" và không bao giờ đi tiếp được tới các hàm xử lý sau đó hoặc trả về kết quả cho người dùng.

---

## 2. Sự cần thiết của Middleware

1.  **Tách biệt logic (Separation of Concerns):** Giúp tách các mã nguồn không liên quan đến nghiệp vụ chính (như kiểm tra đăng nhập, ghi log) ra khỏi logic xử lý dữ liệu.
2.  **Tái sử dụng mã nguồn (Reusability):** Một Middleware kiểm tra quyền truy cập có thể được áp dụng cho hàng trăm đường dẫn (routes) khác nhau mà không cần viết lại code.
3.  **Tiền xử lý dữ liệu:** Kiểm tra, lọc hoặc định dạng lại dữ liệu từ người dùng trước khi đưa vào cơ sở dữ liệu.
4.  **Kiểm soát luồng:** Có thể quyết định cho phép yêu cầu đi tiếp hoặc chặn lại và trả về lỗi ngay lập tức (ví dụ: khi người dùng chưa đăng nhập).

---

## 3. Các trường hợp sử dụng phổ biến

*   **Logging:** Ghi lại thông tin mỗi khi có người truy cập (thời gian, địa chỉ IP, đường dẫn).
*   **Authentication & Authorization:** Kiểm tra người dùng đã đăng nhập chưa hoặc có quyền admin không.
*   **Body Parsing:** Chuyển đổi dữ liệu thô từ Form hoặc JSON thành đối tượng JavaScript (`req.body`).
*   **Error Handling:** Tập trung xử lý tất cả các lỗi phát sinh trong hệ thống tại một nơi duy nhất.

---

## 4. Ví dụ mã nguồn triển khai

Dưới đây là ví dụ về cách tạo và sử dụng Middleware trong ứng dụng Express.

### Mã nguồn `server.js`

```javascript
const express = require('express');
const app = express();

// --- 1. MIDDLEWARE TOÀN CỤC (APPLICATION-LEVEL) ---
// Middleware này sẽ chạy cho MỌI yêu cầu gửi đến server
const logger = (req, res, next) => {
    const time = new Date().toLocaleString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next(); // Chuyển sang middleware hoặc route tiếp theo
};

app.use(logger); // Kích hoạt middleware logger
app.use(express.json()); // Middleware có sẵn để xử lý dữ liệu JSON

// --- 2. MIDDLEWARE CỤ THỂ (ROUTE-LEVEL) ---
// Middleware kiểm tra quyền truy cập (giả lập)
const checkAdmin = (req, res, next) => {
    const isAdmin = req.query.admin === 'true'; // Kiểm tra tham số trên URL (?admin=true)
    
    if (isAdmin) {
        next(); // Nếu là admin, cho phép đi tiếp
    } else {
        res.status(403).send('Truy cập bị từ chối: Bạn không có quyền Admin.');
    }
};

// --- 3. CÁC ĐƯỜNG DẪN (ROUTES) ---

// Trang chủ: Không yêu cầu quyền admin
app.get('/', (req, res) => {
    res.send('Chào mừng bạn đến với trang chủ!');
});

// Trang quản trị: Áp dụng middleware checkAdmin
app.get('/dashboard', checkAdmin, (req, res) => {
    res.send('Chào mừng Admin đến với bảng điều khiển!');
});

// --- 4. MIDDLEWARE XỬ LÝ LỖI (ERROR-HANDLING) ---
// Đặc điểm: Có đủ 4 tham số (err, req, res, next)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Đã có lỗi hệ thống xảy ra!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
```

---

## 5. Phân loại Middleware trong Express

1.  **Application-level middleware:** Gắn vào đối tượng `app` bằng `app.use()` hoặc `app.METHOD()`. Nó có tác dụng trên toàn bộ ứng dụng.
2.  **Router-level middleware:** Gắn vào đối tượng `express.Router()`. Chỉ có tác dụng trong một nhóm các đường dẫn cụ thể.
3.  **Built-in middleware:** Các middleware có sẵn của Express như `express.json()`, `express.static()`, `express.urlencoded()`.
4.  **Third-party middleware:** Các thư viện bên ngoài như `cookie-parser`, `morgan`, `cors`, `multer`.
5.  **Error-handling middleware:** Middleware đặc biệt dùng để bắt lỗi, luôn có 4 tham số đầu vào.

### Kết luận
Middleware là "xương sống" của các ứng dụng Express.js. Việc hiểu và sử dụng thành thạo Middleware giúp mã nguồn sạch sẽ hơn, bảo mật hơn và dễ dàng mở rộng các tính năng bổ trợ mà không làm ảnh hưởng đến logic nghiệp vụ cốt lõi.