# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 1 (DÀNH CHO NGƯỜI MỚI HỌC)

Tài liệu này giải thích **từng dòng code** một cách cực kỳ chi tiết. Mỗi dòng đều có chú thích tại sao viết như vậy, nó làm gì, và nếu thiếu nó thì chuyện gì xảy ra.

---

# FILE 1: `.env` (Biến môi trường)

```env
PORT=5000
```
- `PORT=5000`: Máy chủ sẽ lắng nghe ở cổng số 5000. Khi bạn mở trình duyệt gõ `localhost:5000` nghĩa là bạn đang gõ cửa cổng này.
- Tại sao không gõ thẳng số `5000` vào code? Vì khi deploy lên Render/Railway, họ sẽ tự gán PORT khác (ví dụ 10000). Đọc từ `.env` giúp code linh hoạt.

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/taskflow?retryWrites=true&w=majority
```
- `MONGODB_URI`: Chuỗi kết nối tới MongoDB Atlas (CSDL trên mây).
- `mongodb+srv://`: Giao thức kết nối MongoDB qua SRV (DNS seed list).
- `username:password`: Tên đkí và mật khẩu bạn tạo trên Atlas (khu Database Access).
- `@cluster0.abc123.mongodb.net`: Địa chỉ server Cluster MongoDB của bạn trên Atlas.
- `/taskflow`: Tên Database. Nếu chưa tồn tại, MongoDB sẽ tự tạo khi bạn lưu dữ liệu đầu tiên.
- `?retryWrites=true`: Nếu ghi dữ liệu thất bại (mạng chập chờn), tự thử ghi lại.
- `&w=majority`: Đảm bảo dữ liệu được ghi vào đa số các node trong cluster → An toàn hơn.

```env
NODE_ENV=development
```
- `NODE_ENV`: Biến cho biết môi trường đang chạy.
- `development`: Đang code ở nhà. Server sẽ hiện nhiều log chi tiết để debug.
- Khi deploy sẽ đổi thành `production`: Tắt log, ẩn stack trace lỗi để bảo mật.

```env
JWT_SECRET=chuoi_bi_mat_cuc_ky_kho_doan_123!@#
```
- `JWT_SECRET`: Chìa khóa bí mật để "ký tên" lên JWT Token.
- Giống như con dấu đỏ trên giấy tờ. Chỉ server biết chìa này → Chỉ server mới tạo được token thật.
- Nếu hacker biết chuỗi này, họ có thể tự tạo token giả mạo bất kỳ ai.
- Phải đặt phức tạp, dài, và TUYỆT ĐỐI không push lên GitHub.

```env
JWT_REFRESH_SECRET=chuoi_bi_mat_refresh_456!@#
```
- Chìa khóa riêng cho Refresh Token. Dùng chìa KHÁC với Access Token.
- Tại sao? Nếu dùng chung 1 chìa, hacker lấy được Access Token có thể dùng chìa đó giải mã Refresh Token.

```env
JWT_EXPIRE=15m
```
- Access Token hết hạn sau 15 phút.
- `15m` = 15 minutes. JWT hiểu các format: `30s` (giây), `1h` (giờ), `7d` (ngày).
- Tại sao ngắn? Nếu token bị đánh cắp, hacker chỉ xài được tối đa 15 phút.

```env
JWT_REFRESH_EXPIRE=7d
```
- Refresh Token sống 7 ngày. Khi Access Token hết hạn, dùng Refresh Token để xin cái mới.

---

# FILE 2: `src/config/db.js` (Kết nối Database)

```javascript
const mongoose = require('mongoose');
```
- `const`: Khai báo biến không thể gán lại (immutable binding). Sau dòng này, `mongoose` không thể bị gán bằng thứ khác.
- `require('mongoose')`: Nạp (import) thư viện `mongoose` đã cài bằng `npm install`. Node.js sẽ tìm trong thư mục `node_modules/mongoose`.
- `mongoose` là gì? Là thư viện giúp Node.js nói chuyện với MongoDB. Thay vì viết câu lệnh MongoDB gốc phức tạp, ta dùng các hàm của mongoose như `.find()`, `.create()`.

