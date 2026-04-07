# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 1 (PHẦN 3: FRONTEND EJS + CSS + CLIENT JS)

Tiếp nối Phần 1 (Config, Model, Middleware) và Phần 2 (Service, Controller, Route, App, Server), phần này giải thích **toàn bộ code Frontend** trong Sprint 1: Layout EJS, CSS, Form đăng nhập/đăng ký, Client JS gọi API, và View Routes.

---

# FILE 16: `src/views/partials/_header.ejs` (Phần đầu chung mọi trang)

```html
<!DOCTYPE html>
```
- Khai báo loại tài liệu HTML5. Bắt buộc nằm dòng 1 để trình duyệt biết cách parse.

```html
<html lang="vi">
```
- `<html>`: Thẻ gốc bao bọc toàn bộ trang.
- `lang="vi"`: Bảo trình duyệt và công cụ SEO "trang này dùng tiếng Việt".

```html
<head>
```
- `<head>`: Chứa metadata (thông tin mô tả trang), KHÔNG hiển thị trên màn hình.

```html
  <meta charset="UTF-8">
```
- `charset="UTF-8"`: Bộ mã ký tự Unicode. Hỗ trợ tiếng Việt, emoji, ký tự đặc biệt.
- Nếu thiếu dòng này, tiếng Việt có thể hiện lỗi font: "Xin chÃ o" thay vì "Xin chào".

```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
```
- `viewport`: Bảo trình duyệt điện thoại hiển thị trang theo chiều rộng màn hình thiết bị.
- `width=device-width`: Chiều rộng = chiều rộng màn hình (không thu nhỏ).
- `initial-scale=1.0`: Mức zoom ban đầu = 100%.
- Nếu thiếu → Trang web trên điện thoại sẽ thu nhỏ toàn bộ nội dung, chữ bé tí.

```html
  <title><%= typeof title !== 'undefined' ? title : 'TaskFlow' %></title>
```
- `<title>`: Tiêu đề hiện trên tab trình duyệt.
- `<%= ... %>`: Cú pháp EJS - "in giá trị biến ra HTML".
  - `<%=` mở tag. `%>` đóng tag. Kết quả được escape HTML (an toàn chống XSS).
- `typeof title !== 'undefined'`: Kiểm tra biến `title` có được truyền từ controller không.
  - `typeof`: Toán tử JS trả về kiểu dữ liệu dạng string. `typeof undefined` = `"undefined"`.
  - Tại sao không viết `title !== undefined`? Vì nếu `title` chưa được khai báo, `title !== undefined` sẽ throw `ReferenceError`. `typeof` an toàn hơn, không throw lỗi.
- `? title : 'TaskFlow'`: Nếu có `title` → dùng nó. Nếu không → mặc định "TaskFlow".

```html
  <link rel="stylesheet" href="/css/style.css">
```
- `<link>`: Liên kết file CSS bên ngoài vào trang.
- `rel="stylesheet"`: Quan hệ của file liên kết = stylesheet (bảng kiểu).
- `href="/css/style.css"`: Đường dẫn. Bắt đầu bằng `/` = tính từ gốc server.
  - Express static middleware sẽ tìm file `public/css/style.css` và gửi về.

```html
</head>
<body>
```
- Đóng `<head>`, mở `<body>`. Nội dung hiển thị trên màn hình nằm trong `<body>`.

```html
  <nav class="navbar">
    <div class="navbar-brand">
      <a href="/">TaskFlow</a>
    </div>
    <div class="navbar-menu" id="navbar-menu">
    </div>
  </nav>
```
- `<nav>`: Thẻ semantic HTML5 chứa thanh điều hướng (navigation bar).
- `class="navbar"`: Gán class CSS để style.
- `<a href="/">TaskFlow</a>`: Link về trang chủ. `/` = URL gốc (homepage).
- `id="navbar-menu"`: Vùng chứa menu (sẽ được JS thay đổi nội dung tùy trạng thái login).

---

# FILE 17: `src/views/partials/_footer.ejs` (Phần cuối chung)

