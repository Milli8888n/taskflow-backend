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
    owner = await createAuthUser({ email: `owner-${Date.now()}@test.com` });
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
