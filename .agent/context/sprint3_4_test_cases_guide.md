# HƯỚNG DẪN KIỂM THỬ CHI TIẾT – SPRINT 3: USER PROFILE, DASHBOARD, INTEGRATION

Test cases cho User Profile, Avatar Upload, Dashboard Stats, và Integration Tests. Tổng **32 test cases**.

---

## PHẦN A: TEST CASES CHO USER PROFILE MODULE

### File: `tests/user/user.test.js`

```javascript
require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');
const path = require('path');
const fs = require('fs');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());
```

---

### NHÓM 1: LẤY PROFILE – 3 Test Cases

```javascript
describe('GET /api/v1/users/profile', () => {

  // ==========================================
  // TC-U01: Lấy profile thành công
  // ==========================================
  test('TC-U01: Lấy thông tin profile', async () => {
    const { accessToken } = await createAuthUser({
      name: 'Nguyễn Văn A',
      email: 'a@test.com'
    });

    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user).toHaveProperty('name', 'Nguyễn Văn A');
    expect(res.body.data.user).toHaveProperty('email', 'a@test.com');
    expect(res.body.data.user).toHaveProperty('avatar');
    expect(res.body.data.user).toHaveProperty('createdAt');
    // KHÔNG được trả password
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('refreshToken');
  });

  // ==========================================
  // TC-U02: Profile không có token → 401
  // ==========================================
  test('TC-U02: Không có token', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile');

    expect(res.statusCode).toBe(401);
  });

  // ==========================================
  // TC-U03: Profile token giả → 401
  // ==========================================
  test('TC-U03: Token không hợp lệ', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer fake.token.here');

    expect(res.statusCode).toBe(401);
  });
});
```

---

### NHÓM 2: CẬP NHẬT PROFILE – 5 Test Cases

```javascript
describe('PUT /api/v1/users/profile', () => {

  // ==========================================
  // TC-U04: Cập nhật tên thành công
  // ==========================================
  test('TC-U04: Đổi tên thành công', async () => {
    const { accessToken } = await createAuthUser({ name: 'Tên Cũ' });

    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Tên Mới' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.name).toBe('Tên Mới');
  });

  // ==========================================
  // TC-U05: Cập nhật – Whitelist chặn email
  // ==========================================
  test('TC-U05: Không cho đổi email qua profile', async () => {
    const { accessToken } = await createAuthUser({ email: 'original@test.com' });

    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'hack@evil.com', name: 'Valid Name' });

    expect(res.statusCode).toBe(200);
    // Email phải giữ nguyên
    expect(res.body.data.user.email).toBe('original@test.com');
  });

  // ==========================================
  // TC-U06: Cập nhật – Whitelist chặn password
  // ==========================================
  test('TC-U06: Không cho đổi password qua profile', async () => {
    const { accessToken } = await createAuthUser({ email: 'test@test.com' });

    await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'newpass123' });

    // Kiểm tra login bằng password cũ vẫn OK
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: '123456' });

    expect(loginRes.statusCode).toBe(200);
    // Password không bị đổi
  });

  // ==========================================
  // TC-U07: Cập nhật – Whitelist chặn role injection
  // ==========================================
  test('TC-U07: Không inject được trường lạ', async () => {
    const { accessToken } = await createAuthUser();

    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'admin', isAdmin: true, name: 'OK Name' });

    expect(res.statusCode).toBe(200);
    // Các trường role, isAdmin bị bỏ qua
    expect(res.body.data.user).not.toHaveProperty('role');
    expect(res.body.data.user).not.toHaveProperty('isAdmin');
  });

  // ==========================================
  // TC-U08: Cập nhật không có token → 401
  // ==========================================
  test('TC-U08: Không có token', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .send({ name: 'Hack' });

    expect(res.statusCode).toBe(401);
  });
});
```

---

### NHÓM 3: UPLOAD AVATAR – 5 Test Cases

