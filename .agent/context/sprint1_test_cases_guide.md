# HƯỚNG DẪN KIỂM THỬ CHI TIẾT – SPRINT 1: AUTH MODULE

Tài liệu này hướng dẫn **từng bước** cài đặt môi trường test, viết test cases tự động bằng **Jest + Supertest**, và test thủ công bằng **Postman**. Mục tiêu: **100% coverage** cho mọi nhánh logic.

---

## PHẦN A: CÀI ĐẶT MÔI TRƯỜNG TEST

### Bước 1: Cài thư viện test

```bash
npm install --save-dev jest supertest mongodb-memory-server cross-env
```

*Giải thích từng gói:*
- `jest`: Framework test phổ biến nhất cho Node.js. Tự tìm file `*.test.js`, chạy, báo cáo.
- `supertest`: Gửi HTTP request tới Express app MÀ KHÔNG cần bật server thật. Tựa Postman nhưng bằng code.
- `mongodb-memory-server`: Chạy MongoDB giả trong RAM. Test xong tự xóa sạch, không ảnh hưởng DB thật.
- `cross-env`: Set biến môi trường (`NODE_ENV=test`) hoạt động trên cả Windows + Mac + Linux.

### Bước 2: Cấu hình Jest

Mở `package.json`, thêm:
```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "seed": "node src/utils/seedData.js",
  "test": "cross-env NODE_ENV=test jest --verbose --forceExit --detectOpenHandles",
  "test:coverage": "cross-env NODE_ENV=test jest --verbose --forceExit --detectOpenHandles --coverage"
},
"jest": {
  "testEnvironment": "node",
  "testTimeout": 30000,
  "testMatch": ["**/tests/**/*.test.js"]
}
```

*Giải thích:*
- `cross-env NODE_ENV=test`: Đặt biến NODE_ENV=test trước khi chạy Jest. Code sẽ dùng DB test thay vì DB production.
- `--verbose`: In chi tiết mỗi test case (tên + kết quả).
- `--forceExit`: Buộc Jest thoát sau khi chạy xong (tránh treo do MongoDB connection còn mở).
- `--detectOpenHandles`: Cảnh báo nếu có handle chưa đóng (debug memory leak).
- `--coverage`: Tạo báo cáo coverage (% code đã được test).
- `testMatch`: Chỉ tìm file test trong thư mục `tests/`.
- `testTimeout: 30000`: Mỗi test case có tối đa 30 giây (MongoDB memory server cần thời gian khởi động).

### Bước 3: Tạo cấu trúc thư mục test

```bash
mkdir -p tests/setup tests/auth tests/project tests/task tests/comment tests/user tests/dashboard
```

### Bước 4: Tạo file setup kết nối DB test (`tests/setup/db.js`)

```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Chạy TRƯỚC tất cả test files
const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

// Xóa TOÀN BỘ data sau MỖI test case
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Ngắt kết nối + tắt MongoDB memory sau TẤT CẢ tests
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

module.exports = { connect, clearDatabase, closeDatabase };
```

*Giải thích:*
- `MongoMemoryServer.create()`: Khởi tạo 1 instance MongoDB chạy hoàn toàn trong RAM. Không cần cài MongoDB, không cần Atlas.
- `clearDatabase()`: Xóa data giữa các test → Mỗi test case chạy trên DB sạch (isolated).
- Test A tạo user `a@test.com` → Xóa → Test B tạo cùng email không bị lỗi duplicate.

### Bước 5: Tạo file setup biến môi trường test (`tests/setup/env.js`)

```javascript
// Set biến môi trường cho test (TRƯỚC khi import app)
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';
process.env.NODE_ENV = 'test';
```

*Giải thích:*
- Không dùng file `.env` khi test. Set trực tiếp trong code test để không phụ thuộc file.
- Secret key test có thể đơn giản (không cần bảo mật vì DB test là RAM, tự xóa).

---

## PHẦN B: TEST CASES CHO AUTH MODULE

### File: `tests/auth/auth.test.js`

```javascript
// ===== IMPORT SETUP =====
require('../setup/env');          // Set biến môi trường TRƯỚC
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/userModel');

// ===== LIFECYCLE HOOKS =====

// Chạy 1 lần trước TẤT CẢ test trong file này
beforeAll(async () => {
  await connect();
});

// Chạy sau MỖI test case
afterEach(async () => {
  await clearDatabase();
});

// Chạy 1 lần sau TẤT CẢ test
afterAll(async () => {
  await closeDatabase();
});
```

