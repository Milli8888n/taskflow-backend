# Cơ chế bảo mật JWT Integrity

Cơ chế kiểm tra tính không thay đổi (Integrity) của JWT có thể được hiểu đơn giản thông qua nguyên lý **"Đối chiếu chữ ký"**. Để dễ hình dung, hãy coi JWT như một bức thư được niêm phong bằng một con dấu sáp đặc biệt mà chỉ Server mới có phôi đúc.

Dưới đây là quy trình kiểm tra chi tiết:

### 1. Thành phần cốt lõi: Chuỗi bí mật (Secret Key)
Mọi việc kiểm tra đều dựa trên một chuỗi ký tự bí mật (Secret Key) được lưu trữ duy nhất tại Server. Client hoàn toàn không biết chuỗi này.

### 2. Quy trình kiểm tra tại Server (3 bước)

Khi Server nhận được một JWT từ Client gửi lên, nó thực hiện các bước sau:

*   **Bước 1: Tách rời:** Server chia JWT thành 3 phần: **Header**, **Payload** và **Chữ ký (Signature)** cũ.
*   **Bước 2: Tính toán lại (Re-hash):** Server lấy phần Header và Payload (vốn là dữ liệu thô dạng Base64) kết hợp với **Secret Key** đang giữ, sau đó chạy qua thuật toán mã hóa (ví dụ: HMAC SHA256) để tạo ra một "Chữ ký mới".
*   **Bước 3: So sánh:** Server đối chiếu **Chữ ký mới** vừa tạo với **Chữ ký cũ** đính kèm trong Token.
    *   **Nếu khớp:** Dữ liệu chưa bị thay đổi. Token hợp lệ.
    *   **Nếu không khớp:** Dữ liệu đã bị can thiệp. Token giả mạo.

### 3. Tại sao kẻ gian không thể sửa đổi dữ liệu?

Giả sử một kẻ tấn công muốn sửa đổi thông tin trong Payload (ví dụ: sửa `role: "user"` thành `role: "admin"`):

1.  Kẻ tấn công sửa phần Payload.
2.  Khi Server nhận được Token này, Server sẽ lấy Payload (đã bị sửa) + Secret Key để tính toán chữ ký mới.
3.  Kết quả chữ ký mới này chắc chắn sẽ **khác hoàn toàn** với chữ ký cũ đính kèm trong Token.
4.  Server lập tức phát hiện sự sai lệch và từ chối yêu cầu.

**Kẻ tấn công có thể tự tạo lại chữ ký mới cho khớp không?**
Câu trả lời là **Không**, vì muốn tạo lại chữ ký đúng cho phần dữ liệu đã sửa, kẻ tấn công bắt buộc phải có **Secret Key**. Do Secret Key chỉ nằm ở Server, kẻ tấn công không có cách nào tạo ra một chữ ký hợp lệ.

### 4. Ví dụ minh họa bằng công thức đơn giản

Hãy tưởng tượng một phép toán tượng trưng:
*   **Dữ liệu (Header + Payload):** 10
*   **Secret Key (Chỉ Server biết):** 5
*   **Thuật toán:** Phép cộng
*   **Chữ ký gốc:** 10 + 5 = **15**

Khi Token gửi đi, nó mang theo số **10** và chữ ký **15**.

*   **Trường hợp 1 (Hợp lệ):** Server nhận số 10. Server lấy 10 + 5 (Secret) = 15. So với chữ ký 15 gốc -> **Khớp**.
*   **Trường hợp 2 (Bị sửa đổi):** Kẻ gian sửa số 10 thành **20**. Server nhận số 20. Server lấy 20 + 5 (Secret) = 25. So với chữ ký 15 gốc -> **Lệch**. Server bác bỏ.

### Tóm lại
Server không cần lưu trữ JWT. Nó chỉ cần thực hiện lại phép tính dựa trên dữ liệu người dùng gửi lên và chuỗi bí mật của mình. Nếu kết quả giống với chữ ký đi kèm, nghĩa là dữ liệu đó an toàn và chưa bị ai chỉnh sửa.