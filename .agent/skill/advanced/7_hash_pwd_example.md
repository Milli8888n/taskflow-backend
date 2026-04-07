# SỬ DỤNG BCRYPT TRONG NODE.JS VÀ EXPRESS

## 1. Cài đặt thư viện
Sử dụng lệnh sau để cài đặt thư viện:
```bash
npm install bcrypt
```

## 2. Đặc điểm cấu trúc của chuỗi Bcrypt Hash
Một chuỗi mật khẩu đã mã hóa bởi bcrypt thường có định dạng: 
`$2b$10$n94HygC47p7fF5FiLw.Oce3378L.v28u3pCj.E5o0z.XN1`
*   **$2b$**: Thuật toán sử dụng.
*   **$10$**: Giá trị `saltRounds` (độ khó của thuật toán).
*   **Phần còn lại**: Bao gồm cả Salt và bản băm kết quả được trộn lẫn. 
=> **Hệ quả:** Không cần tạo cột `salt` riêng biệt trong Database, chỉ cần một cột `password`.

---

## 3. Triển khai trong ứng dụng Express

Dưới đây là ví dụ về cách sử dụng `bcrypt` để băm mật khẩu khi đăng ký và so sánh mật khẩu khi đăng nhập.

```javascript
const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Giả lập cơ sở dữ liệu người dùng
const users = [];

// Số vòng lặp (Cost Factor) để tạo Salt. 
// Giá trị 10 là mức cân bằng giữa bảo mật và hiệu năng.
const saltRounds = 10;

// 1. CHỨC NĂNG ĐĂNG KÝ (Mã hóa mật khẩu)
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Băm mật khẩu (Hàm này tự động sinh Salt và trộn vào Hash)
        // Cú pháp: bcrypt.hash(mật_khẩu_thuần, saltRounds)
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Lưu người dùng vào DB giả lập
        const newUser = { 
            username, 
            password: hashedPassword // Chỉ lưu bản đã mã hóa
        };
        users.push(newUser);

        res.status(201).json({ message: 'Đăng ký thành công', user: newUser });
    } catch (error) {
        res.status(500).send('Lỗi máy chủ');
    }
});

// 2. CHỨC NĂNG ĐĂNG NHẬP (So sánh mật khẩu)
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Tìm người dùng trong DB
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).send('Người dùng không tồn tại');
        }

        // So sánh mật khẩu nhập vào với mật khẩu đã băm trong DB
        // Cú pháp: bcrypt.compare(mật_khẩu_nhập, mật_khẩu_hash_trong_db)
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.send('Đăng nhập thành công!');
        } else {
            res.status(401).send('Mật khẩu không chính xác');
        }
    } catch (error) {
        res.status(500).send('Lỗi máy chủ');
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## 4. Triển khai chuyên nghiệp với Mongoose (Middleware)

Trong các dự án thực tế sử dụng MongoDB, việc mã hóa mật khẩu nên được thực hiện tự động thông qua **Mongoose Middleware (Pre-save hook)**. Cách tiếp cận này giúp tách biệt logic bảo mật khỏi Controller.

**Tệp `models/User.js`:**
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Middleware chạy trước khi bản ghi User được lưu vào Database
userSchema.pre('save', async function (next) {
    // Chỉ mã hóa lại mật khẩu nếu nó có sự thay đổi (tạo mới hoặc sửa đổi)
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method: Thêm hàm so sánh mật khẩu trực tiếp vào Model
userSchema.methods.comparePassword = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

**Cách sử dụng trong Controller:**
```javascript
const User = require('../models/User');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await user.comparePassword(password))) {
        // Đăng nhập thành công
        res.json({ message: "Success" });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
};
```

---

## 5. Các lưu ý quan trọng

1.  **Sử dụng Bất đồng bộ (Async/Await):** Luôn sử dụng phiên bản `async` của bcrypt (`hash`, `compare`) để tránh việc chặn (blocking) tiến trình chính của Node.js, vì việc mã hóa rất tốn tài nguyên CPU.
2.  **Salt Rounds:** Giá trị mặc định là 10. Tăng số này sẽ tăng độ bảo mật nhưng cũng làm chậm tốc độ xử lý của server. Không nên đặt quá cao (ví dụ > 12) trừ khi có phần cứng chuyên dụng.
3.  **Tuyệt đối không giải mã:** Bcrypt là thuật toán băm một chiều. Không có cách nào để "giải mã" ngược lại mật khẩu gốc. Cách duy nhất để kiểm tra là băm lại mật khẩu nhập vào và so sánh kết quả.