```javascript
const connectDB = async () => {
```
- `const connectDB`: Tạo một hằng số tên `connectDB` chứa một hàm.
- `async`: Đánh dấu hàm này là "bất đồng bộ" (asynchronous). Bên trong nó sẽ có thao tác chờ đợi (kết nối mạng tới MongoDB mất vài giây).
- `() =>`: Arrow function (hàm mũi tên). Cách viết ngắn gọn thay cho `function()`.
- `{`: Mở thân hàm.

```javascript
  try {
```
- `try`: Bắt đầu khối "thử làm". Nếu code bên trong gặp lỗi, nó sẽ nhảy xuống `catch` thay vì crash cả server.
- Tại sao cần? Kết nối DB có thể thất bại (sai password, mạng chết). Nếu không `try-catch`, server sẽ crash ngay lập tức.

```javascript
    const conn = await mongoose.connect(process.env.MONGODB_URI);
```
- `const conn`: Lưu kết quả kết nối vào biến `conn`.
- `await`: "Đợi ở đây cho đến khi `mongoose.connect` hoàn thành". Nếu không có `await`, code sẽ chạy tiếp ngay mà không đợi kết nối xong → Bug.
- `mongoose.connect(...)`: Hàm kết nối tới MongoDB. Trả về một Promise (lời hứa sẽ hoàn thành sau).
- `process.env.MONGODB_URI`: Lấy giá trị biến `MONGODB_URI` từ file `.env`. `process.env` là object chứa tất cả biến môi trường.

```javascript
    console.log(`MongoDB Connected: ${conn.connection.host}`);
```
- `console.log(...)`: In ra Terminal (màn hình dòng lệnh đen).
- Dấu backtick `` ` ` ``: Template literal. Cho phép chèn biến vào chuỗi bằng `${...}`.
- `conn.connection.host`: Lấy tên máy chủ MongoDB đã kết nối thành công (vd: `cluster0-shard-00-00.abc123.mongodb.net`).
- Tại sao in ra? Để Dev biết chắc đã kết nối đúng cluster, không bị nhầm DB.

```javascript
  } catch (error) {
```
- `catch (error)`: Nếu `try` bên trên lỗi (sai URI, mạng chết), code sẽ nhảy vào đây. Tham số `error` chứa thông tin lỗi.

```javascript
    console.error(`Database Connection Error: ${error.message}`);
```
- `console.error(...)`: Giống `console.log` nhưng dành riêng cho lỗi. Ở một số Terminal, chữ sẽ hiện màu đỏ.
- `error.message`: Mỗi object Error đều có thuộc tính `.message` chứa mô tả lỗi dạng text.

```javascript
    process.exit(1);
```
- `process`: Object toàn cục của Node.js, đại diện cho chương trình đang chạy.
- `.exit(1)`: Tắt chương trình ngay lập tức. Số `1` nghĩa là "thoát vì lỗi" (convention: `0` = bình thường, `1` = lỗi).
- Tại sao tắt? Vì nếu không có DB thì server chạy cũng vô ích – mọi API sẽ trả lỗi.

```javascript
  }
};
```
- `}`: Đóng khối `catch`.
- `};`: Đóng thân hàm `connectDB`.

```javascript
module.exports = connectDB;
```
- `module.exports`: Cơ chế "xuất khẩu" của Node.js. Cho phép file khác `require` file này và nhận được hàm `connectDB`.
- Nếu thiếu dòng này, file khác gọi `require('./config/db')` sẽ nhận được `{}` (object rỗng) → Không gọi được hàm.

---

# FILE 3: `src/utils/AppError.js` (Lỗi tùy chỉnh)

```javascript
class AppError extends Error {
```
- `class AppError`: Khai báo một "khuôn đúc" (class) tên `AppError`.
- `extends Error`: Kế thừa class `Error` có sẵn của JavaScript. Nghĩa là `AppError` có tất cả tính năng của `Error` + thêm những gì ta tự viết.
- Tại sao kế thừa Error? Vì Express và Node.js nhận diện object là "lỗi" dựa trên việc nó có phải instance của `Error` không. Nếu tự tạo object thường `{ message: '...' }`, một số middleware sẽ không hoạt động đúng.