*Giải thích lifecycle:*
- `beforeAll`: Kết nối MongoDB memory 1 lần. Nếu connect trong mỗi test → Rất chậm.
- `afterEach`: Xóa data sau mỗi test → Mỗi test case độc lập, không ảnh hưởng nhau.
- `afterAll`: Dọn dẹp tài nguyên (đóng kết nối, tắt MongoDB memory).

---

### NHÓM 1: ĐĂNG KÝ (Register) – 8 Test Cases

```javascript
describe('POST /api/v1/auth/register', () => {

  // ==========================================
  // TC-R01: Đăng ký thành công với dữ liệu hợp lệ
  // ==========================================
  test('TC-R01: Đăng ký thành công', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Nguyễn Văn A',
        email: 'a@test.com',
        password: '123456'
      });

    // Kiểm tra response
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user).toHaveProperty('name', 'Nguyễn Văn A');
    expect(res.body.data.user).toHaveProperty('email', 'a@test.com');
    expect(res.body.data.user).not.toHaveProperty('password');
    // password KHÔNG được trả về client

    // Kiểm tra DB
    const userInDb = await User.findOne({ email: 'a@test.com' }).select('+password');
    expect(userInDb).toBeTruthy();
    // Password trong DB phải là hash (bắt đầu bằng $2b$)
    expect(userInDb.password).toMatch(/^\$2b\$/);
    expect(userInDb.password).not.toBe('123456');
  });
```

*Giải thích:*
- `request(app)`: Supertest tạo HTTP request tới Express app.
- `.post(url)`: Method POST.
- `.send(body)`: Gửi body JSON.
- `expect(res.statusCode).toBe(201)`: Assert status code = 201 (Created).
- `toHaveProperty('name', 'Nguyễn Văn A')`: Kiểm tra object có property `name` = giá trị cụ thể.
- `not.toHaveProperty('password')`: Đảm bảo password bị ẩn.
- `/^\$2b\$/`: Regex kiểm tra chuỗi bắt đầu bằng `$2b$` (đặc trưng bcrypt hash).

```javascript
  // ==========================================
  // TC-R02: Đăng ký thất bại – Email trùng
  // ==========================================
  test('TC-R02: Email đã tồn tại', async () => {
    // Tạo user trước
    await User.create({ name: 'User1', email: 'a@test.com', password: '123456' });

    // Đăng ký cùng email
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User2',
        email: 'a@test.com',
        password: '654321'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/đã được đăng ký|đã tồn tại/i);
  });
```

*Giải thích:*
- Tạo user trước bằng `User.create()` → Đăng ký cùng email → Expect lỗi 400.
- `.toMatch(/regex/i)`: Kiểm tra message chứa cụm từ (case-insensitive). Cho phép message hơi khác nhau.

```javascript
  // ==========================================
  // TC-R03: Đăng ký thất bại – Thiếu name
  // ==========================================
  test('TC-R03: Thiếu trường name', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@test.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  // ==========================================
  // TC-R04: Đăng ký thất bại – Thiếu email
  // ==========================================
  test('TC-R04: Thiếu trường email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        password: '123456'
      });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-R05: Đăng ký thất bại – Thiếu password
  // ==========================================
  test('TC-R05: Thiếu trường password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@test.com'
      });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-R06: Đăng ký thất bại – Email sai format
  // ==========================================
  test('TC-R06: Email không hợp lệ', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'khong-phai-email',
        password: '123456'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email|không hợp lệ/i);
  });

  // ==========================================
  // TC-R07: Đăng ký thất bại – Password quá ngắn
  // ==========================================
  test('TC-R07: Password dưới 6 ký tự', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@test.com',
        password: '123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/6 ký tự|6 characters/i);
  });

  // ==========================================
  // TC-R08: Đăng ký – Email tự động lowercase
  // ==========================================
  test('TC-R08: Email tự động chuyển lowercase', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test',
        email: 'TEST@Gmail.COM',
        password: '123456'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.email).toBe('test@gmail.com');
  });
});
```

---

### NHÓM 2: ĐĂNG NHẬP (Login) – 6 Test Cases