```html
  <footer class="footer">
    <p>&copy; 2026 TaskFlow. All rights reserved.</p>
  </footer>
```
- `<footer>`: Thẻ semantic cho phần chân trang.
- `&copy;`: Ký tự HTML entity cho ©. Nếu gõ trực tiếp © cũng được, nhưng entity an toàn hơn.

```html
</body>
</html>
```
- Đóng `<body>` và `<html>`. Kết thúc trang.

**Cách sử dụng partial:** Trong file EJS khác, include bằng:
```html
<%- include('./partials/_header') %>
<!-- Nội dung trang ở đây -->
<%- include('./partials/_footer') %>
```
- `<%-` (có dấu trừ): In HTML thô (raw), KHÔNG escape. Vì partial chứa HTML tags cần giữ nguyên.
- `<%=` (dấu bằng): Escape HTML. Dùng cho dữ liệu user nhập (chống XSS injection).
- `include('./partials/_header')`: EJS tìm file `_header.ejs` trong thư mục partials cùng cấp.
  - Dấu `_` đầu tên file: Quy ước đặt tên cho partial (file không hoàn chỉnh, cần include vào file khác).

---

# FILE 18: `public/css/style.css` (Stylesheet chính)

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```
- `*`: Selector chọn TẤT CẢ phần tử HTML trên trang.
- `margin: 0; padding: 0;`: Xóa margin/padding mặc định của trình duyệt.
  - Mỗi trình duyệt tự gán margin/padding khác nhau cho `<h1>`, `<p>`, `<ul>`... → Trang trông khác nhau trên Chrome vs Firefox.
  - Reset về 0 để bắt đầu từ "trang giấy trắng" → Kết quả nhất quán.
- `box-sizing: border-box`: Thay đổi cách tính width/height.
  - Mặc định (`content-box`): `width: 200px` → Chiều rộng NỘI DUNG = 200px. Nếu thêm padding 20px → Tổng = 240px. Rất khó tính.
  - `border-box`: `width: 200px` → Tổng chiều rộng (nội dung + padding + border) = 200px. DỄ tính hơn nhiều.

```css
:root {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --bg-color: #f1f5f9;
  --card-bg: #ffffff;
  --text-color: #1e293b;
  --text-muted: #64748b;
  --danger-color: #ef4444;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --border-radius: 8px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```
- `:root`: Pseudo-class chọn phần tử gốc (`<html>`). Nơi khai báo CSS Variables (biến CSS).
- `--primary-color: #4f46e5`: Khai báo biến tên `--primary-color` với giá trị là mã màu Indigo.
  - `--` (2 dấu gạch ngang): Bắt buộc để đặt tên biến CSS.
  - `#4f46e5`: Mã hex 6 ký tự. 2 ký tự đầu = Red, 2 giữa = Green, 2 cuối = Blue.
- Tại sao dùng biến? Khi cần đổi theme, chỉ sửa 1 chỗ ở `:root` → Cả trang đổi theo. Không phải tìm và sửa 50 chỗ.
- Cách dùng biến: `color: var(--primary-color);`
- `rgba(0, 0, 0, 0.08)`: Màu đen (0,0,0) với độ trong suốt 0.08 (gần như trong suốt). Tạo bóng đổ rất nhẹ.

```css
body {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
  min-height: 100vh;
}
```
- `font-family`: Danh sách font ưu tiên. Trình duyệt dùng font đầu tiên có sẵn.
  - `'Inter'`: Font Google Fonts đẹp, hiện đại. Cần nhúng từ Google.
  - `'Segoe UI'`: Font mặc định Windows 10/11.
  - `system-ui`: Font hệ thống của OS (San Francisco trên Mac).
  - `sans-serif`: Font dự phòng cuối cùng.
- `var(--bg-color)`: Dùng biến CSS đã khai báo ở `:root`. Kết quả: `#f1f5f9` (xám xanh nhạt).
- `line-height: 1.6`: Khoảng cách giữa các dòng chữ = 1.6 lần cỡ chữ. Mặc định 1.2 thì chữ sát nhau khó đọc.
- `min-height: 100vh`: Chiều cao tối thiểu = 100% chiều cao viewport (cửa sổ trình duyệt).
  - `vh` = viewport height. `100vh` = full màn hình.
  - Đảm bảo footer luôn ở dưới cùng ngay cả khi nội dung ít.

```css
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
}
```
- `.auth-container`: Class cho trang login/register. Căn form ra giữa màn hình.
- `display: flex`: Bật Flexbox – hệ thống bố cục linh hoạt của CSS.
- `justify-content: center`: Căn giữa theo trục ngang (main axis).
- `align-items: center`: Căn giữa theo trục dọc (cross axis).
- Kết hợp 3 dòng trên → Nội dung nằm chính giữa cả ngang lẫn dọc.
- `calc(100vh - 120px)`: Hàm tính toán CSS. Chiều cao = toàn màn hình trừ 120px (navbar + footer).
- `2rem`: `rem` = root em = đơn vị tương đối theo cỡ chữ gốc (thường 16px). `2rem` = 32px.

```css
.auth-card {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
}
```
- `.auth-card`: Card chứa form.  
- `border-radius: 8px`: Bo tròn 4 góc. Tạo cảm giác mềm mại, hiện đại.
- `box-shadow`: Đổ bóng nhẹ bên dưới card → Tạo hiệu ứng "nổi" lên khỏi nền.
- `max-width: 420px`: Chiều rộng tối đa. Trên màn hình lớn, card không bị dãn quá rộng.

```css
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}
```
- `.form-group`: Mỗi cặp Label + Input bọc trong 1 group.
- `display: block`: Label chiếm nguyên 1 dòng (Input nằm dòng dưới).
- `font-weight: 600`: Chữ đậm vừa (semi-bold). Thang: 100(mỏng)→400(thường)→700(đậm)→900(cực đậm).
- `font-size: 0.875rem`: = 14px. Nhẹ hơn text thường (16px) vì label không cần to.
- `width: 100%`: Input chiếm hết chiều rộng container cha.
- `padding: 0.75rem 1rem`: Khoảng cách bên trong. `0.75rem` trên/dưới, `1rem` trái/phải. Giúp chữ trong ô input không sát viền.
- `border: 1px solid #e2e8f0`: Viền 1px, loại solid (liền nét), màu xám nhạt.
- `transition: border-color 0.2s ease`: Khi `border-color` thay đổi (vd: hover), chuyển đổi mượt trong 0.2 giây.
  - `ease`: Chuyển động bắt đầu chậm, nhanh dần, rồi chậm lại → Tự nhiên hơn.

```css
.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}
```
- `:focus`: Pseudo-class kích hoạt khi user click vào ô input (đang gõ).
- `outline: none`: Xóa viền focus mặc định xấu xí của trình duyệt (đường chấm chấm xanh).
- `border-color: var(--primary-color)`: Đổi viền thành màu chính (indigo) → User biết mình đang ở ô nào.
- `box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1)`: Tạo "hào quang" mờ xung quanh ô input.
  - `0 0 0 3px`: Không dịch chuyển ngang/dọc, không blur, spread 3px ra ngoài.
  - `rgba(79,70,229,0.1)`: Màu indigo trong suốt 90%. Hiệu ứng rất tinh tế.

```css
.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-hover);
}
```
- `.btn-primary`: Nút chính (Đăng ký, Đăng nhập).
- `border: none`: Xóa viền mặc định của button.
- `cursor: pointer`: Con trỏ chuột đổi thành hình bàn tay khi hover → Báo hiệu "có thể bấm".
- `:hover`: Khi rê chuột lên nút, đổi màu nền tối hơn → Phản hồi trực quan.

---

# FILE 19: `src/views/auth/login.ejs` (Trang đăng nhập)

```html
<%- include('../partials/_header') %>
```
- Nhúng header partial. Mang theo `<html>`, `<head>`, `<body>`, navbar.
- `<%-` (dấu trừ): In HTML thô, không escape. Partial chứa thẻ HTML cần giữ nguyên.

```html
<div class="auth-container">
  <div class="auth-card">
    <h1 class="auth-title">Đăng Nhập</h1>
```
- `auth-container` + `auth-card`: CSS Flexbox đẩy card ra giữa màn hình.
- `<h1>`: Tiêu đề cấp 1. Mỗi trang chỉ nên có 1 `<h1>` (SEO).

```html
    <form id="login-form">
```
- `<form>`: Container cho các input. KHÔNG có thuộc tính `action` hay `method` vì ta dùng JS fetch API thay vì submit form truyền thống.
- `id="login-form"`: ID duy nhất. JavaScript sẽ dùng `document.getElementById('login-form')` để bắt sự kiện submit.

```html
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="you@example.com" required>
      </div>
```
- `<label for="email">`: Label gắn với input có `id="email"`. Khi click vào chữ "Email", cursor tự nhảy vào ô input.
- `type="email"`: Trình duyệt tự kiểm tra format email (có @, có domain). Trên điện thoại sẽ hiện bàn phím có nút @.
- `name="email"`: Tên trường khi submit form. Quan trọng nếu dùng form submit truyền thống.
- `placeholder="you@example.com"`: Chữ mờ gợi ý trong ô input khi chưa gõ gì.
- `required`: Thuộc tính HTML5. Trình duyệt tự chặn submit nếu ô này trống (validate client-side).

```html
      <div class="form-group">
        <label for="password">Mật khẩu</label>
        <input type="password" id="password" name="password" placeholder="Nhập mật khẩu" required>
      </div>
```
- `type="password"`: Input hiện dấu chấm tròn ●●● thay vì hiện chữ gõ → Bảo mật trước mắt người khác.

```html
      <div id="error-message" class="error-text" style="display: none;"></div>
```
- Vùng hiển thị lỗi (ẩn mặc định).
- `style="display: none;"`: CSS inline ẩn phần tử. JS sẽ đổi thành `display: block` khi có lỗi.
- `id="error-message"`: JS dùng `getElementById` để điền nội dung lỗi vào `innerHTML`.

```html
      <button type="submit" class="btn-primary">Đăng Nhập</button>
```
- `type="submit"`: Khi bấm nút, trình duyệt phát sự kiện `submit` trên `<form>`.
- JS sẽ bắt sự kiện này, chặn hành vi mặc định (reload trang), và gọi API bằng fetch.

```html
    </form>
    <p class="auth-link">
      Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
    </p>
  </div>
</div>
```
- Link chuyển sang trang đăng ký. `href="/register"` → Server render `register.ejs`.

```html
<script src="/js/auth.js"></script>
<%- include('../partials/_footer') %>
```
- `<script src="/js/auth.js">`: Nhúng file JavaScript client. Express static tìm `public/js/auth.js`.
- Đặt trước `</body>` (trong footer) để HTML load xong trước khi JS chạy → Tránh lỗi "element not found".

---

# FILE 20: `src/views/auth/register.ejs` (Trang đăng ký)

Cấu trúc giống login, thêm 1 ô input `name`:

```html
<%- include('../partials/_header') %>

<div class="auth-container">
  <div class="auth-card">
    <h1 class="auth-title">Đăng Ký Tài Khoản</h1>

    <form id="register-form">
      <div class="form-group">
        <label for="name">Họ và tên</label>
        <input type="text" id="name" name="name" placeholder="Nguyễn Văn A" required>
      </div>
```
- `type="text"`: Input text thường.

```html
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="you@example.com" required>
      </div>

      <div class="form-group">
        <label for="password">Mật khẩu</label>
        <input type="password" id="password" name="password" placeholder="Ít nhất 6 ký tự" required minlength="6">
      </div>
```
- `minlength="6"`: HTML5 validate – chặn submit nếu gõ ít hơn 6 ký tự. Đây là validate phía client (dễ bị bypass), Backend vẫn phải validate lần nữa.

```html
      <div id="error-message" class="error-text" style="display: none;"></div>

      <button type="submit" class="btn-primary">Đăng Ký</button>
    </form>

    <p class="auth-link">
      Đã có tài khoản? <a href="/login">Đăng nhập</a>
    </p>
  </div>
</div>

<script src="/js/auth.js"></script>
<%- include('../partials/_footer') %>
```

---

# FILE 21: `public/js/auth.js` (Client JavaScript – Gọi API)

**Đây là file quan trọng nhất phía Frontend. Nó kết nối giao diện HTML với API Backend.**

```javascript
const API_URL = '/api/v1/auth';
```
- Khai báo URL gốc của Auth API. Dùng path tương đối (không ghi `http://localhost:5000`) → Tự động khớp domain hiện tại → Hoạt động cả trên localhost lẫn production.

```javascript
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}
```
- `function showError(message)`: Hàm hiển thị lỗi trên giao diện.
- `document.getElementById('error-message')`: Tìm phần tử HTML có `id="error-message"` (thẻ `<div>` ẩn trong form).
- `.textContent = message`: Gán nội dung text (an toàn, không parse HTML → Chống XSS).
  - Nếu dùng `.innerHTML`, hacker có thể inject `<script>` qua message → Nguy hiểm.
- `.style.display = 'block'`: Đổi CSS hiện thẻ div lên (từ `none` sang `block`).

```javascript
function hideError() {
  const errorDiv = document.getElementById('error-message');
  errorDiv.style.display = 'none';
}
```
- Ẩn thông báo lỗi (reset).

---

### Xử lý Form Đăng Ký

```javascript
const registerForm = document.getElementById('register-form');
```
- Tìm form đăng ký. Nếu trang hiện tại là Login → `registerForm` = `null` (không có form này).

```javascript
if (registerForm) {
```
- Kiểm tra: Chỉ chạy code bên trong nếu đang ở trang Register. Trang Login không có `register-form` → Bỏ qua.

```javascript
  registerForm.addEventListener('submit', async (e) => {
```
- `addEventListener('submit', callback)`: Lắng nghe sự kiện `submit` trên form.
  - Sự kiện `submit` xảy ra khi user bấm nút Submit hoặc nhấn Enter trong form.
- `async (e) => {...}`: Hàm callback bất đồng bộ.
  - `e`: Event object – chứa thông tin sự kiện (form nào, nút nào bấm...).

```javascript
    e.preventDefault();
```
- **CỰC KỲ QUAN TRỌNG.** Chặn hành vi mặc định của form submit.
- Mặc định: Khi submit, trình duyệt reload trang và gửi dữ liệu qua URL parameters. Ta KHÔNG muốn điều đó vì ta dùng Fetch API để gửi JSON.
- Nếu thiếu dòng này → Trang reload → Fetch API không kịp chạy.

```javascript
    hideError();
```
- Xóa thông báo lỗi cũ (nếu có) trước khi gửi request mới.

```javascript
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
```
- `.value`: Lấy giá trị hiện tại user đang gõ trong ô input.
  - Ví dụ: User gõ "Nguyễn Văn A" → `name` = `"Nguyễn Văn A"`.
- `trim()` có thể thêm (`.value.trim()`) để xóa khoảng trắng đầu/cuối.

```javascript
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
```
- `fetch(url, options)`: API gốc của trình duyệt để gửi HTTP request. Thay thế XMLHttpRequest cũ.
- `` `${API_URL}/register` ``: URL = `/api/v1/auth/register`.
- `method: 'POST'`: Gửi bằng method POST (tạo tài nguyên mới).
- `headers: { 'Content-Type': 'application/json' }`: Báo server "body tôi gửi lên là JSON".
  - Nếu thiếu header này → `express.json()` middleware không parse → `req.body` = `undefined`.
- `body: JSON.stringify({ name, email, password })`: Chuyển object JS thành chuỗi JSON.
  - `{ name, email, password }` viết tắt = `{ name: name, email: email, password: password }`.
  - `JSON.stringify(...)`: Kết quả ví dụ: `'{"name":"A","email":"a@g.com","password":"123456"}'`.
  - Body phải là string, không được gửi object trực tiếp.
- `await`: Đợi server trả response trước khi chạy tiếp.

```javascript
      const data = await response.json();
```
- `response.json()`: Parse body của response từ chuỗi JSON thành object JS.
- `await`: Đợi parse xong.
- `data` = `{ status: "success", data: { user: {...} }, message: "Đăng ký thành công" }`.

```javascript
      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }
```
- `response.ok`: `true` nếu HTTP status 200-299. `false` nếu 400-599.
- Fetch API KHÔNG tự throw lỗi khi nhận status 4xx/5xx (khác với axios). Phải tự kiểm tra.
- `throw new Error(...)`: Nhảy xuống `catch`.
- `data.message`: Lấy message lỗi từ backend (vd: "Email đã được đăng ký").

```javascript
      alert('Đăng ký thành công! Chuyển sang đăng nhập...');
      window.location.href = '/login';
```
- `alert(...)`: Hộp thoại thông báo. Đơn giản nhưng đủ dùng cho MVP.
- `window.location.href = '/login'`: Chuyển hướng trình duyệt sang trang login.

```javascript
    } catch (error) {
      showError(error.message);
    }
```
- Bắt lỗi (do `throw` ở trên, hoặc lỗi mạng nếu server chết) → Hiện thông báo lỗi trên giao diện.

---

### Xử lý Form Đăng Nhập

```javascript
const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }
```
- Tương tự form đăng ký, khác ở URL `/login` và chỉ gửi `email`, `password`.

```javascript
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
```
- `localStorage`: Bộ nhớ cục bộ của trình duyệt. Dữ liệu tồn tại vĩnh viễn cho đến khi bị xóa (kể cả đóng tab).
- `.setItem(key, value)`: Lưu cặp key-value.
  - `'accessToken'` → key.
  - `data.data.accessToken` → chuỗi JWT `"eyJhbGci..."`.
- `data.data`: Vì response format là `{ status, data: { user, accessToken, refreshToken }, message }`. Trường `data` bên ngoài chứa object `data` bên trong.
- Tại sao dùng localStorage?
  - Ưu: Đơn giản, dễ code. Token tồn tại khi reload trang.
  - Nhược: Dễ bị tấn công XSS (JS có thể đọc localStorage). Bản production nên dùng httpOnly cookie.

```javascript
      window.location.href = '/projects';
```
- Đăng nhập thành công → Chuyển hướng sang trang danh sách Projects.

```javascript
    } catch (error) {
      showError(error.message);
    }
  });
}
```
- Bắt lỗi hiện trên giao diện.

---

# FILE 22: `src/routes/viewRoutes.js` (Route render trang EJS)

```javascript
const express = require('express');
const router = express.Router();
```
- Tạo router riêng cho các route render giao diện (khác với API routes trả JSON).

```javascript
router.get('/', (req, res) => {
  res.redirect('/login');
});
```
- `GET /`: Khi user truy cập trang chủ.
- `res.redirect('/login')`: Chuyển hướng (HTTP 302) sang `/login`.
  - Trình duyệt nhận 302 → Tự gọi `GET /login` → Hiện trang login.
  - Tại sao redirect? Vì trang chủ chưa có nội dung riêng, đưa thẳng vào login.

```javascript
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Đăng Nhập - TaskFlow' });
});
```
- `res.render('auth/login', { title: '...' })`: Render file `src/views/auth/login.ejs`.
  - Tham số 1: Đường dẫn file EJS (không cần `.ejs`). Bắt đầu từ thư mục `views/` đã set ở app.js.
  - Tham số 2: Object chứa dữ liệu truyền vào EJS. Bên trong file EJS, `<%= title %>` sẽ in ra `"Đăng Nhập - TaskFlow"`.

```javascript
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Đăng Ký - TaskFlow' });
});
```
- Tương tự, render trang đăng ký.

```javascript
module.exports = router;
```
- Xuất router.

**Gắn vào app.js:**
```javascript
const viewRoutes = require('./routes/viewRoutes');
app.use('/', viewRoutes);
```
- Prefix `/` → Route `/login` trong viewRoutes = URL `/login` đầy đủ.
- Đặt TRƯỚC API routes để trang HTML load trước, tránh conflict.
