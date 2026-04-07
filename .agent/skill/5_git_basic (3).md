# HƯỚNG DẪN CƠ BẢN VỀ GIT VÀ GITHUB CHO NGƯỜI MỚI BẮT ĐẦU

Tài liệu này cung cấp kiến thức nền tảng về hệ thống quản lý phiên bản (Git), cách cài đặt công cụ Git Bash và các lệnh thao tác cơ bản để làm việc với GitHub.

---

### 1. Khái niệm cơ bản

*   **Git:** Là một hệ thống quản lý phiên bản phân tán (Version Control System). Nó giúp ghi lại lịch sử thay đổi của các tệp tin trong dự án, cho phép quay lại bất kỳ phiên bản nào trước đó.
*   **GitHub:** Là một nền tảng lưu trữ trực tuyến (Cloud) dành cho các dự án sử dụng Git. Đây là nơi để lưu trữ mã nguồn, chia sẻ và làm việc nhóm.
*   **Git Bash:** Một phần mềm dành cho Windows cung cấp môi trường dòng lệnh (Command Line) tương tự như trên Linux/Unix để sử dụng các lệnh Git.

---

### 2. Cài đặt Git Bash

1.  Truy cập trang web chính thức: [git-scm.com](https://git-scm.com/).
2.  Tải bản cài đặt dành cho Windows.
3.  Chạy tệp cài đặt. Trong quá trình cài đặt, có thể giữ các tùy chọn mặc định (Default).
4.  Sau khi cài đặt xong, nhấn chuột phải tại bất kỳ thư mục nào trên máy tính và chọn **"Git Bash Here"** để mở cửa sổ dòng lệnh.

---

### 3. Cấu hình tài khoản ban đầu

Trước khi bắt đầu sử dụng, cần khai báo danh tính để Git ghi nhận ai là người thực hiện các thay đổi.

```bash
# Thiết lập tên người dùng
git config --global user.name "Họ và Tên của bạn"

# Thiết lập email (nên dùng email đăng ký tài khoản GitHub)
git config --global user.email "email@example.com"

# Kiểm tra lại thông tin đã thiết lập
git config --list
```

---

### 4. Quy trình làm việc cơ bản (Workflow)

Một quy trình làm việc với Git thường trải qua 3 khu vực:
1.  **Working Directory:** Thư mục làm việc thực tế trên máy tính.
2.  **Staging Area:** Khu vực chờ, nơi chuẩn bị các thay đổi để lưu trữ.
3.  **Repository (Local/Remote):** Nơi lưu trữ chính thức các phiên bản.

---

### 5. Các lệnh Git cơ bản nhất

#### 5.1. Khởi tạo và Lấy mã nguồn
```bash
# Khởi tạo một Git Repository mới trong thư mục hiện hành
git init

# Tải một dự án có sẵn từ GitHub về máy tính
git clone <url_cua_repository>
```

#### 5.2. Thao tác với thay đổi
```bash
# Kiểm tra trạng thái của các tệp tin (xem tệp nào đã sửa, tệp nào chưa lưu)
git status

# Đưa tệp tin vào khu vực chờ (Staging Area)
git add ten_tep_tin.html    # Thêm một tệp cụ thể
git add .                   # Thêm toàn bộ các tệp có thay đổi

# Lưu lại các thay đổi vào kho chứa kèm theo thông điệp mô tả
git commit -m "Mô tả nội dung đã thay đổi"
```

#### 5.3. Xem lịch sử
```bash
# Xem danh sách các lần lưu trữ (commit) trước đó
git log --oneline
```

#### 5.4. Làm việc với GitHub (Remote)
Để đưa mã nguồn từ máy tính lên GitHub, cần thực hiện liên kết và đẩy dữ liệu.

```bash
# Kết nối kho chứa cục bộ với kho chứa trên GitHub
git remote add origin <url_cua_repository_tren_github>

# Đổi tên nhánh chính thành 'main' (chuẩn mới của GitHub)
git branch -M main

# Đẩy dữ liệu từ máy tính lên GitHub lần đầu tiên
git push -u origin main

# Những lần sau chỉ cần dùng:
git push
```

#### 5.5. Cập nhật mã nguồn
```bash
# Tải những thay đổi mới nhất từ GitHub về máy tính
git pull
```

---

### 6. Ví dụ thực hành cụ thể

Giả sử thực hiện đẩy một bài tập HTML/CSS lên GitHub:

1.  Tạo một Repository mới trên trang web GitHub (ví dụ tên là `bai-tap-dau-tien`).
2.  Mở thư mục bài tập trên máy tính bằng **Git Bash**.
3.  Thực hiện chuỗi lệnh sau:

```bash
# Bước 1: Khởi tạo Git
git init

# Bước 2: Thêm tất cả tệp vào danh sách chờ
git add .

# Bước 3: Lưu lại phiên bản đầu tiên
git commit -m "Hoàn thành bài tập HTML cơ bản"

# Bước 4: Liên kết với link GitHub vừa tạo (thay link dưới bằng link thật)
git remote add origin https://github.com/username/bai-tap-dau-tien.git

# Bước 5: Đẩy mã nguồn lên
git branch -M main
git push -u origin main
```

---

### 7. Một số lưu ý quan trọng

1.  **Thông điệp Commit:** Luôn viết thông điệp ngắn gọn nhưng rõ ràng về những gì đã làm (ví dụ: "Thêm thanh điều hướng", "Sửa lỗi màu chữ").
2.  **Thường xuyên dùng `git status`:** Đây là cách tốt nhất để biết mình đang ở đâu và cần làm gì tiếp theo.
3.  **Tệp `.gitignore`:** Có thể tạo một tệp tên là `.gitignore` để liệt kê các tệp hoặc thư mục mà Git không cần theo dõi (ví dụ: các tệp rác, tệp mật khẩu).