```javascript
  constructor(message, statusCode) {
```
- `constructor`: Hàm đặc biệt chạy tự động khi gọi `new AppError(...)`.
- `message`: Nội dung lỗi (vd: "Email đã tồn tại").
- `statusCode`: Mã HTTP (vd: 400, 401, 404, 500).

```javascript
    super(message);
```
- `super(message)`: Gọi constructor của class cha (`Error`). Truyền `message` lên cho `Error` xử lý.
- BẮT BUỘC phải gọi `super()` trước khi dùng `this` khi extends class khác. Nếu thiếu → JavaScript throw lỗi.

```javascript
    this.statusCode = statusCode;
```
- `this`: Trỏ tới object đang được tạo. Khi gọi `new AppError('...', 400)`, `this` chính là cái object lỗi đó.
- `this.statusCode = statusCode`: Gắn thuộc tính `statusCode` vào object. Error gốc của JS không có thuộc tính này, ta tự thêm.

```javascript
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
```
- `` `${statusCode}` ``: Chuyển số `400` thành chuỗi `"400"` để gọi `.startsWith()`.
- `.startsWith('4')`: Kiểm tra chuỗi có bắt đầu bằng chữ `'4'` không.
- `? 'fail' : 'error'`: Toán tử 3 ngôi (ternary). Nếu `true` → `'fail'`. Nếu `false` → `'error'`.
- Ý nghĩa: Mã 4xx (400, 401, 403, 404) là lỗi do client gửi sai → `"fail"`. Mã 5xx (500) là lỗi server → `"error"`.

```javascript
    this.isOperational = true;
```
- Đánh dấu lỗi này là "có chủ đích" (operational error). Nghĩa là Dev biết trước lỗi này có thể xảy ra (email trùng, token hết hạn).
- Ngược lại, nếu code có bug (chia cho 0, gọi hàm undefined), đó là "programming error" và `isOperational` sẽ là `false`.

```javascript
    Error.captureStackTrace(this, this.constructor);
```
- Ghi lại "dấu vết ngăn xếp" (stack trace) – danh sách các file/dòng code đã chạy trước khi lỗi xảy ra.
- `this.constructor`: Bỏ qua chính hàm constructor của AppError khỏi stack trace → Stack trace sạch hơn.
- Hữu ích để debug: Khi thấy lỗi, Dev biết chính xác dòng nào trong file nào gây ra.

```javascript
  }
}
module.exports = AppError;
```
- `}`: Đóng constructor.
- `}`: Đóng class.
- `module.exports`: Xuất class ra để các file khác dùng `new AppError(...)`.

---

# FILE 4: `src/middlewares/errorHandler.js` (Bắt lỗi tập trung)

```javascript
const errorHandler = (err, req, res, next) => {
```
- `(err, req, res, next)`: Middleware có **4 tham số** được Express tự động nhận diện là "Error Handling Middleware".
  - `err`: Object lỗi (do `next(error)` hoặc `throw` từ controller/service ném xuống).
  - `req`: Request gốc (chỉ dùng nếu cần biết URL nào gây lỗi).
  - `res`: Response để gửi JSON lỗi về cho client.
  - `next`: Gọi middleware tiếp theo (hiếm khi dùng trong error handler).
- Nếu chỉ có 3 tham số `(req, res, next)` → Express coi đó là middleware thường, KHÔNG phải error handler.

```javascript
  let statusCode = err.statusCode || 500;
```
- `let`: Khai báo biến có thể thay đổi giá trị (khác `const`).
- `err.statusCode`: Nếu lỗi là `AppError`, nó sẽ có `.statusCode` (vd: 400).
- `|| 500`: Toán tử OR. Nếu `err.statusCode` là `undefined` (Error thường của JS không có thuộc tính này), gán mặc định `500`.
- `500` = Internal Server Error (lỗi server không xác định).

```javascript
  let message = err.message || 'Lỗi máy chủ nội bộ';
```
- `err.message`: Mọi object Error đều có thuộc tính `.message`.
- `|| 'Lỗi máy chủ nội bộ'`: Nếu message rỗng, dùng chuỗi mặc định.

