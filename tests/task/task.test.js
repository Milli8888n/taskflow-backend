require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser, createProject, createTask } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Task CRUD', () => {

  let owner, project;
  beforeEach(async () => {
    owner = await createAuthUser({ email: `owner-${Date.now()}@test.com` });
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
    const stranger = await createAuthUser({ email: `stranger-${Date.now()}@test.com` });

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