```javascript
describe('POST /api/v1/auth/login', () => {

  // Tạo user TRƯỚC mỗi nhóm test login
  let testUser;
  beforeEach(async () => {
    testUser = await User.create({
      name: 'Login User', email: 'login@test.com', password: '123456'
    });
  });

  // ==========================================
  // TC-L01: Đăng nhập thành công
  // ==========================================
  test('TC-L01: Đăng nhập thành công', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user).toHaveProperty('name', 'Login User');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('refreshToken');

    // Kiểm tra token có format JWT (3 phần ngăn bằng dấu .)
    expect(res.body.data.accessToken.split('.')).toHaveLength(3);
    expect(res.body.data.refreshToken.split('.')).toHaveLength(3);
  });

  // ==========================================
  // TC-L02: Đăng nhập thất bại – Email chưa đăng ký
  // ==========================================
  test('TC-L02: Email không tồn tại', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'khongtontai@test.com', password: '123456' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/chưa được đăng ký|không tồn tại/i);
  });

  // ==========================================
  // TC-L03: Đăng nhập thất bại – Sai password
  // ==========================================
  test('TC-L03: Sai mật khẩu', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'sai_mat_khau' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/sai mật khẩu|incorrect/i);
  });

  // ==========================================
  // TC-L04: Đăng nhập thất bại – Thiếu email
  // ==========================================
  test('TC-L04: Không gửi email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: '123456' });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-L05: Đăng nhập thất bại – Thiếu password
  // ==========================================
  test('TC-L05: Không gửi password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com' });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-L06: Đăng nhập thất bại – Body rỗng
  // ==========================================
  test('TC-L06: Body rỗng', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
  });
});
```

---

### NHÓM 3: REFRESH TOKEN – 4 Test Cases

```javascript
describe('POST /api/v1/auth/refresh', () => {

  let tokens;
  beforeEach(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: '123456' });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: '123456' });

    tokens = loginRes.body.data;
  });

  // ==========================================
  // TC-RF01: Refresh thành công
  // ==========================================
  test('TC-RF01: Refresh token hợp lệ → Nhận access token mới', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.accessToken).not.toBe(tokens.accessToken);
    // Access token mới phải KHÁC token cũ
  });

  // ==========================================
  // TC-RF02: Refresh thất bại – Token sai
  // ==========================================
  test('TC-RF02: Refresh token không hợp lệ', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'token-gia-mao-abc123' });

    expect(res.statusCode).toBe(401);
  });

  // ==========================================
  // TC-RF03: Refresh thất bại – Không gửi token
  // ==========================================
  test('TC-RF03: Thiếu refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-RF04: Refresh thất bại – Token đã bị thu hồi
  // ==========================================
  test('TC-RF04: Token đã bị thu hồi (đã logout)', async () => {
    // Logout trước (xóa refresh token trong DB)
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    // Thử refresh bằng token cũ
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/thu hồi|revoked/i);
  });
});
```

---

### NHÓM 4: MIDDLEWARE PROTECT – 5 Test Cases

```javascript
describe('Auth Middleware (protect)', () => {

  let accessToken;
  beforeEach(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: '123456' });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: '123456' });

    accessToken = loginRes.body.data.accessToken;
  });

  // ==========================================
  // TC-M01: Token hợp lệ → Cho phép truy cập
  // ==========================================
  test('TC-M01: Request với token hợp lệ', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
  });

  // ==========================================
  // TC-M02: Không có token → 401
  // ==========================================
  test('TC-M02: Request không có header Authorization', async () => {
    const res = await request(app)
      .get('/api/v1/projects');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/chưa đăng nhập|token/i);
  });

  // ==========================================
  // TC-M03: Token sai → 401
  // ==========================================
  test('TC-M03: Token giả mạo', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer token.gia.mao');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/không hợp lệ|invalid/i);
  });

  // ==========================================
  // TC-M04: Token thiếu "Bearer" prefix → 401
  // ==========================================
  test('TC-M04: Thiếu prefix Bearer', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', accessToken);

    expect(res.statusCode).toBe(401);
  });

  // ==========================================
  // TC-M05: Route không tồn tại → 404
  // ==========================================
  test('TC-M05: Route 404', async () => {
    const res = await request(app)
      .get('/api/v1/khong-ton-tai');

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/không tìm thấy/i);
  });
});
```

---

### NHÓM 5: ĐĂNG XUẤT + ĐỔI MẬT KHẨU – 5 Test Cases

```javascript
describe('POST /api/v1/auth/logout', () => {

  let accessToken;
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: '123456' });
    const loginRes = await request(app).post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: '123456' });
    accessToken = loginRes.body.data.accessToken;
  });

  test('TC-LO01: Đăng xuất thành công', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/đăng xuất|logout/i);
  });

  test('TC-LO02: Đăng xuất không có token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout');

    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/v1/auth/change-password', () => {

  let accessToken;
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: '123456' });
    const loginRes = await request(app).post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: '123456' });
    accessToken = loginRes.body.data.accessToken;
  });

  test('TC-CP01: Đổi mật khẩu thành công', async () => {
    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: '123456', newPassword: 'abc789' });

    expect(res.statusCode).toBe(200);

    // Thử login bằng password mới
    const loginRes = await request(app).post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'abc789' });
    expect(loginRes.statusCode).toBe(200);
  });

  test('TC-CP02: Đổi mật khẩu – Sai password cũ', async () => {
    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'sai_pass', newPassword: 'abc789' });

    expect(res.statusCode).toBe(401);
  });

  test('TC-CP03: Đổi mật khẩu – Password mới trùng cũ', async () => {
    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: '123456', newPassword: '123456' });

    expect(res.statusCode).toBe(400);
  });
});
```

