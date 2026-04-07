# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 1 (PHẦN 2)

Tiếp nối phần 1 (File 1→7), phần này giải thích chi tiết các file còn lại: Auth Service, Auth Controller, Auth Routes, App.js, Server.js và các file Frontend/Model còn lại.

---

# FILE 8: `src/services/authService.js` (Bộ não xử lý đăng ký/đăng nhập)

```javascript
const User = require('../models/userModel');
```
- `require('../models/userModel')`: Nạp Model User từ file model.
- `../`: Ký hiệu "đi lên 1 cấp thư mục". Vì file hiện tại ở `src/services/`, cần lên `src/` rồi vào `models/`.
- Sau dòng này, `User` là Mongoose Model. Ta gọi được `User.find()`, `User.create()`, `User.findOne()`.

```javascript
const AppError = require('../utils/AppError');
```
- Nạp class `AppError` để ném lỗi có kèm statusCode.

```javascript
const { signAccessToken, signRefreshToken } = require('../utils/generateToken');
```
- `{ signAccessToken, signRefreshToken }`: Destructuring import. Thay vì lấy cả object, chỉ rút 2 hàm cần dùng.
- Tương đương với:
  ```javascript
  const tokenUtils = require('../utils/generateToken');
  const signAccessToken = tokenUtils.signAccessToken;
  const signRefreshToken = tokenUtils.signRefreshToken;
  ```

---

### Hàm đăng ký (registerUser)

```javascript
exports.registerUser = async (userData) => {
```
- `exports.registerUser`: Xuất hàm `registerUser` để controller import được.
- `async`: Hàm bất đồng bộ vì bên trong có thao tác DB (chờ mạng).
- `(userData)`: Nhận vào 1 object chứa thông tin user. Controller sẽ truyền `req.body` vào đây.
  - Ví dụ: `{ name: "Nguyễn Văn A", email: "a@gmail.com", password: "123456" }`.
- LƯU Ý QUAN TRỌNG: Service KHÔNG nhận `req` hay `res`. Nó chỉ nhận dữ liệu thuần và trả kết quả thuần. Giúp service có thể tái sử dụng ở nơi khác (script, cron job).

```javascript
  const existingUser = await User.findOne({ email: userData.email });
```
- `User.findOne({ email: userData.email })`: Tìm trong collection `users` xem có document nào có trường `email` bằng `userData.email` không.
- `findOne` trả về 1 document duy nhất (hoặc `null` nếu không tìm thấy).
- `await`: Đợi MongoDB tìm xong mới chạy tiếp.
- `existingUser`: Sẽ là object user (nếu email đã tồn tại) hoặc `null` (nếu email mới).

```javascript
  if (existingUser) {
    throw new AppError('Email đã được đăng ký', 400);
  }
```
- `if (existingUser)`: Nếu `existingUser` không phải `null` (nghĩa là đã có user dùng email này).
- `throw new AppError(...)`: Ném lỗi. Khi throw, hàm DỪNG ngay lập tức. Code bên dưới không chạy.
  - Lỗi này sẽ "bay" lên controller. Controller bắt bằng `try-catch` rồi gọi `next(error)` đẩy sang Error Handler.
- `400`: Bad Request – Client gửi dữ liệu sai (email đã có người dùng).

```javascript
  const user = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });
```
- `User.create({...})`: Tạo document mới trong collection `users`.
- Bên trong `.create()`, Mongoose sẽ:
  1. Validate dữ liệu theo Schema (kiểm tra required, minlength, match...).
  2. Chạy `pre('save')` hook → Hash password bằng bcrypt.
  3. Insert vào MongoDB.
  4. Trả về document đã lưu.
- `name: userData.name`: Lấy trường `name` từ object input gán cho trường `name` trong Schema.
- Lưu ý: Ta KHÔNG đặt `userData` trực tiếp vào `.create(userData)` vì client có thể gửi thêm trường lạ (vd: `{ role: "admin" }`). Chỉ pick đúng các trường cần thiết → Bảo mật hơn.

