# MÃ HÓA MẬT KHẨU VÀ CƠ CHẾ SALT TRONG LẬP TRÌNH WEB

Trong bảo mật hệ thống, việc lưu trữ mật khẩu dưới dạng văn bản thuần túy (Plaintext) là một sai lầm nghiêm trọng. Tài liệu này phân tích tầm quan trọng của việc mã hóa mật khẩu, vai trò của muối (Salt) và cách triển khai thủ công bằng Node.js.

---

## 1. Sự cần thiết của việc mã hóa mật khẩu

Khi người dùng đăng ký tài khoản, mật khẩu không bao giờ được phép lưu trực tiếp vào cơ sở dữ liệu.

*   **Phòng chống rò rỉ dữ liệu:** Nếu cơ sở dữ liệu bị tấn công hoặc bị nhân viên nội bộ trích xuất trái phép, mật khẩu dạng Plaintext sẽ giúp kẻ tấn công chiếm đoạt toàn bộ tài khoản người dùng ngay lập tức.
*   **Tính chất một chiều (One-way Hashing):** Mã hóa mật khẩu thực tế là quá trình "băm" (hashing). Một hàm băm tốt là hàm số mà từ đầu ra (Hash) không thể tính toán ngược lại để tìm thấy đầu vào (Password). Server chỉ lưu trữ bản băm và so sánh các bản băm với nhau khi người dùng đăng nhập.

---

## 2. Sự cần thiết của Salt (Muối) trong mã hóa

Nếu chỉ sử dụng các hàm băm thông thường (như MD5, SHA-256) một cách đơn giản, hệ thống vẫn đối mặt với hai nguy cơ:

1.  **Bảng băm tính toán trước (Rainbow Tables):** Kẻ tấn công xây dựng các bảng chứa hàng tỷ mật khẩu phổ biến và các bản băm tương ứng. Khi có được Database, chúng chỉ cần tra bảng để tìm ra mật khẩu gốc.
2.  **Mật khẩu giống nhau có bản băm giống nhau:** Nếu hai người dùng cùng đặt mật khẩu là `123456`, bản băm của họ trong Database sẽ y hệt nhau. Kẻ tấn công chỉ cần bẻ khóa được một người là sẽ biết mật khẩu của người còn lại.

**Khái niệm Salt:**
Salt là một chuỗi ký tự ngẫu nhiên được tạo ra cho mỗi người dùng và được cộng thêm vào mật khẩu trước khi thực hiện quá trình băm.
*   **Cơ chế:** `Hash(Mật khẩu + Salt) = Bản băm cuối cùng`.
*   **Kết quả:** Ngay cả khi hai người dùng có mật khẩu giống hệt nhau, vì mỗi người có một mã Salt ngẫu nhiên khác nhau nên bản băm lưu trong Database của họ sẽ hoàn toàn khác nhau. Điều này khiến việc sử dụng Rainbow Tables trở nên vô dụng.

---

## 3. Triển khai với Node.js (Sử dụng module `crypto`)

Dưới đây là ví dụ sử dụng module `crypto` có sẵn trong Node.js để thực hiện quy trình: Sinh muối -> Mã hóa -> So sánh.

### Mã nguồn chi tiết (`passwordHelper.js`)

```javascript
const crypto = require('crypto');

/**
 * Hàm thực hiện băm mật khẩu với Salt
 * @param {string} password - Mật khẩu thuần túy
 * @returns {object} - Đối tượng chứa Salt và bản băm
 */
const hashPassword = (password) => {
    // 1. Sinh một chuỗi Salt ngẫu nhiên (16 bytes)
    const salt = crypto.randomBytes(16).toString('hex');

    // 2. Sử dụng thuật toán PBKDF2 để băm mật khẩu cùng với Salt
    // PBKDF2 (Password-Based Key Derivation Function 2) là tiêu chuẩn an toàn
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    return {
        salt: salt,
        hash: hash
    };
};

/**
 * Hàm so sánh mật khẩu nhập vào với bản băm trong Database
 * @param {string} inputPassword - Mật khẩu người dùng nhập khi đăng nhập
 * @param {string} storedSalt - Salt đã lưu trong DB của người dùng đó
 * @param {string} storedHash - Hash đã lưu trong DB của người dùng đó
 * @returns {boolean} - Kết quả khớp hoặc không
 */
const verifyPassword = (inputPassword, storedSalt, storedHash) => {
    // Thực hiện băm mật khẩu nhập vào với Salt cũ đã lưu
    const inputHash = crypto.pbkdf2Sync(inputPassword, storedSalt, 1000, 64, 'sha512').toString('hex');
    
    // So sánh bản băm vừa tạo với bản băm trong DB
    return inputHash === storedHash;
};

// --- KIỂM TRA THỬ NGHIỆM ---

const rawPassword = "my_secure_password_123";

// Bước 1: Khi đăng ký - Tạo Hash và Salt để lưu vào Database
const encryptedData = hashPassword(rawPassword);
console.log("--- GIAI ĐOẠN ĐĂNG KÝ ---");
console.log("Salt sinh ra (Lưu vào DB):", encryptedData.salt);
console.log("Hash sinh ra (Lưu vào DB):", encryptedData.hash);

// Bước 2: Khi đăng nhập - So sánh mật khẩu
console.log("\n--- GIAI ĐOẠN ĐĂNG NHẬP ---");

const loginPassCorrect = "my_secure_password_123";
const isMatch = verifyPassword(loginPassCorrect, encryptedData.salt, encryptedData.hash);
console.log(`Thử đăng nhập với mật khẩu đúng: ${isMatch ? "THÀNH CÔNG" : "THẤT BẠI"}`);

const loginPassWrong = "wrong_password";
const isMatchWrong = verifyPassword(loginPassWrong, encryptedData.salt, encryptedData.hash);
console.log(`Thử đăng nhập với mật khẩu sai: ${isMatchWrong ? "THÀNH CÔNG" : "THẤT BẠI"}`);
```

---

## 4. Giải thích các tham số trong `pbkdf2Sync`

Trong ví dụ trên, hàm băm sử dụng các tham số sau để tăng cường độ khó cho việc bẻ khóa:
1.  **password:** Mật khẩu gốc.
2.  **salt:** Chuỗi ngẫu nhiên giúp chống lại bảng tính toán trước.
3.  **iterations (1000):** Số lần lặp lại quá trình băm. Số lần lặp càng cao thì thời gian tính toán càng lâu, khiến kẻ tấn công tốn rất nhiều thời gian nếu muốn thử tất cả các trường hợp (Brute-force).
4.  **keylen (64):** Độ dài của bản băm đầu ra.
5.  **digest ('sha512'):** Thuật toán băm nền tảng (SHA-512 cực kỳ an toàn).

## 5. Kết luận

Việc mã hóa mật khẩu kết hợp với Salt là tiêu chuẩn bắt buộc trong mọi ứng dụng web. 
*   **Lưu ý:** Khi lưu vào Database, cần tạo hai cột riêng biệt: một cột lưu `passwordHash` và một cột lưu `salt`. Khi người dùng đăng nhập, hệ thống sẽ tìm người dùng theo `username`, lấy `salt` tương ứng ra để thực hiện quá trình so sánh.