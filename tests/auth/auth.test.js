// ===== IMPORT SETUP =====
require('../setup/env');          // Set biến môi trường TRƯỚC
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/userModel');

// ===== LIFECYCLE HOOKS =====
beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await closeDatabase();
});

// ==========================================
// NHÓM 1: ĐĂNG KÝ (Register) – 8 Test Cases
// ==========================================
describe('POST /api/v1/auth/register', () => {
    test('TC-R01: Đăng ký thành công', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Nguyễn Văn A',
                email: 'a@test.com',
                password: '123456'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data.user).toHaveProperty('name', 'Nguyễn Văn A');
        expect(res.body.data.user).not.toHaveProperty('password');

        const userInDb = await User.findOne({ email: 'a@test.com' }).select('+password');
        expect(userInDb).toBeTruthy();
        expect(userInDb.password).toMatch(/^\$2b\$/);
    });

    test('TC-R02: Email đã tồn tại', async () => {
        await User.create({ name: 'User1', email: 'a@test.com', password: '123456' });

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

    test('TC-R03: Thiếu trường name', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'test@test.com', password: '123456' });
        expect(res.statusCode).toBe(400);
    });

    test('TC-R04: Thiếu trường email', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Test User', password: '123456' });
        expect(res.statusCode).toBe(400);
    });

    test('TC-R05: Thiếu trường password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Test User', email: 'test@test.com' });
        expect(res.statusCode).toBe(400);
    });

    test('TC-R06: Email không hợp lệ', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Test User', email: 'khong-phai-email', password: '123456' });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/email|không hợp lệ/i);
    });

    test('TC-R07: Password dưới 6 ký tự', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Test User', email: 'test@test.com', password: '123' });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/6 ký tự|6 characters/i);
    });

    test('TC-R08: Email tự động chuyển lowercase', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Test', email: 'TEST@Gmail.COM', password: '123456' });
        expect(res.statusCode).toBe(201);
        expect(res.body.data.user.email).toBe('test@gmail.com');
    });
});

// ==========================================
// NHÓM 2: ĐĂNG NHẬP (Login) – 6 Test Cases
// ==========================================
describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
        await User.create({ name: 'Login User', email: 'login@test.com', password: '123456' });
    });

    test('TC-L01: Đăng nhập thành công', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'login@test.com', password: '123456' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
        expect(res.body.data.user).toHaveProperty('name', 'Login User');
    });

    test('TC-L02: Email không tồn tại', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'khongtontai@test.com', password: '123456' });
        expect(res.statusCode).toBe(404);
    });

    test('TC-L03: Sai mật khẩu', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'login@test.com', password: 'saimatkhau' });
        expect(res.statusCode).toBe(401);
    });

    test('TC-L04: Không gửi email', async () => {
        const res = await request(app).post('/api/v1/auth/login').send({ password: '123456' });
        expect(res.statusCode).toBe(400);
    });

    test('TC-L05: Không gửi password', async () => {
        const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.com' });
        expect(res.statusCode).toBe(400);
    });

    test('TC-L06: Body rỗng', async () => {
        const res = await request(app).post('/api/v1/auth/login').send({});
        expect(res.statusCode).toBe(400);
    });
});

// ==========================================
// NHÓM 3: REFRESH TOKEN – 4 Test Cases
// ==========================================
describe('POST /api/v1/auth/refresh-token', () => {
    let tokens;
    beforeEach(async () => {
        await request(app).post('/api/v1/auth/register')
            .send({ name: 'Test', email: 'test@test.com', password: '123456' });
        const loginRes = await request(app).post('/api/v1/auth/login')
            .send({ email: 'test@test.com', password: '123456' });
        tokens = loginRes.body.data;
    });

    test('TC-RF01: Refresh token hợp lệ', async () => {
        const res = await request(app).post('/api/v1/auth/refresh-token')
            .send({ refreshToken: tokens.refreshToken });
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('accessToken');
    });

    test('TC-RF02: Refresh token không hợp lệ', async () => {
        const res = await request(app).post('/api/v1/auth/refresh-token')
            .send({ refreshToken: 'fake-token-invalid' });
        expect(res.statusCode).toBe(401);
    });

    test('TC-RF03: Thiếu refresh token', async () => {
        const res = await request(app).post('/api/v1/auth/refresh-token').send({});
        expect(res.statusCode).toBe(400);
    });

    test('TC-RF04: Token đã bị thu hồi (đã logout)', async () => {
        // Logout trước để xóa refreshToken khỏi DB
        await request(app).post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${tokens.accessToken}`);
        // Thử refresh với token cũ → phải bị từ chối
        const res = await request(app).post('/api/v1/auth/refresh-token')
            .send({ refreshToken: tokens.refreshToken });
        expect(res.statusCode).toBe(403);
    });
});

// ==========================================
// NHÓM 4: MIDDLEWARE PROTECT – 5 Test Cases
// ==========================================
describe('Auth Middleware (protect)', () => {
    let accessToken;
    beforeEach(async () => {
        await request(app).post('/api/v1/auth/register')
            .send({ name: 'Test', email: 'test@test.com', password: '123456' });
        const loginRes = await request(app).post('/api/v1/auth/login')
            .send({ email: 'test@test.com', password: '123456' });
        accessToken = loginRes.body.data.accessToken;
    });

    test('TC-M01: Request với token hợp lệ', async () => {
        const res = await request(app).get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('TC-M02: Request không có token', async () => {
        const res = await request(app).get('/api/v1/auth/me');
        expect(res.statusCode).toBe(401);
    });

    test('TC-M03: Token giả mạo', async () => {
        const res = await request(app).get('/api/v1/auth/me')
            .set('Authorization', 'Bearer fake-token-xyz');
        expect(res.statusCode).toBe(401);
    });

    test('TC-M04: Thiếu prefix Bearer', async () => {
        const res = await request(app).get('/api/v1/auth/me')
            .set('Authorization', accessToken);
        expect(res.statusCode).toBe(401);
    });

    test('TC-M05: Route không tồn tại', async () => {
        const res = await request(app).get('/api/v1/khong-ton-tai');
        expect(res.statusCode).toBe(404);
    });
});

// ==========================================
// NHÓM 5: ĐĂNG XUẤT + ĐỔI MẬT KHẨU – 5 Test Cases
// ==========================================
describe('Logout and Password Changes', () => {
    let accessToken;
    beforeEach(async () => {
        await request(app).post('/api/v1/auth/register')
            .send({ name: 'Test', email: 'test@test.com', password: '123456' });
        const loginRes = await request(app).post('/api/v1/auth/login')
            .send({ email: 'test@test.com', password: '123456' });
        accessToken = loginRes.body.data.accessToken;
    });

    test('TC-LO01: Đăng xuất thành công', async () => {
        const res = await request(app).post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

    test('TC-LO02: Đăng xuất không có token → 401', async () => {
        const res = await request(app).post('/api/v1/auth/logout');
        expect(res.statusCode).toBe(401);
    });

    test('TC-CP01: Đổi mật khẩu thành công', async () => {
        const res = await request(app).put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ currentPassword: '123456', newPassword: 'newpass123' });
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
    });

    test('TC-CP02: Đổi mật khẩu – Sai mật khẩu cũ', async () => {
        const res = await request(app).put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ currentPassword: 'saimatkhau', newPassword: 'newpass123' });
        expect(res.statusCode).toBe(401);
    });

    test('TC-CP03: Đổi mật khẩu – Thiếu trường bắt buộc', async () => {
        const res = await request(app).put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ currentPassword: '123456' });
        expect(res.statusCode).toBe(400);
    });
});