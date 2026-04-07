# JSON WEB TOKEN (JWT)

Trong kiến trúc Web hiện đại, đặc biệt là với các ứng dụng Single Page Application (SPA) hoặc hệ thống Microservices, **JSON Web Token (JWT)** là một tiêu chuẩn mở (RFC 7519) dùng để truyền tải thông tin an toàn giữa các bên dưới dạng một đối tượng JSON.

---

## 1. Khái niệm JWT

**JWT** là một chuỗi ký tự mã hóa giúp xác thực người dùng mà không cần lưu trữ trạng thái phiên làm việc (session) trên Server. Khác với Session (lưu dữ liệu ở Server), JWT chứa tất cả thông tin cần thiết về người dùng bên trong chính nó, giúp Server có thể xác thực ngay lập tức mà không cần truy vấn vào Database hoặc bộ nhớ RAM.

---

## 2. Cấu trúc của một JSON Web Token

Một JWT bao gồm 3 phần, ngăn cách nhau bởi dấu chấm (`.`): `Header.Payload.Signature`

### 2.1. Header (Phần đầu)
Chứa thông tin về loại token (thường là JWT) và thuật toán mã hóa được sử dụng (ví dụ: HMAC SHA256 hoặc RSA).
*   *Ví dụ:* `{"alg": "HS256", "typ": "JWT"}`

### 2.2. Payload (Phần nội dung)
Chứa các "claims" (lời tuyên bố) - đây là các thông tin về đối tượng (người dùng) và các dữ liệu bổ sung. Có 3 loại claims:
*   **Reserved claims:** Các trường đã được định nghĩa sẵn (ví dụ: `iss` - người phát hành, `exp` - thời gian hết hạn, `sub` - chủ đề).
*   **Public claims:** Các thông tin công khai.
*   **Private claims:** Các thông tin tự định nghĩa giữa các bên (ví dụ: `userId`, `role`).
*   *Lưu ý:* Phần này chỉ được mã hóa Base64, không phải mã hóa bảo mật, vì vậy **không bao giờ lưu mật khẩu hoặc dữ liệu nhạy cảm ở đây.**

### 2.3. Signature (Chữ ký)
Đây là phần quan trọng nhất để đảm bảo tính toàn vẹn của dữ liệu. Chữ ký được tạo ra bằng cách lấy phần Header đã mã hóa, Payload đã mã hóa, kết hợp với một chuỗi bí mật (Secret Key) ở phía Server và chạy qua thuật toán đã khai báo ở Header.
*   *Mục đích:* Nếu bất kỳ ai thay đổi dù chỉ 1 ký tự trong Payload, chữ ký sẽ không còn khớp, và Server sẽ bác bỏ token đó.

---

## 3. Cơ chế hoạt động của JWT

Quy trình xác thực bằng JWT diễn ra theo các bước sau:

1.  **Đăng nhập:** Người dùng gửi thông tin đăng nhập (Username/Password) lên Server.
2.  **Khởi tạo:** Server xác thực thông tin. Nếu đúng, Server tạo một JWT bằng Secret Key và gửi về cho Client.
3.  **Lưu trữ:** Client nhận JWT và lưu vào bộ nhớ cục bộ (LocalStorage) hoặc Cookie.
4.  **Gửi yêu cầu:** Với các yêu cầu tiếp theo, Client đính kèm JWT vào tiêu đề (Header) của HTTP Request theo định dạng:
    `Authorization: Bearer <token>`
5.  **Xác thực:** Server nhận token, kiểm tra chữ ký bằng Secret Key. Nếu hợp lệ, Server sẽ xử lý yêu cầu mà không cần truy vấn Database để kiểm tra phiên làm việc.

---

## 4. Phân biệt JWT và Session/Cookie

| Đặc điểm | Session / Cookie | JSON Web Token (JWT) |
| :--- | :--- | :--- |
| **Trạng thái (State)** | Stateful (Lưu trên Server) | Stateless (Lưu trên Client) |
| **Khả năng mở rộng** | Khó (Cần đồng bộ Session giữa nhiều Server) | Dễ (Mọi Server có Secret Key đều xác thực được) |
| **Bộ nhớ** | Tốn RAM/Database của Server | Không tốn tài nguyên Server |
| **Tính bảo mật** | Dễ bị tấn công CSRF | Thường lưu ở LocalStorage, dễ bị tấn công XSS |
| **Sử dụng** | Phù hợp Website truyền thống (SSR) | Phù hợp Mobile App, SPA, Microservices |

---

## 5. Ưu điểm và Nhược điểm

### Ưu điểm:
*   **Hiệu năng cao:** Giảm tải cho Database vì không phải truy vấn phiên làm việc.
*   **Hỗ trợ đa nền tảng:** Token là định dạng văn bản đơn giản nên có thể sử dụng dễ dàng trên iOS, Android và Web.
*   **Hệ thống phân tán:** Rất hiệu quả cho các hệ thống có nhiều Server chạy song song mà không cần cơ chế chia sẻ bộ nhớ Session.

### Nhược điểm:
*   **Kích thước:** JWT có thể lớn hơn nhiều so với Session ID đơn thuần, làm tăng băng thông mỗi request.
*   **Khó thu hồi:** Một khi JWT đã phát hành và còn hạn, Server rất khó để "vô hiệu hóa" nó ngay lập tức (trừ khi áp dụng thêm cơ chế Blacklist).
*   **Bảo mật dữ liệu:** Dữ liệu trong Payload có thể bị đọc dễ dàng bằng cách giải mã Base64.

---

## 6. Các trường hợp sử dụng thực tế

1.  **Xác thực (Authentication):** Đây là kịch bản phổ biến nhất. Sau khi đăng nhập, mỗi yêu cầu tiếp theo sẽ bao gồm JWT, cho phép người dùng truy cập vào các tuyến đường và dịch vụ được phép.
2.  **Trao đổi thông tin (Information Exchange):** JWT là một cách tốt để truyền thông tin giữa các bên vì có thể xác minh được danh tính người gửi và đảm bảo nội dung không bị giả mạo nhờ phần chữ ký.
3.  **Hệ thống Microservices:** Một dịch vụ Auth duy nhất tạo token, và các dịch vụ khác (Pet Service, Order Service...) chỉ cần dùng chung Secret Key để tự xác thực mà không cần gọi lại dịch vụ Auth.