```javascript
  if (err.name === 'CastError') {
```
- `err.name`: Tên loại lỗi. Mongoose tự gán `'CastError'` khi truyền ID sai định dạng.
- Ví dụ: Gọi `/api/v1/projects/abc123` – chuỗi `abc123` không phải ObjectId hợp lệ (phải 24 ký tự hex).

```javascript
    statusCode = 400;
    message = `Không tìm thấy tài nguyên. ID "${err.value}" không hợp lệ`;
```
- Ghi đè `statusCode` thành 400 (Bad Request).
- `err.value`: Giá trị gây lỗi (vd: `"abc123"`).

```javascript
  if (err.name === 'ValidationError') {
```
- Mongoose ném `ValidationError` khi dữ liệu vi phạm Schema (thiếu trường required, sai enum).

```javascript
    const errors = Object.values(err.errors).map(val => val.message);
```
- `err.errors`: Object chứa từng trường bị lỗi. Ví dụ: `{ email: {...}, password: {...} }`.
- `Object.values(...)`: Lấy mảng các value (bỏ key). Kết quả: `[{...email error...}, {...password error...}]`.
- `.map(val => val.message)`: Duyệt mảng, rút `message` từ mỗi phần tử. Kết quả: `["Email không hợp lệ", "Mật khẩu quá ngắn"]`.

```javascript
    message = `Dữ liệu không hợp lệ: ${errors.join('. ')}`;
```
- `.join('. ')`: Nối mảng thành chuỗi, phân cách bằng dấu `. `.
- Kết quả: `"Dữ liệu không hợp lệ: Email không hợp lệ. Mật khẩu quá ngắn"`.

```javascript
  if (err.code === 11000) {
```
- `err.code`: MongoDB gán mã `11000` khi vi phạm ràng buộc `unique` (email trùng).
- Lưu ý: Đây là `.code` (số), không phải `.name` (chuỗi).

```javascript
    const field = Object.keys(err.keyValue)[0];
```
- `err.keyValue`: Object cho biết trường nào bị trùng. Ví dụ: `{ email: "test@test.com" }`.
- `Object.keys(...)`: Lấy mảng các key. Kết quả: `["email"]`.
- `[0]`: Lấy key đầu tiên. Kết quả: `"email"`.

```javascript
  if (err.name === 'JsonWebTokenError') {
```
- Thư viện `jsonwebtoken` ném lỗi này khi token bị sửa đổi (fake token).

```javascript
  if (err.name === 'TokenExpiredError') {
```
- Thư viện `jsonwebtoken` ném khi token đã quá thời hạn `expiresIn`.

```javascript
  res.status(statusCode).json({
```
- `res.status(statusCode)`: Set mã HTTP cho response (vd: 400, 401, 500).
- `.json({...})`: Gửi JSON về cho client và kết thúc response.

```javascript
    status: statusCode >= 500 ? 'error' : 'fail',
```
- Nếu mã >= 500 → `'error'` (lỗi server). Ngược lại → `'fail'` (lỗi client).

```javascript
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
```
- `...()`: Spread operator. Rải object con vào object cha.
- `process.env.NODE_ENV === 'development'`: Điều kiện: chỉ đúng khi đang ở môi trường development.
- `&& { stack: err.stack }`: Nếu điều kiện đúng → Thêm thuộc tính `stack` (dấu vết lỗi dài dòng).
- Khi deploy production, `stack` sẽ bị ẩn → Hacker không thấy cấu trúc code bên trong.

---

