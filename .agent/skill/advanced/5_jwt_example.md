# JWT trong NodeJS Express

### 1. Cài đặt thư viện
Cần cài đặt hai thư viện chính là `express` và `jsonwebtoken`:

```bash
npm install express jsonwebtoken
```

---

### 2. Mã nguồn triển khai (`app.js`)

Mã nguồn này bao gồm hai phần chính: một route để tạo Token từ dữ liệu giả lập và một Middleware để kiểm tra tính hợp lệ của Token đó.

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Chuỗi bí mật dùng để ký và xác thực Token (Trong thực tế nên để ở file .env)
const SECRET_KEY = 'my_super_secret_key_123';

// 1. ROUTE TẠO TOKEN (GENERATE)
// Giả lập việc tạo Token sau khi người dùng đăng nhập thành công
app.get('/generate-token', (req, res) => {
    // Dữ liệu hardcode giả lập thông tin người dùng
    const payload = {
        userId: 'u12345',
        username: 'admin_test',
        role: 'editor'
    };

    // Tạo JWT
    // tham số 1: Dữ liệu muốn lưu trong token (Payload)
    // tham số 2: Chuỗi bí mật (Secret Key)
    // tham số 3: Tùy chọn (ví dụ: thời gian hết hạn)
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

    res.json({
        success: true,
        message: 'Token đã được tạo thành công',
        token: token
    });
});

// 2. MIDDLEWARE KIỂM TRA TOKEN (VERIFY)
// Hàm này đóng vai trò là "người gác cổng" cho các API bảo mật
const verifyToken = (req, res, next) => {
    // Lấy token từ header "Authorization"
    // Định dạng thường là: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy Token. Truy cập bị từ chối.' });
    }

    // Xác thực token
    jwt.verify(token, SECRET_KEY, (err, decodedData) => {
        if (err) {
            return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }

        // Nếu hợp lệ, lưu thông tin đã giải mã vào req để các route sau sử dụng
        req.user = decodedData;
        next(); // Cho phép đi tiếp đến route tiếp theo
    });
};

// 3. ROUTE BẢO MẬT (PROTECTED ROUTE)
// Sử dụng middleware verifyToken để bảo vệ dữ liệu
app.get('/profile', verifyToken, (req, res) => {
    // Dữ liệu lấy được từ Token sau khi verify thành công
    const userInfo = req.user;

    res.json({
        message: 'Bạn đã truy cập vào trang bảo mật thành công',
        dataFromToken: userInfo
    });
});

// Khởi chạy Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server chạy tại: http://localhost:${PORT}`);
    console.log(`B1: Truy cập http://localhost:${PORT}/generate-token để lấy mã`);
    console.log(`B2: Sử dụng mã đó gửi kèm Header 'Authorization: Bearer <mã>' tới http://localhost:${PORT}/profile`);
});
```

---

### 3. Giải thích quy trình vận hành

1.  **Giai đoạn tạo Token (`/generate-token`):**
    *   Hàm `jwt.sign()` lấy thông tin người dùng (`payload`) kết hợp với `SECRET_KEY` để tạo ra một chuỗi JWT dài.
    *   Chuỗi này bao gồm 3 phần (Header, Payload, Signature) đã được phân tích ở tài liệu trước.

2.  **Giai đoạn gửi Token (Client-side):**
    *   Sau khi nhận được Token, phía Client (như Postman hoặc trình duyệt) phải đính kèm Token này vào tiêu đề của mỗi Request tiếp theo.
    *   Tên Header: `Authorization`
    *   Giá trị: `Bearer <chuỗi_token_vừa_nhận>`

3.  **Giai đoạn xác thực (`verifyToken` middleware):**
    *   Server sử dụng `jwt.verify()` để thực hiện lại phép tính chữ ký (Signature).
    *   Nếu chữ ký khớp và token còn hạn, hàm sẽ giải mã phần **Payload** (vốn là dữ liệu `userId`, `username` ban đầu) và gán nó vào đối tượng `req.user`.
    *   Nhờ đó, tại route `/profile`, ta có thể biết chính xác ai đang thực hiện yêu cầu mà không cần truy vấn lại cơ sở dữ liệu.

### 4. Lưu ý quan trọng
*   **Tính bảo mật của Payload:** Thông tin trong `req.user` sau khi giải mã có thể bị đọc bởi bất kỳ ai có Token (qua trang jwt.io). Do đó, tuyệt đối không được để mật khẩu hoặc dữ liệu cực kỳ nhạy cảm vào Payload.
*   **Secret Key:** Nếu mất chuỗi `SECRET_KEY`, bất kỳ ai cũng có thể giả mạo Token của hệ thống. Trong môi trường thực tế, hãy lưu nó trong tệp `.env` và không đẩy lên Git.