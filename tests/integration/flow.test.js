require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Integration: Luồng hoàn chỉnh', () => {

  // TC-I01: Luồng Register → Login → Create Project → Create Task → Comment
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

  // TC-I02: Luồng Collaboration (2 users cùng project)
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

  // TC-I03: Soft delete cascade check
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
    
    // Check lengths, assuming there are no other projects we could just check finding is 0. 
    // In our test context DB is cleared, so indeed it's 0.
    expect(listRes.body.results).toBe(0);
  });
});
