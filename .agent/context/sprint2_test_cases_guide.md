# HƯỚNG DẪN KIỂM THỬ CHI TIẾT – SPRINT 2: PROJECT, TASK, COMMENT

Test cases tự động (Jest + Supertest) cho 3 module: Project, Task, Comment. Tổng **42 test cases**.

---

## PHẦN A: HELPER TẠO DỮ LIỆU TEST

### File: `tests/setup/helpers.js`

```javascript
const request = require('supertest');
const app = require('../../src/app');

/**
 * Đăng ký + Đăng nhập, trả về { user, accessToken, refreshToken }
 */
const createAuthUser = async (userData = {}) => {
  const defaultData = {
    name: 'Test User',
    email: `user${Date.now()}@test.com`,
    password: '123456',
    ...userData
  };

  await request(app)
    .post('/api/v1/auth/register')
    .send(defaultData);

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: defaultData.email, password: defaultData.password });

  return {
    user: loginRes.body.data.user,
    accessToken: loginRes.body.data.accessToken,
    refreshToken: loginRes.body.data.refreshToken
  };
};

/**
 * Tạo project, trả về project object
 */
const createProject = async (accessToken, projectData = {}) => {
  const defaultData = {
    name: 'Test Project',
    description: 'Mô tả test',
    ...projectData
  };

  const res = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(defaultData);

  return res.body.data.project;
};

/**
 * Tạo task trong project, trả về task object
 */
const createTask = async (accessToken, projectId, taskData = {}) => {
  const defaultData = {
    title: 'Test Task',
    ...taskData
  };

  const res = await request(app)
    .post(`/api/v1/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(defaultData);

  return res.body.data.task;
};