# FILE 5: `src/models/userModel.js` (Bảng Users)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
```
- Import 2 thư viện: `mongoose` (thao tác DB) và `bcrypt` (mã hóa mật khẩu).

```javascript
const userSchema = new mongoose.Schema({
```
- `new mongoose.Schema({...})`: Tạo "khuôn" (schema) cho bảng Users.
- Schema = bản thiết kế. Nó quy định bảng này có những cột nào, kiểu dữ liệu gì, ràng buộc gì.

```javascript
  name: {
    type: String,
```
- `type: String`: Cột `name` chứa dữ liệu kiểu chuỗi văn bản.
- Các kiểu khác: `Number` (số), `Boolean` (true/false), `Date` (ngày), `mongoose.Schema.Types.ObjectId` (ID tham chiếu).

```javascript
    required: [true, 'Vui lòng cung cấp tên'],
```
- `required: true`: Bắt buộc phải có. Nếu thiếu → Mongoose ném ValidationError.
- Mảng `[true, 'Vui lòng...']`: Phần tử thứ 2 là thông báo lỗi tùy chỉnh (thay vì message mặc định tiếng Anh).

```javascript
    trim: true,
```
- `trim: true`: Tự động cắt khoảng trắng đầu/cuối trước khi lưu.
- Input: `"  Nguyễn Văn A  "` → Lưu thành: `"Nguyễn Văn A"`.

```javascript
  email: {
    type: String,
    required: [true, 'Vui lòng cung cấp email'],
    unique: true,
```
- `unique: true`: MongoDB sẽ tạo index đảm bảo không có 2 document nào cùng email.
- Nếu cố insert trùng → MongoDB ném lỗi code 11000.
- Lưu ý: `unique` KHÔNG phải validator của Mongoose, nó là chỉ thị cho MongoDB.

```javascript
    lowercase: true,
```
- `lowercase: true`: Tự chuyển email thành chữ thường trước khi lưu.
- `"NVA@Gmail.COM"` → `"nva@gmail.com"`.
- Tại sao? Để khi user đăng nhập gõ `NVA@gmail.com` vẫn tìm thấy (so sánh chính xác).

```javascript
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
```
- `match`: Kiểm tra giá trị có khớp Regex (biểu thức chính quy) không.
- `/^\S+@\S+\.\S+$/` giải thích:
  - `^`: Bắt đầu chuỗi.
  - `\S+`: Ít nhất 1 ký tự không phải khoảng trắng.
  - `@`: Phải có ký tự @.
  - `\S+`: Ít nhất 1 ký tự không trắng (tên miền).
  - `\.`: Dấu chấm (literal dot).
  - `\S+`: Phần đuôi (.com, .vn...).
  - `$`: Kết thúc chuỗi.
- Khớp: `abc@gmail.com` ✅ | Không khớp: `abc` ❌, `abc@` ❌.

```javascript
  password: {
    type: String,
    required: [true, 'Vui lòng cung cấp mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
```
- `minlength: 6`: Chuỗi phải có ít nhất 6 ký tự. `"123"` → Lỗi. `"123456"` → OK.

```javascript
    select: false
```
- `select: false`: Khi chạy `User.find()` hoặc `User.findOne()`, trường `password` sẽ tự động bị ẩn khỏi kết quả.
- Tại sao? Để tránh vô tình trả password hash về cho client qua API.
- Khi cần lấy password (lúc đăng nhập so sánh), phải ghi rõ: `User.findOne({email}).select('+password')`.

```javascript
  avatar: {
    type: String,
    default: ''
```
- `default: ''`: Nếu không truyền avatar khi tạo user, tự động gán chuỗi rỗng.

```javascript
  refreshToken: {
    type: String,
    select: false
```
- Lưu Refresh Token hiện tại của user. Ẩn khỏi query thường.
- Tại sao lưu trong DB? Để khi user đổi mật khẩu hoặc bị khóa, ta có thể xóa refreshToken trong DB → Token cũ bị "thu hồi" tức thì.

```javascript
}, {
  timestamps: true
});
```
- `timestamps: true`: Mongoose tự động thêm 2 trường:
  - `createdAt`: Ngày tạo document.
  - `updatedAt`: Ngày cập nhật gần nhất.
- Mỗi lần gọi `.save()`, `updatedAt` sẽ tự cập nhật.

```javascript
userSchema.pre('save', async function(next) {
```
- `userSchema.pre('save', ...)`: Đăng ký "hook" chạy TRƯỚC khi một document được `.save()` vào DB.
- `'save'`: Tên sự kiện. Có thể là `'validate'`, `'remove'`, `'find'`...
- `async function(next)`: Phải dùng `function` (KHÔNG dùng arrow `=>`) vì cần truy cập `this`.
  - Trong `function`, `this` = document đang được save.
  - Trong arrow `=>`, `this` = context bên ngoài (sai).
- `next`: Callback để báo hook đã xong, cho phép tiếp tục save.

```javascript
  if (!this.isModified('password')) return next();
```
- `this.isModified('password')`: Kiểm tra trường `password` có bị thay đổi không.
- Tại sao kiểm tra?
  - Khi user đổi tên (chỉ sửa `name`), hook vẫn chạy vì `.save()` được gọi.
  - Nếu không check, password đã hash sẽ bị hash lần 2 → User vĩnh viễn không login được.
- `return next()`: Nhảy qua, không hash.

```javascript
  this.password = await bcrypt.hash(this.password, 10);
```
- `bcrypt.hash(plainText, saltRounds)`: Băm chuỗi `this.password` (text thường, vd "123456").
- `10`: Số vòng Salt. Càng cao càng an toàn nhưng càng chậm.
  - Salt = chuỗi ngẫu nhiên trộn vào trước khi hash.
  - Cùng password "123456", Salt khác nhau → Hash khác nhau → Hacker không thể dùng bảng tra cứu.
- `await`: Đợi bcrypt hoàn thành (tốn tài nguyên CPU, mất vài chục ms).
- Kết quả: `"123456"` → `"$2b$10$K9GE1x3YcZmkAR5F2..."` (60 ký tự).

```javascript
  next();
```
- Báo hook hoàn thành. Mongoose sẽ tiếp tục lưu document vào MongoDB.
- Nếu quên `next()`, request sẽ bị treo vĩnh viễn (hung forever).

```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
```
- `userSchema.methods.xxx`: Gắn hàm vào MỖI document (instance method). Mỗi user object sẽ có hàm này.
- Khác với `userSchema.statics.xxx`: Gắn hàm vào Model (class method), gọi bằng `User.xxx()`.
- `candidatePassword`: Password text mà user vừa nhập vào form đăng nhập.

```javascript
  return await bcrypt.compare(candidatePassword, this.password);
```
- `bcrypt.compare(text, hash)`: So sánh chuỗi text thô với chuỗi đã hash.
- Bên trong bcrypt tự trích salt từ chuỗi hash, rồi hash lại text với cùng salt, rồi so sánh.
- Trả về `true` (khớp) hoặc `false` (không khớp).
- `this.password`: Password hash đang lưu trong DB của user này.

```javascript
module.exports = mongoose.model('User', userSchema);
```
- `mongoose.model('User', userSchema)`: Tạo Model từ Schema.
  - Tham số 1 `'User'`: Tên model (viết hoa, số ít).
  - MongoDB sẽ tự tạo collection tên `users` (viết thường, số nhiều).
- `module.exports`: Xuất Model ra để file khác dùng `User.find()`, `User.create()`.

---

# FILE 6: `src/utils/generateToken.js` (Tạo JWT)

```javascript
const jwt = require('jsonwebtoken');
```
- Import thư viện `jsonwebtoken`. Cung cấp 2 hàm chính: `.sign()` (tạo token) và `.verify()` (giải mã token).

```javascript
exports.signAccessToken = (userId) => {
```
- `exports.xxx`: Cách xuất từng hàm riêng lẻ (thay vì `module.exports` xuất 1 thứ duy nhất).
- `(userId)`: Nhận vào ID của user (chuỗi ObjectId từ MongoDB, vd: `"60d5f484c3..."`)

```javascript
  return jwt.sign(
    { id: userId },
```
- `jwt.sign(payload, secret, options)`: Tạo JWT token.
- `{ id: userId }`: Payload – dữ liệu được nhúng vào bên trong token.
  - Khi giải mã token, sẽ lấy lại được `{ id: "60d5f..." }`.
  - CẢNH BÁO: Payload KHÔNG được mã hóa, chỉ được ký (signed). Ai có token đều đọc được payload. Nên KHÔNG đặt password hay dữ liệu nhạy cảm vào đây.

```javascript
    process.env.JWT_SECRET,
```
- Chìa khóa bí mật để "ký tên". Server dùng chìa này để kiểm tra token có phải do chính server tạo ra hay không.

```javascript
    { expiresIn: process.env.JWT_EXPIRE }
```
- `expiresIn: '15m'`: Token tự chết sau 15 phút. Sau thời điểm này, `jwt.verify()` sẽ throw `TokenExpiredError`.

```javascript
  );
};
```
- Hàm trả về chuỗi JWT dạng `"eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjYw..."`. Gồm 3 phần phân cách bởi dấu chấm:
  1. Header: Thuật toán mã hóa (HS256).
  2. Payload: Dữ liệu `{ id, iat, exp }` được encode Base64.
  3. Signature: Chữ ký = HMAC(header + payload, secret). Đây là phần bảo mật quan trọng nhất.

---

# FILE 7: `src/middlewares/authMiddleware.js` (Lính gác)

```javascript
exports.protect = async (req, res, next) => {
```
- `protect`: Hàm middleware bảo vệ route. Được gắn trước controller trong route definition.
- Ví dụ: `router.get('/projects', protect, projectController.getAll)` → request phải qua `protect` trước.

```javascript
    let token;
```
- Khai báo biến `token` bằng `let` (sẽ gán giá trị sau trong if).

```javascript
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
```
- `req.headers`: Object chứa tất cả HTTP headers client gửi lên.
- `req.headers.authorization`: Header `Authorization` (nếu client gửi).
- Client gửi token qua header dạng: `Authorization: Bearer eyJhbGci...`
- `.startsWith('Bearer')`: Kiểm tra chuỗi có bắt đầu bằng từ `"Bearer"` không.
- `&&`: Toán tử AND. Cả 2 điều kiện phải đúng.

```javascript
      token = req.headers.authorization.split(' ')[1];
```
- `.split(' ')`: Tách chuỗi `"Bearer eyJhbGci..."` thành mảng: `["Bearer", "eyJhbGci..."]`.
- `[1]`: Lấy phần tử thứ 2 (index 1) = chuỗi token thuần.

```javascript
    if (!token) {
      return next(new AppError('Bạn chưa đăng nhập. Vui lòng cung cấp token', 401));
    }
```
- `!token`: Nếu `token` vẫn là `undefined` (client không gửi header Authorization).
- `return next(new AppError(...))`: Tạo lỗi 401, đẩy xuống Error Handler, và `return` để dừng hàm tại đây (không chạy xuống dưới).

```javascript
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
```
- `jwt.verify(token, secret)`: Kiểm tra token có hợp lệ không.
  - Nếu token bị sửa 1 ký tự → Throw `JsonWebTokenError`.
  - Nếu token quá hạn → Throw `TokenExpiredError`.
  - Nếu OK → Trả về payload đã decode: `{ id: "60d5f...", iat: 1624..., exp: 1624... }`.
- `iat` = issued at (thời điểm tạo). `exp` = expiration (thời điểm hết hạn).

```javascript
    const currentUser = await User.findById(decoded.id);
```
- `User.findById(id)`: Tìm user theo `_id` trong MongoDB.
- `decoded.id`: Lấy `id` từ payload đã giải mã (chính là userId ta nhúng lúc sign token).
- Tại sao phải tìm lại user? Token có thể vẫn còn hạn nhưng user đã bị xóa/khóa tài khoản.

```javascript
    if (!currentUser) {
      return next(new AppError('Tài khoản không còn tồn tại', 401));
    }
```
- Trường hợp: Admin xóa tài khoản của user, nhưng token cũ vẫn chưa hết hạn.

```javascript
    req.user = currentUser;
```
- GẮN user vào object `req`. Từ đây, mọi middleware/controller phía sau đều truy cập được `req.user`.
- Ví dụ trong controller: `const userId = req.user._id;` → Biết chính xác ai đang gọi API.
- Đây chính là cách hệ thống "nhớ" bạn là ai giữa các request (stateless authentication).

```javascript
    next();
```
- Mọi thứ OK. Cho request đi tiếp vào controller đằng sau.
