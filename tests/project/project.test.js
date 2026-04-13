require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser, createProject } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

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