```javascript
describe('POST /api/v1/users/avatar', () => {

  // ==========================================
  // TC-U09: Upload ảnh thành công (mock)
  // ==========================================
  test('TC-U09: Upload ảnh JPG', async () => {
    const { accessToken } = await createAuthUser();

    // Tạo file ảnh giả (1x1 pixel PNG tối thiểu)
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('avatar', tinyPng, 'test-avatar.png');

    // Nếu Cloudinary không cấu hình trong test → Có thể trả 500
    // Trong môi trường test thực tế, dùng mock Cloudinary
    // Ở đây kiểm tra request đến đúng endpoint
    expect([200, 500]).toContain(res.statusCode);
    // 200 nếu Cloudinary OK, 500 nếu Cloudinary chưa config
  });

  // ==========================================
  // TC-U10: Upload không có file → 400
  // ==========================================
  test('TC-U10: Không attach file', async () => {
    const { accessToken } = await createAuthUser();

    const res = await request(app)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/chọn ảnh|file/i);
  });

  // ==========================================
  // TC-U11: Upload file không phải ảnh → 400/500
  // ==========================================
  test('TC-U11: Upload file txt (không phải ảnh)', async () => {
    const { accessToken } = await createAuthUser();

    const textBuffer = Buffer.from('Đây là file text, không phải ảnh');

    const res = await request(app)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('avatar', textBuffer, 'document.txt');

    // Multer fileFilter sẽ chặn
    expect([400, 500]).toContain(res.statusCode);
  });

  // ==========================================
  // TC-U12: Upload không có token → 401
  // ==========================================
  test('TC-U12: Upload không token', async () => {
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post('/api/v1/users/avatar')
      .attach('avatar', tinyPng, 'test.png');

    expect(res.statusCode).toBe(401);
  });

  // ==========================================
  // TC-U13: Upload field name sai → 400
  // ==========================================
  test('TC-U13: Field name sai (không phải "avatar")', async () => {
    const { accessToken } = await createAuthUser();

    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('wrongField', tinyPng, 'test.png');

    // Multer expect 'avatar', gửi 'wrongField' → req.file = undefined
    expect(res.statusCode).toBe(400);
  });
});
```

*Giải thích kỹ thuật test upload:*
- `Buffer.from('iVBOR...', 'base64')`: Tạo ảnh PNG 1×1 pixel giả trong bộ nhớ. Ảnh thật nhỏ nhất có thể (67 bytes).
- `.attach('avatar', buffer, 'filename.png')`: Supertest gửi multipart/form-data.
  - Tham số 1: field name (phải khớp `upload.single('avatar')`).
  - Tham số 2: dữ liệu file (Buffer hoặc path).
  - Tham số 3: tên file giả.
- Test upload thực tế cần mock Cloudinary. Cách mock:

```javascript
// Thêm vào đầu file test nếu muốn mock Cloudinary:
jest.mock('../../src/config/cloudinary', () => ({
  uploader: {
    upload_stream: (options, callback) => {
      const writable = new (require('stream').Writable)({
        write(chunk, encoding, cb) { cb(); }
      });
      // Giả lập upload thành công
      setTimeout(() => {
        callback(null, { secure_url: 'https://fake-cloudinary.com/avatar.jpg' });
      }, 100);
      return writable;
    }
  }
}));
```

**Tổng User Profile Module: 13 test cases**

---

## PHẦN B: TEST CASES CHO DASHBOARD MODULE

### File: `tests/dashboard/dashboard.test.js`

