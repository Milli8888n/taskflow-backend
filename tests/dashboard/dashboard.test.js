require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser, createProject, createTask } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('GET /api/v1/dashboard/stats', () => {

  // TC-D01: Dashboard user mới (chưa có gì)
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

  // TC-D02: Dashboard đếm đúng projects
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

  // TC-D03: Dashboard đếm đúng tasks theo status
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

  // TC-D04: Dashboard tính completionRate đúng
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
  });

  // TC-D05: Dashboard tính overdue đúng
  test('TC-D05: Tasks trễ hạn', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createTask(accessToken, project._id, {
      title: 'Quá hạn',
      status: 'To Do',
      deadline: yesterday.toISOString()
    });

    await createTask(accessToken, project._id, {
      title: 'Quá hạn nhưng xong',
      status: 'Done',
      deadline: yesterday.toISOString()
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await createTask(accessToken, project._id, {
      title: 'Chưa hạn',
      status: 'To Do',
      deadline: tomorrow.toISOString()
    });

    await createTask(accessToken, project._id, {
      title: 'Không deadline',
      status: 'To Do'
    });

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.overdueTasks).toBe(1);
  });

  // TC-D06: Dashboard không đếm project đã xóa mềm
  test('TC-D06: Project deleted không tính', async () => {
    const { accessToken } = await createAuthUser();
    const p1 = await createProject(accessToken, { name: 'Active' });
    const p2 = await createProject(accessToken, { name: 'Deleted' });

    await request(app)
      .delete(`/api/v1/projects/${p2._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.totalProjects).toBe(1);
  });

  // TC-D07: Dashboard không đếm task đã xóa mềm
  test('TC-D07: Task deleted không tính', async () => {
    const { accessToken } = await createAuthUser();
    const project = await createProject(accessToken);
    const t1 = await createTask(accessToken, project._id, { title: 'Active' });
    const t2 = await createTask(accessToken, project._id, { title: 'Deleted' });

    await request(app)
      .delete(`/api/v1/projects/${project._id}/tasks/${t2._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.totalTasks).toBe(1);
  });

  // TC-D08: Dashboard chỉ đếm project mình tham gia
  test('TC-D08: Chỉ đếm project user là member', async () => {
    const userA = await createAuthUser({ email: 'a@test.com' });
    const userB = await createAuthUser({ email: 'b@test.com' });

    await createProject(userA.accessToken, { name: 'A-Project-1' });
    await createProject(userA.accessToken, { name: 'A-Project-2' });

    await createProject(userB.accessToken, { name: 'B-Project-1' });

    const resA = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${userA.accessToken}`);
    expect(resA.body.data.stats.totalProjects).toBe(2);

    const resB = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${userB.accessToken}`);
    expect(resB.body.data.stats.totalProjects).toBe(1);
  });

  // TC-D09: Dashboard không token → 401
  test('TC-D09: Không có token', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/stats');
    expect(res.statusCode).toBe(401);
  });

  // TC-D10: completionRate = 0 khi không có tasks
  test('TC-D10: Tránh chia cho 0', async () => {
    const { accessToken } = await createAuthUser();
    await createProject(accessToken);

    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.stats.totalTasks).toBe(0);
    expect(res.body.data.stats.completionRate).toBe(0);
  });
});