```javascript
  const userObj = user.toObject();
```
- `user`: Đây là Mongoose Document – object đặc biệt có nhiều method ẩn (save, validate...).
- `.toObject()`: Chuyển thành JavaScript Object thuần túy. Cho phép thêm/xóa thuộc tính tự do.
- Tại sao? Vì Mongoose Document không cho xóa trường bằng `delete` một cách đơn giản.

```javascript
  delete userObj.password;
```
- `delete`: Toán tử JS xóa thuộc tính khỏi object.
- Xóa `password` khỏi object trước khi trả về cho controller → Client không bao giờ thấy password hash.
- Mặc dù Schema đã set `select: false`, nhưng khi vừa `.create()` xong, document trả về vẫn có password.

```javascript
  return userObj;
```
- Trả về object user (không có password) cho controller.

---

### Hàm đăng nhập (loginUser)

```javascript
exports.loginUser = async (email, password) => {
```
- Nhận 2 tham số riêng lẻ (không nhận object) – rõ ràng hơn cho người đọc code.

```javascript
  if (!email || !password) {
    throw new AppError('Vui lòng cung cấp email và mật khẩu', 400);
  }
```
- `!email`: Nếu email là `undefined`, `null`, hoặc chuỗi rỗng `""` → `!email` = `true`.
- `||`: OR. Nếu thiếu email HOẶC thiếu password → ném lỗi.
- Đây là bước validate đầu vào đầu tiên trước khi query DB. Tiết kiệm 1 lượt gọi DB không cần thiết.

```javascript
  const user = await User.findOne({ email }).select('+password');
```
- `User.findOne({ email })`: Tìm user theo email.
  - Viết tắt của `{ email: email }`. Khi key và value trùng tên, JS cho phép viết gọn.
- `.select('+password')`: Bắt ép lấy trường `password` ra (vì Schema đã set `select: false`).
  - Dấu `+` nghĩa là "thêm trường này vào kết quả".
  - Nếu không `.select('+password')`, `user.password` sẽ là `undefined` → Không thể so sánh.

```javascript
  if (!user) {
    throw new AppError('Email chưa được đăng ký', 404);
  }
```
- `!user`: `findOne` trả về `null` → Email này không có trong DB.
- `404`: Not Found – Tài nguyên không tồn tại.

```javascript
  const isMatch = await user.comparePassword(password);
```
- `user.comparePassword(password)`: Gọi instance method đã viết trong Model.
  - `password` (tham số): Chuỗi text user vừa gõ vào form login (vd: `"123456"`).
  - `this.password` (bên trong method): Chuỗi hash lưu trong DB.
  - bcrypt sẽ hash chuỗi text với cùng salt trong chuỗi hash cũ, rồi so sánh.
- `isMatch`: `true` (đúng mật khẩu) hoặc `false` (sai).

```javascript
  if (!isMatch) {
    throw new AppError('Sai mật khẩu', 401);
  }
```
- `401`: Unauthorized – Xác thực thất bại.
- Lưu ý bảo mật: Một số hệ thống trả message chung chung "Email hoặc mật khẩu không đúng" để hacker không biết email có tồn tại hay không. Ở đây tách riêng cho dễ debug khi học.

```javascript
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
```
- `user._id`: MongoDB tự gán `_id` (ObjectId) cho mỗi document. Đây là ID duy nhất.
- `signAccessToken(user._id)`: Tạo JWT access token chứa `{ id: user._id }`, hết hạn 15 phút.
- `signRefreshToken(user._id)`: Tạo JWT refresh token, hết hạn 7 ngày.

```javascript
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
```
- `user.refreshToken = refreshToken`: Gán refresh token mới vào document user.
- `user.save()`: Lưu document xuống MongoDB (cập nhật trường refreshToken).
- `{ validateBeforeSave: false }`: Tắt validation trước khi save.
  - Tại sao tắt? Vì ta chỉ đang cập nhật `refreshToken`, không đổi email/password.
  - Nếu không tắt, Mongoose sẽ chạy lại validate `password` (yêu cầu required) → nhưng password đang bị ẩn (`select: false`) → Lỗi validate `"password is required"`.

```javascript
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
```
- Xóa cả password và refreshToken khỏi JSON trả về client.
- Client chỉ cần nhận token qua response JSON, KHÔNG cần thấy token nào được lưu trong DB.