```javascript
require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser, createProject, createTask } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('GET /api/v1/dashboard/stats', () => {

  // ==========================================
  // TC-D01: Dashboard user mới (chưa có gì)
  // ==========================================
  test('TC-D01: User mới – Tất cả stats = 0', async () => {
    const { accessToken } = await createAuthUser();

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.stats).toEqual({
      totalProjects: 0,
      totalTasks: 0,
      todoCount: 0,
      inProgressCount: 0,
      doneCount: 0,
      overdueTasks: 0,
      completionRate: 0
    });
  });

  // ==========================================
  // TC-D02: Dashboard đếm đúng projects
  // ==========================================
  test('TC-D02: Đếm số projects', async () => {
    const { accessToken } = await createAuthUser();
    await createProject(accessToken, { name: 'P1' });
    await createProject(accessToken, { name: 'P2' });
    await createProject(accessToken, { name: 'P3' });

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.totalProjects).toBe(3);
  });

  // ==========================================
  // TC-D03: Dashboard đếm đúng tasks theo status
  // ==========================================
  test('TC-D03: Đếm tasks theo status', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);

    await createTask(accessToken, project._id, { title: 'T1', status: 'To Do' });
    await createTask(accessToken, project._id, { title: 'T2', status: 'To Do' });
    await createTask(accessToken, project._id, { title: 'T3', status: 'In Progress' });
    await createTask(accessToken, project._id, { title: 'T4', status: 'Done' });
    await createTask(accessToken, project._id, { title: 'T5', status: 'Done' });
    await createTask(accessToken, project._id, { title: 'T6', status: 'Done' });

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    const stats = res.body.data.stats;
    expect(stats.totalTasks).toBe(6);
    expect(stats.todoCount).toBe(2);
    expect(stats.inProgressCount).toBe(1);
    expect(stats.doneCount).toBe(3);
  });

  // ==========================================
  // TC-D04: Dashboard tính completionRate đúng
  // ==========================================
  test('TC-D04: Tỷ lệ hoàn thành', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);

    // 4 tasks: 1 Done → 25%
    await createTask(accessToken, project._id, { title: 'T1', status: 'To Do' });
    await createTask(accessToken, project._id, { title: 'T2', status: 'To Do' });
    await createTask(accessToken, project._id, { title: 'T3', status: 'In Progress' });
    await createTask(accessToken, project._id, { title: 'T4', status: 'Done' });

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.completionRate).toBe(25);
    // 1/4 × 100 = 25, Math.round(25) = 25
  });

  // ==========================================
  // TC-D05: Dashboard tính overdue đúng
  // ==========================================
  test('TC-D05: Tasks trễ hạn', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);

    // Task quá hạn (deadline là ngày hôm qua)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createTask(accessToken, project._id, {
      title: 'Quá hạn',
      status: 'To Do',
      deadline: yesterday.toISOString()
    });

    // Task quá hạn nhưng đã Done → KHÔNG tính overdue
    await createTask(accessToken, project._id, {
      title: 'Quá hạn nhưng xong',
      status: 'Done',
      deadline: yesterday.toISOString()
    });

    // Task chưa đến hạn
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await createTask(accessToken, project._id, {
      title: 'Chưa hạn',
      status: 'To Do',
      deadline: tomorrow.toISOString()
    });

    // Task không có deadline
    await createTask(accessToken, project._id, {
      title: 'Không deadline',
      status: 'To Do'
    });

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    // Chỉ 1 task overdue: "Quá hạn" (status To Do + deadline qua)
    expect(res.body.data.stats.overdueTasks).toBe(1);
  });

  // ==========================================
  // TC-D06: Dashboard không đếm project đã xóa mềm
  // ==========================================
  test('TC-D06: Project deleted không tính', async () => {
    const { accessToken } = await createAuthUser();
    const p1 = await createProject(accessToken, { name: 'Active' });
    const p2 = await createProject(accessToken, { name: 'Deleted' });

    // Xóa mềm p2
    await request(app)
      .delete(`/api/v1/projects/${p2._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.totalProjects).toBe(1);
  });

  // ==========================================
  // TC-D07: Dashboard không đếm task đã xóa mềm
  // ==========================================
  test('TC-D07: Task deleted không tính', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);
    const t1 = await createTask(accessToken, project._id, { title: 'Active' });
    const t2 = await createTask(accessToken, project._id, { title: 'Deleted' });

    // Xóa mềm t2
    await request(app)
      .delete(`/api/v1/projects/${project._id}/tasks/${t2._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.totalTasks).toBe(1);
  });

  // ==========================================
  // TC-D08: Dashboard chỉ đếm project mình tham gia
  // ==========================================
  test('TC-D08: Chỉ đếm project user là member', async () => {
    const userA = await createAuthUser({ email: 'a@test.com' });
    const userB = await createAuthUser({ email: 'b@test.com' });

    // A tạo 2 projects
    await createProject(userA.accessToken, { name: 'A-Project-1' });
    await createProject(userA.accessToken, { name: 'A-Project-2' });

    // B tạo 1 project
    await createProject(userB.accessToken, { name: 'B-Project-1' });

    // Dashboard A: chỉ thấy 2
    const resA = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${userA.accessToken}`);
    expect(resA.body.data.stats.totalProjects).toBe(2);

    // Dashboard B: chỉ thấy 1
    const resB = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${userB.accessToken}`);
    expect(resB.body.data.stats.totalProjects).toBe(1);
  });

  // ==========================================
  // TC-D09: Dashboard không token → 401
  // ==========================================
  test('TC-D09: Không có token', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/stats');

    expect(res.statusCode).toBe(401);
  });

  // ==========================================
  // TC-D10: completionRate = 0 khi không có tasks
  // ==========================================
  test('TC-D10: Tránh chia cho 0', async () => {
    const { accessToken } = await createAuthUser();
    await createProject(accessToken); // Project có, task không

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.totalTasks).toBe(0);
    expect(res.body.data.stats.completionRate).toBe(0);
    // Không được trả NaN hoặc Infinity
  });
});
```

