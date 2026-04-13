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