```javascript
  return { user: userObj, accessToken, refreshToken };
```
- Trả về object gồm 3 thứ: thông tin user (đã lọc), access token, refresh token.
- `accessToken` là cách viết tắt của `accessToken: accessToken`.
- Controller sẽ nhận object này và đóng gói vào JSON response gửi về client.

---

### Hàm refresh token (refreshAccessToken)

```javascript
exports.refreshAccessToken = async (refreshToken) => {
```
- Nhận refresh token mà client gửi lên qua body.

```javascript
  if (!refreshToken) {
    throw new AppError('Refresh token không được cung cấp', 400);
  }
```
- Kiểm tra client có gửi refresh token không.

```javascript
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
  }
```
- `let decoded`: Dùng `let` vì gán giá trị bên trong `try` block.
- `jwt.verify(refreshToken, JWT_REFRESH_SECRET)`: Giải mã refresh token bằng secret RIÊNG của refresh token.
  - Nếu token bị sửa → `JsonWebTokenError`.
  - Nếu token hết hạn (> 7 ngày) → `TokenExpiredError`.
- `try-catch` bọc riêng: Bắt lỗi JWT tại đây để throw AppError với message tiếng Việt rõ ràng hơn.

```javascript
  const user = await User.findById(decoded.id).select('+refreshToken');
```
- Tìm user theo `id` trong payload đã giải mã.
- `.select('+refreshToken')`: Bắt ép lấy trường refreshToken (đã bị ẩn bởi `select: false`).

```javascript
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Refresh token đã bị thu hồi', 403);
  }
```
- `!user`: User đã bị xóa nhưng token chưa hết hạn.
- `user.refreshToken !== refreshToken`: Token trong DB khác với token client gửi lên.
  - Khi nào xảy ra? Khi user đăng nhập lại trên thiết bị khác → refreshToken trong DB bị ghi đè → Token cũ bị "vô hiệu hóa".
- `403`: Forbidden – Server hiểu request nhưng từ chối thực hiện.

```javascript
  const newAccessToken = signAccessToken(user._id);
  return { accessToken: newAccessToken };
```
- Cấp access token mới và trả về. Client sẽ dùng token mới này cho các request tiếp theo.

---

# FILE 9: `src/controllers/authController.js` (Bộ điều phối)

```javascript
const authService = require('../services/authService');
```
- Import service. Controller sẽ gọi các hàm logic từ service.

```javascript
exports.register = async (req, res, next) => {
```
- `exports.register`: Xuất hàm `register` để route gắn vào.
- `async`: Bên trong có `await` gọi service (bất đồng bộ).
- `(req, res, next)`: 3 tham số chuẩn của Express middleware/controller:
  - `req` (Request): Chứa dữ liệu client gửi lên (headers, body, params, query).
  - `res` (Response): Dùng để gửi dữ liệu về cho client.
  - `next`: Hàm gọi middleware tiếp theo. Thường dùng `next(error)` để đẩy lỗi sang Error Handler.

```javascript
  try {
```
- Mở khối try. Nếu service throw lỗi, code sẽ nhảy xuống `catch`.

```javascript
    const user = await authService.registerUser(req.body);
```
- `authService.registerUser(req.body)`: Gọi hàm đăng ký trong service.
- `req.body`: Object chứa dữ liệu JSON client gửi qua body.
  - Client gửi: `POST /register` body `{"name":"A","email":"a@g.com","password":"123456"}`.
  - `req.body` = `{ name: "A", email: "a@g.com", password: "123456" }`.
  - Cần `app.use(express.json())` ở app.js thì `req.body` mới có giá trị. Nếu thiếu → `req.body = undefined`.
- `await`: Đợi service xử lý xong (query DB, hash password).
- `user`: Kết quả trả về từ service (object user đã lọc bỏ password).

```javascript
    res.status(201).json({
      status: 'success',
      data: { user },
      message: 'Đăng ký thành công'
    });
```
- `res.status(201)`: Set HTTP status code = 201 (Created – Tạo thành công tài nguyên mới).
- `.json({...})`: Gửi response dạng JSON và kết thúc response.
  - Express tự set header `Content-Type: application/json`.