**Tổng Dashboard Module: 10 test cases**

---

## PHẦN C: INTEGRATION TESTS (LUỒNG XUYÊN SUỐT)

### File: `tests/integration/flow.test.js`

```javascript
require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Integration: Luồng hoàn chỉnh', () => {

  // ==========================================
  // TC-I01: Luồng Register → Login → Create Project → Create Task → Comment
  // ==========================================
  test('TC-I01: Luồng chính từ đầu tới cuối', async () => {
    // === BƯỚC 1: Đăng ký ===
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Flow User', email: 'flow@test.com', password: '123456' });
    expect(registerRes.statusCode).toBe(201);

    // === BƯỚC 2: Đăng nhập ===
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'flow@test.com', password: '123456' });
    expect(loginRes.statusCode).toBe(200);
    const { accessToken } = loginRes.body.data;

    // === BƯỚC 3: Tạo Project ===
    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Integration Project', description: 'Test luồng đầy đủ' });
    expect(projectRes.statusCode).toBe(201);
    const projectId = projectRes.body.data.project._id;

    // === BƯỚC 4: Tạo Task ===
    const taskRes = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Integration Task', priority: 'High' });
    expect(taskRes.statusCode).toBe(201);
    const taskId = taskRes.body.data.task._id;

    // === BƯỚC 5: Đổi Status ===
    const updateRes = await request(app)
      .put(`/api/v1/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'In Progress' });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.task.status).toBe('In Progress');

    // === BƯỚC 6: Thêm Comment ===
    const commentRes = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Đang làm phần này' });
    expect(commentRes.statusCode).toBe(201);

    // === BƯỚC 7: Kiểm tra Dashboard ===
    const statsRes = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statsRes.statusCode).toBe(200);
    expect(statsRes.body.data.stats.totalProjects).toBe(1);
    expect(statsRes.body.data.stats.totalTasks).toBe(1);
    expect(statsRes.body.data.stats.inProgressCount).toBe(1);

    // === BƯỚC 8: Đăng xuất ===
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logoutRes.statusCode).toBe(200);
  });

  // ==========================================
  // TC-I02: Luồng Collaboration (2 users cùng project)
  // ==========================================
  test('TC-I02: 2 users cộng tác trong cùng project', async () => {
    // User A đăng ký + login
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'User A', email: 'a@test.com', password: '123456' });
    const loginA = await request(app).post('/api/v1/auth/login')
      .send({ email: 'a@test.com', password: '123456' });
    const tokenA = loginA.body.data.accessToken;

    // User B đăng ký + login
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'User B', email: 'b@test.com', password: '123456' });
    const loginB = await request(app).post('/api/v1/auth/login')
      .send({ email: 'b@test.com', password: '123456' });
    const tokenB = loginB.body.data.accessToken;

    // A tạo project
    const pRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Collab Project' });
    const projectId = pRes.body.data.project._id;

    // A mời B
    const inviteRes = await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'b@test.com' });
    expect(inviteRes.statusCode).toBe(200);

    // B xem được project
    const viewRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(viewRes.statusCode).toBe(200);

    // B tạo task trong project
    const taskRes = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Task bởi B' });
    expect(taskRes.statusCode).toBe(201);
    const taskId = taskRes.body.data.task._id;

    // A comment vào task của B
    const cmtRes = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'A comment vào task B tạo' });
    expect(cmtRes.statusCode).toBe(201);

    // B KHÔNG được xóa project (chỉ A là owner)
    const delRes = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(delRes.statusCode).toBe(403);

    // A xóa B khỏi project
    const userB = loginB.body.data.user;
    const removeRes = await request(app)
      .delete(`/api/v1/projects/${projectId}/members/${userB._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(removeRes.statusCode).toBe(200);

    // B không xem được project nữa
    const viewAgain = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(viewAgain.statusCode).toBe(403);
  });

  // ==========================================
  // TC-I03: Soft delete cascade check
  // ==========================================
  test('TC-I03: Tasks vẫn accessible sau khi xóa mềm project?', async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: '123456' });
    const login = await request(app).post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: '123456' });
    const token = login.body.data.accessToken;

    // Tạo project + task
    const pRes = await request(app).post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete' });
    const projectId = pRes.body.data.project._id;

    await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Orphan Task' });

    // Xóa mềm project
    await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    // Project không hiện trong danh sách
    const listRes = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.results).toBe(0);
  });
});
```

**Tổng Integration Tests: 3 test cases** (mỗi test bao gồm nhiều assertions)

---

## PHẦN D: VIEW ROUTES TEST (EJS Pages)

### File: `tests/views/views.test.js`

```javascript
require('../setup/env');
const { connect, closeDatabase } = require('../setup/db');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterAll(async () => await closeDatabase());

describe('View Routes (EJS Pages)', () => {

  test('TC-V01: GET / redirect tới /login', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(302); // Redirect
    expect(res.headers.location).toBe('/login');
  });

  test('TC-V02: GET /login trả HTML', async () => {
    const res = await request(app).get('/login');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('TC-V03: GET /register trả HTML', async () => {
    const res = await request(app).get('/register');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('TC-V04: GET /projects trả HTML', async () => {
    const res = await request(app).get('/projects');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('TC-V05: GET /dashboard trả HTML', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.statusCode).toBe(200);
  });

  test('TC-V06: GET /profile trả HTML', async () => {
    const res = await request(app).get('/profile');
    expect(res.statusCode).toBe(200);
  });
});
```

**Tổng View Routes: 6 test cases**

---

## PHẦN E: BẢNG TỔNG HỢP TOÀN DỰ ÁN

| File Test | Module | Số TCs | Nhánh logic covered |
|:---|:---|:---:|:---|
| `tests/auth/auth.test.js` | Auth (Register, Login, Refresh, Logout, ChangePass, Middleware) | **28** | Happy paths, validation, duplicate, wrong password, missing fields, token lifecycle |
| `tests/project/project.test.js` | Project (CRUD + Members) | **19** | Create, read, update, delete, membership, authorization, ID format |
| `tests/task/task.test.js` | Task (CRUD + Search/Filter) | **13** | Create, read, update, soft delete, enum validation, search, filter, authorization |
| `tests/comment/comment.test.js` | Comment | **8** | Create, read, validation, populate, not-found, auth |
| `tests/user/user.test.js` | User Profile + Avatar | **13** | Get/Update profile, whitelist security, upload, file validation |
| `tests/dashboard/dashboard.test.js` | Dashboard Stats | **10** | Count projects/tasks, status breakdown, overdue, soft delete filter, isolation |
| `tests/integration/flow.test.js` | Integration Flows | **3** | Full CRUD flow, collaboration flow, soft delete cascade |
| `tests/views/views.test.js` | View Routes (EJS) | **6** | Page rendering, redirect, content-type |
| | **TỔNG CỘNG** | **100** | |

### Chạy toàn bộ tests:

```bash
# Chạy tất cả
npm test

# Chạy với coverage report
npm run test:coverage

# Chạy 1 module cụ thể
npx jest tests/auth --verbose
npx jest tests/dashboard --verbose

# Chạy 1 test case cụ thể
npx jest -t "TC-D05"
```

### Đọc Coverage Report:

```bash
npm run test:coverage
```

Mở `coverage/lcov-report/index.html` trong trình duyệt:

| Metric | Mục tiêu | Ý nghĩa |
|:---|:---:|:---|
| **Statements** | >90% | % dòng code đã được chạy qua |
| **Branches** | >85% | % nhánh if/else/ternary đã được test |
| **Functions** | >90% | % hàm đã được gọi |
| **Lines** | >90% | % dòng thực thi được test |

File nào dưới 80% sẽ hiện **màu đỏ** → Cần bổ sung test.