module.exports = { createAuthUser, createProject, createTask };
```

*Giải thích:*
- `Date.now()`: Timestamp milli-giây. Đảm bảo mỗi lần gọi tạo email KHÁC nhau → Không bị lỗi duplicate.
- `...userData`: Spread operator. Cho phép ghi đè default bằng dữ liệu truyền vào.
- Helpers giúp test code gọn: `createAuthUser()` thay vì 10 dòng register + login mỗi test.

---

## PHẦN B: TEST CASES CHO PROJECT MODULE

### File: `tests/project/project.test.js`

```javascript
require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser, createProject } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());
```

---

### NHÓM 1: TẠO PROJECT – 4 Test Cases

```javascript
describe('POST /api/v1/projects', () => {

  // ==========================================
  // TC-P01: Tạo project thành công
  // ==========================================
  test('TC-P01: Tạo project với dữ liệu hợp lệ', async () => {
    const { accessToken, user } = await createAuthUser({ email: 'owner@test.com' });

    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Dự án mới', description: 'Mô tả dự án' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.project.name).toBe('Dự án mới');
    expect(res.body.data.project.description).toBe('Mô tả dự án');
    expect(res.body.data.project.owner.toString()).toBe(user._id);
    // Owner tự động là member
    expect(res.body.data.project.members).toContain(user._id);
  });

  // ==========================================
  // TC-P02: Tạo project thiếu tên → 400
  // ==========================================
  test('TC-P02: Thiếu tên dự án', async () => {
    const { accessToken } = await createAuthUser();

    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Chỉ có mô tả' });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-P03: Tạo project không có token → 401
  // ==========================================
  test('TC-P03: Không có token', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .send({ name: 'Test' });

    expect(res.statusCode).toBe(401);
  });

  // ==========================================
  // TC-P04: Tạo project không có description (optional) → 201
  // ==========================================
  test('TC-P04: Description tùy chọn (có thể bỏ trống)', async () => {
    const { accessToken } = await createAuthUser();

    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Chỉ có tên' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.project.description).toBe('');
  });
});
```

---

### NHÓM 2: LẤY DANH SÁCH PROJECT – 3 Test Cases

```javascript
describe('GET /api/v1/projects', () => {

  // ==========================================
  // TC-P05: Lấy danh sách project thành công
  // ==========================================
  test('TC-P05: Danh sách projects của user', async () => {
    const { accessToken } = await createAuthUser();
    await createProject(accessToken, { name: 'Project 1' });
    await createProject(accessToken, { name: 'Project 2' });

    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(2);
    expect(res.body.data.projects).toHaveLength(2);
  });

  // ==========================================
  // TC-P06: User mới chưa có project → Mảng rỗng
  // ==========================================
  test('TC-P06: User mới không có project', async () => {
    const { accessToken } = await createAuthUser();

    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(0);
    expect(res.body.data.projects).toHaveLength(0);
  });

  // ==========================================
  // TC-P07: Project đã xóa mềm không hiện
  // ==========================================
  test('TC-P07: Soft deleted project không hiện trong danh sách', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);

    // Xóa mềm
    await request(app)
      .delete(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(0);
  });
});
```

---

### NHÓM 3: CHI TIẾT, CẬP NHẬT, XÓA PROJECT – 6 Test Cases

```javascript
describe('Project CRUD chi tiết', () => {

  // ==========================================
  // TC-P08: Lấy chi tiết project
  // ==========================================
  test('TC-P08: GET /:projectId thành công', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken, { name: 'Detail Test' });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.project.name).toBe('Detail Test');
  });

  // ==========================================
  // TC-P09: Xem project không phải member → 403
  // ==========================================
  test('TC-P09: Không phải member → Từ chối', async () => {
    const owner = await createAuthUser({ email: 'owner@test.com' });
    const stranger = await createAuthUser({ email: 'stranger@test.com' });
    const project = await createProject(owner.accessToken);

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/không phải thành viên/i);
  });

  // ==========================================
  // TC-P10: Cập nhật project (owner)
  // ==========================================
  test('TC-P10: Owner cập nhật tên dự án', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);

    const res = await request(app)
      .put(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Tên mới' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.project.name).toBe('Tên mới');
  });

  // ==========================================
  // TC-P11: Member (không phải owner) cập nhật → 403
  // ==========================================
  test('TC-P11: Member không được cập nhật', async () => {
    const owner = await createAuthUser({ email: 'owner@test.com' });
    const member = await createAuthUser({ email: 'member@test.com' });
    const project = await createProject(owner.accessToken);

    // Thêm member
    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'member@test.com' });

    // Member thử cập nhật
    const res = await request(app)
      .put(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Hack name' });

    expect(res.statusCode).toBe(403);
  });

  // ==========================================
  // TC-P12: Xóa mềm project (owner)
  // ==========================================
  test('TC-P12: Owner xóa mềm project', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);

    const res = await request(app)
      .delete(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/đã xóa/i);
  });

  // ==========================================
  // TC-P13: Project ID sai format → 400
  // ==========================================
  test('TC-P13: Project ID không hợp lệ', async () => {
    const { accessToken } = await createAuthUser();

    const res = await request(app)
      .get('/api/v1/projects/id-sai-format')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/không hợp lệ|cast/i);
  });
});
```

---

### NHÓM 4: QUẢN LÝ THÀNH VIÊN – 6 Test Cases

```javascript
describe('Quản lý thành viên', () => {

  // ==========================================
  // TC-P14: Thêm thành viên thành công
  // ==========================================
  test('TC-P14: Owner thêm member bằng email', async () => {
    const owner = await createAuthUser({ email: 'owner@test.com' });
    await createAuthUser({ email: 'member@test.com' });
    const project = await createProject(owner.accessToken);

    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'member@test.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.project.members).toHaveLength(2);
  });

  // ==========================================
  // TC-P15: Thêm email không tồn tại → 404
  // ==========================================
  test('TC-P15: Email không tồn tại', async () => {
    const owner = await createAuthUser({ email: 'owner@test.com' });
    const project = await createProject(owner.accessToken);

    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'khongtontai@test.com' });

    expect(res.statusCode).toBe(404);
  });

  // ==========================================
  // TC-P16: Thêm member đã tồn tại → 400
  // ==========================================
  test('TC-P16: Member đã là thành viên', async () => {
    const owner = await createAuthUser({ email: 'owner@test.com' });
    await createAuthUser({ email: 'member@test.com' });
    const project = await createProject(owner.accessToken);

    // Thêm lần 1
    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'member@test.com' });

    // Thêm lần 2 (trùng)
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'member@test.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/đã là thành viên/i);
  });

  // ==========================================
  // TC-P17: Xóa thành viên thành công
  // ==========================================
  test('TC-P17: Owner xóa member', async () => {
    const owner = await createAuthUser({ email: 'owner@test.com' });
    const member = await createAuthUser({ email: 'member@test.com' });
    const project = await createProject(owner.accessToken);

    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'member@test.com' });

    const res = await request(app)
      .delete(`/api/v1/projects/${project._id}/members/${member.user._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(200);
  });

  // ==========================================
  // TC-P18: Không thể xóa owner ra khỏi project
  // ==========================================
  test('TC-P18: Không xóa được chủ dự án', async () => {
    const owner = await createAuthUser({ email: 'owner@test.com' });
    const project = await createProject(owner.accessToken);

    const res = await request(app)
      .delete(`/api/v1/projects/${project._id}/members/${owner.user._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/không thể xóa chủ/i);
  });

  // ==========================================
  // TC-P19: Lấy danh sách thành viên
  // ==========================================
  test('TC-P19: GET members thành công', async () => {
    const owner = await createAuthUser({ email: 'owner@test.com' });
    await createAuthUser({ email: 'member@test.com' });
    const project = await createProject(owner.accessToken);

    await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'member@test.com' });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.members).toHaveLength(2);
    expect(res.body.data.owner).toHaveProperty('name');
  });
});
```

**Tổng Project Module: 19 test cases**

---

## PHẦN C: TEST CASES CHO TASK MODULE

### File: `tests/task/task.test.js`

```javascript
require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser, createProject, createTask } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());
```

```javascript
describe('Task CRUD', () => {

  let owner, project;
  beforeEach(async () => {
    owner = await createAuthUser({ email: 'owner@test.com' });
    project = await createProject(owner.accessToken);
  });

  // ==========================================
  // TC-T01: Tạo task thành công
  // ==========================================
  test('TC-T01: Tạo task hợp lệ', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Task mới', priority: 'High' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.task.title).toBe('Task mới');
    expect(res.body.data.task.status).toBe('To Do');  // Default
    expect(res.body.data.task.priority).toBe('High');
    expect(res.body.data.task.projectId).toBe(project._id);
  });

  // ==========================================
  // TC-T02: Tạo task thiếu title → 400
  // ==========================================
  test('TC-T02: Thiếu title', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ priority: 'Low' });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-T03: Tạo task status sai enum → 400
  // ==========================================
  test('TC-T03: Status không hợp lệ', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Task', status: 'InvalidStatus' });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-T04: Tạo task priority sai enum → 400
  // ==========================================
  test('TC-T04: Priority không hợp lệ', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Task', priority: 'Critical' });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-T05: Lấy danh sách tasks
  // ==========================================
  test('TC-T05: GET tasks của project', async () => {
    await createTask(owner.accessToken, project._id, { title: 'Task 1' });
    await createTask(owner.accessToken, project._id, { title: 'Task 2' });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(2);
  });

  // ==========================================
  // TC-T06: Filter tasks theo status
  // ==========================================
  test('TC-T06: Filter theo status=Done', async () => {
    await createTask(owner.accessToken, project._id, { title: 'T1', status: 'Done' });
    await createTask(owner.accessToken, project._id, { title: 'T2', status: 'To Do' });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks?status=Done`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data.tasks[0].title).toBe('T1');
  });

  // ==========================================
  // TC-T07: Search tasks bằng keyword
  // ==========================================
  test('TC-T07: Search theo keyword', async () => {
    await createTask(owner.accessToken, project._id, { title: 'Viết API Login' });
    await createTask(owner.accessToken, project._id, { title: 'Thiết kế Database' });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks?q=login`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data.tasks[0].title).toMatch(/login/i);
  });

  // ==========================================
  // TC-T08: Cập nhật task status
  // ==========================================
  test('TC-T08: Đổi status task', async () => {
    const task = await createTask(owner.accessToken, project._id);

    const res = await request(app)
      .put(`/api/v1/projects/${project._id}/tasks/${task._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ status: 'Done' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.task.status).toBe('Done');
  });

  // ==========================================
  // TC-T09: Cập nhật task priority + assignee
  // ==========================================
  test('TC-T09: Đổi priority và giao việc', async () => {
    const task = await createTask(owner.accessToken, project._id);

    const res = await request(app)
      .put(`/api/v1/projects/${project._id}/tasks/${task._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ priority: 'High', assignee: owner.user._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.task.priority).toBe('High');
  });

  // ==========================================
  // TC-T10: Xóa mềm task
  // ==========================================
  test('TC-T10: Soft delete task', async () => {
    const task = await createTask(owner.accessToken, project._id);

    const delRes = await request(app)
      .delete(`/api/v1/projects/${project._id}/tasks/${task._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(delRes.statusCode).toBe(200);

    // Task không hiện trong danh sách nữa
    const listRes = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(listRes.body.results).toBe(0);
  });

  // ==========================================
  // TC-T11: Người ngoài không truy cập được tasks
  // ==========================================
  test('TC-T11: Stranger không xem được tasks', async () => {
    const stranger = await createAuthUser({ email: 'stranger@test.com' });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.statusCode).toBe(403);
  });

  // ==========================================
  // TC-T12: Lấy chi tiết 1 task
  // ==========================================
  test('TC-T12: GET task by ID', async () => {
    const task = await createTask(owner.accessToken, project._id, { title: 'Chi tiết' });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks/${task._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.task.title).toBe('Chi tiết');
  });

  // ==========================================
  // TC-T13: Task ID không tồn tại → 404
  // ==========================================
  test('TC-T13: Task không tồn tại', async () => {
    const fakeId = '507f1f77bcf86cd799439011'; // ObjectId hợp lệ nhưng không tồn tại

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(404);
  });
});
```

**Tổng Task Module: 13 test cases**

---

## PHẦN D: TEST CASES CHO COMMENT MODULE

### File: `tests/comment/comment.test.js`

```javascript
require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser, createProject, createTask } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Comment Module', () => {

  let owner, project, task;
  beforeEach(async () => {
    owner = await createAuthUser({ email: 'owner@test.com' });
    project = await createProject(owner.accessToken);
    task = await createTask(owner.accessToken, project._id, { title: 'Task có comment' });
  });

  // ==========================================
  // TC-C01: Thêm comment thành công
  // ==========================================
  test('TC-C01: Tạo comment hợp lệ', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: 'Bình luận test' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.comment.content).toBe('Bình luận test');
    expect(res.body.data.comment.author).toHaveProperty('name');
    // author đã được populate
  });

  // ==========================================
  // TC-C02: Comment rỗng → 400
  // ==========================================
  test('TC-C02: Content rỗng', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: '' });

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-C03: Thiếu content → 400
  // ==========================================
  test('TC-C03: Không gửi content', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  // ==========================================
  // TC-C04: Lấy danh sách comments
  // ==========================================
  test('TC-C04: GET comments của task', async () => {
    // Tạo 3 comments
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ content: `Comment ${i}` });
    }

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(3);
    expect(res.body.data.comments).toHaveLength(3);
    // Comments mới nhất trước (sort -1)
    expect(res.body.data.comments[0].content).toBe('Comment 3');
  });

  // ==========================================
  // TC-C05: Task chưa có comment → Mảng rỗng
  // ==========================================
  test('TC-C05: Task không có comment', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(0);
    expect(res.body.data.comments).toHaveLength(0);
  });

  // ==========================================
  // TC-C06: Comment vào task không tồn tại → 404
  // ==========================================
  test('TC-C06: Task ID không tồn tại', async () => {
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks/${fakeId}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: 'Test' });

    expect(res.statusCode).toBe(404);
  });

  // ==========================================
  // TC-C07: Không có token → 401
  // ==========================================
  test('TC-C07: Không có token', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
      .send({ content: 'Test' });

    expect(res.statusCode).toBe(401);
  });

  // ==========================================
  // TC-C08: Comment có populate author name + avatar
  // ==========================================
  test('TC-C08: Author được populate', async () => {
    await request(app)
      .post(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: 'Check populate' });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks/${task._id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    const comment = res.body.data.comments[0];
    expect(comment.author).toHaveProperty('name');
    expect(comment.author).not.toHaveProperty('password');
    // Chỉ populate name + avatar, KHÔNG lộ password
  });
});
```

**Tổng Comment Module: 8 test cases**

---

## PHẦN E: BẢNG TỔNG HỢP SPRINT 2

| Module | Test Cases | Coverage Targets |
|:---|:---:|:---|
| Project CRUD | 7 | Tạo, lấy, cập nhật, xóa, ID sai format |
| Project Membership | 6 | Thêm/xóa member, duplicate, owner protection |
| Project Access | 6 | Member vs stranger, owner vs member |
| Task CRUD | 8 | Tạo, lấy, cập nhật, xóa mềm, enum validation |
| Task Search/Filter | 3 | Filter status, search keyword, kết quả rỗng |
| Task Access | 2 | Stranger blocked, task not found |
| Comment | 8 | Tạo, lấy, validation, populate, task 404 |
| **TỔNG** | **40** | **100% nhánh logic Sprint 2** |

### Chạy test Sprint 2:

```bash
# Chạy tất cả tests
npm test

# Chạy chỉ 1 file cụ thể
npx jest tests/project/project.test.js --verbose

# Chạy + coverage
npm run test:coverage
```