- `status: 'success'`: Quy chuẩn response format toàn dự án.
- `data: { user }`: Viết tắt của `data: { user: user }`.
- Sau `.json()`, response đã được gửi. Không được gọi `res.json()` hay `res.send()` lần 2 → Lỗi `ERR_HTTP_HEADERS_SENT`.

```javascript
  } catch (error) {
    next(error);
  }
```
- `catch (error)`: Bắt mọi lỗi từ `try` block:
  - Lỗi `AppError` do service throw (email trùng, thiếu dữ liệu).
  - Lỗi Mongoose (ValidationError, CastError).
  - Lỗi không lường trước (null pointer, v.v.).
- `next(error)`: Đẩy lỗi xuống Error Handler Middleware (file errorHandler.js).
  - KHÔNG viết `res.json(error)` ở đây vì Error Handler sẽ lo format response chuẩn.

```javascript
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
```
- `const { email, password } = req.body`: Destructuring. Từ object `req.body`, rút riêng `email` và `password` thành 2 biến.
- Tương đương:
  ```javascript
  const email = req.body.email;
  const password = req.body.password;
  ```

```javascript
    const result = await authService.loginUser(email, password);
```
- Gọi service login. Truyền email và password riêng lẻ (không truyền cả req.body).
- `result` = `{ user: {...}, accessToken: "eyJ...", refreshToken: "eyJ..." }`.

```javascript
    res.status(200).json({
      status: 'success',
      data: result,
      message: 'Đăng nhập thành công'
    });
```
- `200`: OK – Request thành công.
- `data: result`: Response sẽ chứa user info + 2 tokens.

```javascript
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
```
- Rút `refreshToken` từ body. Client gửi: `{"refreshToken": "eyJ..."}`.

```javascript
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ status: 'success', data: result });
```
- Gọi service để verify refresh token và cấp access token mới.
- Response: `{ status: "success", data: { accessToken: "eyJ_mới..." } }`.

---

# FILE 10: `src/routes/authRoutes.js` (Bảng chỉ đường)

```javascript
const express = require('express');
```
- Import Express để sử dụng Router.

```javascript
const router = express.Router();
```
- `express.Router()`: Tạo một "sub-router" (bộ định tuyến con).
- Router cho phép gom nhóm các route liên quan. Ví dụ: tất cả route `/auth/*` gom vào 1 router.
- `router` hoạt động giống `app` nhưng chuyên xử lý một nhóm URL.

```javascript
const authController = require('../controllers/authController');
```
- Import controller chứa các hàm xử lý.

```javascript
router.post('/register', authController.register);
```
- `router.post(...)`: Đăng ký route xử lý HTTP method POST.
- `'/register'`: Đường dẫn con. Kết hợp với prefix gắn ở app.js sẽ thành `/api/v1/auth/register`.
- `authController.register`: Hàm controller sẽ chạy khi client gọi route này.
- KHÔNG viết `authController.register()` (có ngoặc tròn). Vì ta đang TRUYỀN hàm, không phải GỌI hàm. Express sẽ tự gọi khi có request.

```javascript
router.post('/login', authController.login);
```
- Tương tự trên. URL đầy đủ: `POST /api/v1/auth/login`.

```javascript
router.post('/refresh', authController.refreshToken);
```
- URL đầy đủ: `POST /api/v1/auth/refresh`.

```javascript
module.exports = router;
```
- Xuất router để app.js gắn vào Express app.

---

# FILE 11: `src/app.js` (Bộ cấu hình chính)

```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
```
- `express`: Web framework.
- `cors`: Middleware cho phép Cross-Origin Resource Sharing.
  - Khi frontend ở `localhost:3000` gọi API ở `localhost:5000`, trình duyệt sẽ chặn (same-origin policy). CORS mở khóa hạn chế này.