---

### CHẠY TEST VÀ ĐỌC KẾT QUẢ

```bash
npm test
```

**Kết quả mong đợi:**
```
 PASS  tests/auth/auth.test.js
  POST /api/v1/auth/register
    ✓ TC-R01: Đăng ký thành công (120 ms)
    ✓ TC-R02: Email đã tồn tại (85 ms)
    ✓ TC-R03: Thiếu trường name (45 ms)
    ✓ TC-R04: Thiếu trường email (42 ms)
    ✓ TC-R05: Thiếu trường password (40 ms)
    ✓ TC-R06: Email không hợp lệ (43 ms)
    ✓ TC-R07: Password dưới 6 ký tự (41 ms)
    ✓ TC-R08: Email tự động chuyển lowercase (65 ms)
  POST /api/v1/auth/login
    ✓ TC-L01: Đăng nhập thành công (180 ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
```

**Xem coverage:**
```bash
npm run test:coverage
```

Mở file `coverage/lcov-report/index.html` trong trình duyệt → Xem % coverage từng file.

---

## PHẦN C: TEST THỦ CÔNG BẰNG POSTMAN (Bảng tham chiếu nhanh)

| # | Method | URL | Body | Expected | Coverage |
|:---:|:---:|:---|:---|:---:|:---|
| R01 | POST | /api/v1/auth/register | `{"name":"A","email":"a@t.com","password":"123456"}` | 201 | Happy path |
| R02 | POST | /api/v1/auth/register | Cùng email R01 | 400 | Duplicate |
| R03 | POST | /api/v1/auth/register | Thiếu name | 400 | Validation |
| R04 | POST | /api/v1/auth/register | Thiếu email | 400 | Validation |
| R05 | POST | /api/v1/auth/register | Thiếu password | 400 | Validation |
| R06 | POST | /api/v1/auth/register | Email sai format | 400 | Regex |
| R07 | POST | /api/v1/auth/register | Password 3 ký tự | 400 | Minlength |
| R08 | POST | /api/v1/auth/register | Email viết hoa | 201 | Lowercase |
| L01 | POST | /api/v1/auth/login | Email + pass đúng | 200 | Happy path |
| L02 | POST | /api/v1/auth/login | Email chưa đăng ký | 404 | Not found |
| L03 | POST | /api/v1/auth/login | Pass sai | 401 | Wrong pass |
| L04 | POST | /api/v1/auth/login | Thiếu email | 400 | Missing field |
| L05 | POST | /api/v1/auth/login | Thiếu password | 400 | Missing field |
| L06 | POST | /api/v1/auth/login | Body rỗng | 400 | Empty body |
| RF01 | POST | /api/v1/auth/refresh | Refresh token hợp lệ | 200 | Happy path |
| RF02 | POST | /api/v1/auth/refresh | Token giả | 401 | Invalid |
| RF03 | POST | /api/v1/auth/refresh | Thiếu token | 400 | Missing |
| RF04 | POST | /api/v1/auth/refresh | Token đã logout | 403 | Revoked |
| M01 | GET | /api/v1/projects | Header: Bearer valid_token | 200 | Protected |
| M02 | GET | /api/v1/projects | Không có header | 401 | No token |
| M03 | GET | /api/v1/projects | Header: Bearer fake_token | 401 | Invalid |
| M04 | GET | /api/v1/projects | Header thiếu "Bearer" | 401 | No prefix |
| M05 | GET | /api/v1/khong-ton-tai | — | 404 | 404 handler |
| LO01 | POST | /api/v1/auth/logout | Header: Bearer token | 200 | Happy path |
| LO02 | POST | /api/v1/auth/logout | Không có token | 401 | No token |
| CP01 | PUT | /api/v1/auth/change-password | `{"currentPassword":"123456","newPassword":"abc789"}` | 200 | Happy path |
| CP02 | PUT | /api/v1/auth/change-password | currentPassword sai | 401 | Wrong old |
| CP03 | PUT | /api/v1/auth/change-password | newPassword = old | 400 | Same pass |

**Tổng Sprint 1: 28 test cases** → Phủ 100% nhánh logic Auth module.