- `morgan`: Logger middleware – tự in log mỗi request vào Terminal.
- `path`: Module built-in (có sẵn) của Node.js. Xử lý đường dẫn file/thư mục an toàn trên mọi hệ điều hành (Windows dùng `\`, Mac/Linux dùng `/`).

```javascript
const app = express();
```
- `express()`: Tạo 1 instance ứng dụng Express. Đây là object trung tâm – mọi thứ (route, middleware) đều gắn vào đây.
- `app` có các method: `.use()`, `.get()`, `.post()`, `.listen()`, `.set()`.

```javascript
app.use(express.json());
```
- `app.use(...)`: Gắn middleware vào app. Middleware sẽ chạy cho MỌI request.
- `express.json()`: Middleware parse body dạng JSON.
  - Khi client gửi `Content-Type: application/json` với body `{"name":"A"}`, middleware này parse chuỗi JSON thành object JS và gán vào `req.body`.
  - Nếu KHÔNG có dòng này: `req.body` = `undefined` → Controller không đọc được dữ liệu.

```javascript
app.use(express.urlencoded({ extended: true }));
```
- `express.urlencoded(...)`: Parse body dạng form HTML (`Content-Type: application/x-www-form-urlencoded`).
  - Khi HTML form submit, dữ liệu gửi dạng: `name=Nguyen+Van+A&email=a%40gmail.com`.
  - Middleware này chuyển thành: `{ name: "Nguyen Van A", email: "a@gmail.com" }`.
- `{ extended: true }`: Cho phép parse object lồng nhau (dùng thư viện `qs`). `false` → dùng `querystring` (đơn giản hơn).

```javascript
app.use(cors());
```
- Bật CORS cho tất cả origin. Trình duyệt sẽ không chặn request cross-origin.
- Khi deploy production, nên giới hạn: `cors({ origin: 'https://myapp.com' })`.

```javascript
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
```
- Chỉ bật logger khi đang dev. Khi production, tắt để giảm output log.
- `morgan('dev')`: Format log kiểu dev. Ví dụ output: `GET /api/v1/health 200 3.451 ms - 47`.
  - Method, URL, status code, thời gian xử lý, kích thước response.

```javascript
app.set('view engine', 'ejs');
```
- `app.set(key, value)`: Cấu hình setting cho Express.
- `'view engine'`: Bảo Express "khi render view, hãy dùng EJS".
- Sau dòng này, `res.render('login')` sẽ tìm file `login.ejs` và parse cú pháp EJS bên trong.

```javascript
app.set('views', path.join(__dirname, 'views'));
```
- `'views'`: Bảo Express "các file .ejs nằm ở thư mục này".
- `__dirname`: Biến đặc biệt Node.js = đường dẫn tuyệt đối của thư mục chứa file hiện tại.
  - Nếu file hiện tại là `C:\project\src\app.js` → `__dirname` = `C:\project\src`.
- `path.join(__dirname, 'views')`: Nối path an toàn → `C:\project\src\views`.
  - Tại sao dùng `path.join` thay vì nối chuỗi `__dirname + '/views'`? Vì Windows dùng `\`, Linux dùng `/`. `path.join` tự chọn dấu đúng.

```javascript
app.use(express.static(path.join(__dirname, '../public')));
```
- `express.static(folder)`: Middleware phục vụ file tĩnh (CSS, JS, images).
- `path.join(__dirname, '../public')`: Từ `src/`, đi lên 1 cấp `../` rồi vào `public/`.
  - Kết quả: `C:\project\public`.
- Sau dòng này: Truy cập `http://localhost:5000/css/style.css` → Express tự tìm file `public/css/style.css` và gửi về.
- Không cần viết route riêng cho từng file CSS/JS.

```javascript
const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/auth', authRoutes);
```
- `require('./routes/authRoutes')`: Import router chứa route đăng ký/đăng nhập.
- `app.use('/api/v1/auth', authRoutes)`: Gắn router vào prefix `/api/v1/auth`.
  - Route trong authRoutes: `/register` → URL đầy đủ: `/api/v1/auth/register`.
  - Route `/login` → `/api/v1/auth/login`.
- Prefix `/api/v1/`: Quy chuẩn RESTful API versioning. `v1` = phiên bản 1. Khi cần sửa đổi API lớn, tạo `v2` mà không ảnh hưởng client cũ.

```javascript
const AppError = require('./utils/AppError');

app.all('*', (req, res, next) => {
  next(new AppError(`Không tìm thấy ${req.originalUrl} trên server`, 404));
});
```
- `app.all('*', ...)`: Bắt TẤT CẢ HTTP method (GET, POST, PUT, DELETE...) trên TẤT CẢ URL (`*`).
- Dòng này phải đặt SAU tất cả route. Nghĩa là: Nếu request đã đi qua tất cả route mà không có route nào match → Rơi vào đây → Lỗi 404.
- `req.originalUrl`: URL gốc client gửi (vd: `/api/v1/blahblah`).
- `next(new AppError(...))`: Tạo lỗi 404 và đẩy xuống Error Handler.

```javascript
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);
```
- Gắn Error Handler Middleware. **PHẢI LÀ DÒNG CUỐI CÙNG** sau tất cả route và middleware khác.
- Tại sao cuối cùng? Vì middleware Express chạy theo thứ tự khai báo. Nếu error handler ở trên, lỗi từ route bên dưới sẽ không chảy được tới đây.

```javascript
module.exports = app;
```
- Xuất app để `server.js` import và gọi `.listen()`.

---

# FILE 12: `src/server.js` (Bấm nút khởi động)

```javascript
require('dotenv').config();
```
- `require('dotenv')`: Import thư viện dotenv.
- `.config()`: Đọc file `.env` ở thư mục gốc, parse từng dòng và gán vào `process.env`.
  - Sau dòng này: `process.env.PORT` = `"5000"`, `process.env.MONGODB_URI` = `"mongodb+srv://..."`.
- **PHẢI là dòng đầu tiên**: Nếu đặt sau `require('./app')`, lúc `app.js` chạy, `process.env.NODE_ENV` sẽ là `undefined` → `morgan` không bật.

```javascript
const app = require('./app');
```
- Import Express app đã cấu hình đầy đủ middleware, route, error handler.

```javascript
const connectDB = require('./config/db');
```
- Import hàm kết nối database.

```javascript
connectDB();
```
- GỌI hàm kết nối DB. Hàm async nên nó chạy ngầm (không block), server tiếp tục chạy dòng dưới.
- Nếu kết nối thất bại → `process.exit(1)` → Server tắt.
- Nếu thành công → Console log "MongoDB Connected".

```javascript
const PORT = process.env.PORT || 5000;
```
- `process.env.PORT`: Đọc PORT từ `.env`. Giá trị trả về luôn là STRING `"5000"`.
- `|| 5000`: Nếu `.env` không có PORT (undefined), dùng số `5000` mặc định.
  - Dù `process.env.PORT` là string `"5000"`, `app.listen` chấp nhận cả string lẫn number.

```javascript
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```
- `app.listen(PORT, callback)`: Bảo server mở cổng `PORT` trên máy và bắt đầu lắng nghe request.
  - Cổng (port) giống số phòng trong tòa nhà. Máy tính là tòa nhà, mỗi ứng dụng chiếm 1 phòng.
  - `PORT = 5000` → Trình duyệt gõ `localhost:5000` để vào "phòng" này.
- `() => { console.log(...) }`: Callback chạy sau khi server đã sẵn sàng.
- Output: `Server running in development mode on port 5000`.

---

# FILE 13: `src/models/projectModel.js` (Schema Project)

```javascript
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
```
- Tạo schema cho bảng Projects (bảng Kanban).

```javascript
  name: {
    type: String,
    required: [true, 'Vui lòng đặt tên cho dự án'],
    trim: true,
    maxlength: [100, 'Tên dự án không được vượt quá 100 ký tự']
  },
```
- `maxlength: [100, '...']`: Giới hạn chiều dài tối đa 100 ký tự.

```javascript
  description: {
    type: String,
    default: ''
  },
```
- Mô tả dự án. Không bắt buộc, mặc định rỗng.

```javascript
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
```
- `mongoose.Schema.Types.ObjectId`: Kiểu dữ liệu ID tham chiếu – lưu ID của 1 document trong collection khác.
- `ref: 'User'`: Tham chiếu tới Model `User`. Khi gọi `.populate('owner')`, Mongoose sẽ tự động truy vấn collection `users` theo ID này và thay thế bằng object user đầy đủ.
- Ý nghĩa: Ai tạo project thì là owner.

```javascript
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
```
- `[{...}]`: Mảng (array) các ObjectId. Mỗi phần tử là ID của 1 user.
- Lưu danh sách thành viên tham gia project. Owner cũng nằm trong members.

```javascript
  isDeleted: {
    type: Boolean,
    default: false
  }
```
- Cờ xóa mềm (soft delete). `false` = đang hoạt động. `true` = đã bị "xóa".
- Tại sao xóa mềm? Để có thể khôi phục dữ liệu nếu xóa nhầm. Và giữ lịch sử.

```javascript
}, {
  timestamps: true
});
```
- Tự thêm `createdAt` và `updatedAt`.

```javascript
module.exports = mongoose.model('Project', projectSchema);
```
- Tạo Model `Project` → MongoDB tạo collection `projects`.

---

# FILE 14: `src/models/taskModel.js` (Schema Task)

```javascript
const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Task phải thuộc về một Project']
  },
```
- Mỗi Task phải gắn với 1 Project. Không có Task mồ côi.

```javascript
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề công việc'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
```
- Tiêu đề bắt buộc, mô tả tùy chọn.

```javascript
  status: {
    type: String,
    enum: {
      values: ['To Do', 'In Progress', 'Done'],
      message: 'Trạng thái phải là: To Do, In Progress, hoặc Done'
    },
    default: 'To Do'
  },
```
- `enum`: Ràng buộc chỉ cho phép 3 giá trị cố định. Nếu truyền `"Hacking"` → ValidationError.
- `values: [...]`: Danh sách giá trị hợp lệ.
- `message: '...'`: Thông báo lỗi khi vi phạm enum.
- `default: 'To Do'`: Khi tạo Task mới không truyền status → mặc định "To Do".
- 3 giá trị này tương ứng 3 cột trên bảng Kanban Trello.

```javascript
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
```
- Mức ưu tiên. Giúp filter/sort task theo độ quan trọng.

```javascript
  deadline: {
    type: Date
  },
```
- `Date`: Kiểu ngày giờ. Lưu dạng ISO 8601 (vd: `2026-04-15T00:00:00.000Z`).
- Không `required` → Có thể không đặt deadline.

```javascript
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
```
- Người được giao việc. Tham chiếu tới User.
- Không `required` → Task có thể chưa giao cho ai.

```javascript
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
```
- Soft delete và timestamps giống project.

```javascript
taskSchema.index({ projectId: 1, status: 1 });
```
- `index(...)`: Tạo index phức hợp trên 2 trường `projectId` và `status`.
- `1`: Sắp xếp tăng dần (ascending). `-1` = giảm dần.
- Tại sao? Khi load board, ta luôn query: `Task.find({ projectId: X, status: Y })`. Index giúp MongoDB tìm nhanh hơn gấp nhiều lần (không phải quét toàn bộ collection).

---

# FILE 15: `src/models/commentModel.js` (Schema Comment)

```javascript
const commentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Bình luận phải thuộc về một Task']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bình luận phải có tác giả']
  },
  content: {
    type: String,
    required: [true, 'Nội dung bình luận không được để trống'],
    trim: true,
    minlength: [1, 'Nội dung phải có ít nhất 1 ký tự']
  }
}, {
  timestamps: true
});
```
- `taskId`: Bình luận nào thuộc task nào.
- `author`: Ai viết bình luận.
- `content`: Nội dung bình luận. `trim` xóa khoảng trắng, `minlength: 1` chặn gửi rỗng.
- `timestamps`: `createdAt` dùng hiển thị "3 giờ trước" trên giao diện.

```javascript
commentSchema.index({ taskId: 1, createdAt: -1 });
```
- Index trên `taskId` (lọc theo task) và `createdAt: -1` (sắp xếp mới nhất trước).
- Khi load 500 comment của 1 task, MongoDB dùng index này trả kết quả nhanh không cần full scan.

```javascript
module.exports = mongoose.model('Comment', commentSchema);
```
- Collection trong MongoDB: `comments`.
