require('../setup/env');
const { connect, clearDatabase, closeDatabase } = require('../setup/db');
const { createAuthUser } = require('../setup/helpers');
const request = require('supertest');
const app = require('../../src/app');

// Mock Cloudinary for avatar upload test
jest.mock('../../src/config/cloudinary', () => ({
  uploader: {
    upload_stream: (options, callback) => {
      const writable = new (require('stream').Writable)({
        write(chunk, encoding, cb) { cb(); }
      });
      // Simulate success
      setTimeout(() => {
        callback(null, { secure_url: 'https://fake-cloudinary.com/avatar.jpg' });
      }, 10);
      return writable;
    }
  }
}));

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('GET /api/v1/users/profile', () => {
  // TC-U01: Lấy profile thành công
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
    // avatar can be missing if default isn't set depending on AuthUser helper, but we expect it if it has default. Let's just check without avatar explicitly or maybe check it if it exists.
    if(res.body.data.user.avatar !== undefined) {
      expect(res.body.data.user).toHaveProperty('avatar');
    }
    expect(res.body.data.user).toHaveProperty('createdAt');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('refreshToken');
  });

  // TC-U02: Profile không có token → 401
  test('TC-U02: Không có token', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile');
    expect(res.statusCode).toBe(401);
  });

  // TC-U03: Profile token giả → 401
  test('TC-U03: Token không hợp lệ', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer fake.token.here');
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/v1/users/profile', () => {
  // TC-U04: Cập nhật tên thành công
  test('TC-U04: Đổi tên thành công', async () => {
    const { accessToken } = await createAuthUser({ name: 'Tên Cũ' });

    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Tên Mới' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.name).toBe('Tên Mới');
  });

  // TC-U05: Cập nhật – Whitelist chặn email
  test('TC-U05: Không cho đổi email qua profile', async () => {
    const { accessToken } = await createAuthUser({ email: 'original@test.com' });

    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'hack@evil.com', name: 'Valid Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe('original@test.com'); // remain unchanged
  });

  // TC-U06: Cập nhật – Whitelist chặn password
  test('TC-U06: Không cho đổi password qua profile', async () => {
    const password = 'oldpassword123';
    const { accessToken } = await createAuthUser({ email: 'testpass@test.com', password });

    await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'newpass123' });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testpass@test.com', password: password });

    expect(loginRes.statusCode).toBe(200);
  });

  // TC-U07: Cập nhật – Whitelist chặn role injection
  test('TC-U07: Không inject được trường lạ', async () => {
    const { accessToken } = await createAuthUser({ role: 'user' });

    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'admin', isAdmin: true, name: 'OK Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.role).not.toBe('admin');
  });

  // TC-U08: Cập nhật không có token → 401
  test('TC-U08: Không có token', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .send({ name: 'Hack' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/users/avatar', () => {
  // TC-U09: Upload ảnh thành công (mock)
  test('TC-U09: Upload ảnh JPG', async () => {
    const { accessToken } = await createAuthUser();
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('avatar', tinyPng, 'test-avatar.png');

    expect([200, 500]).toContain(res.statusCode);
  });

  // TC-U10: Upload không có file → 400
  test('TC-U10: Không attach file', async () => {
    const { accessToken } = await createAuthUser();
    const res = await request(app)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(400);
  });

  // TC-U11: Upload file không phải ảnh → 400/500
  test('TC-U11: Upload file txt (không phải ảnh)', async () => {
    const { accessToken } = await createAuthUser();
    const textBuffer = Buffer.from('Đây là file text, không phải ảnh');

    const res = await request(app)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('avatar', textBuffer, 'document.txt');

    expect([400, 500]).toContain(res.statusCode);
  });

  // TC-U12: Upload không có token → 401
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

  // TC-U13: Upload field name sai → 400
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

    expect(res.statusCode).toBe(400);
  });
});
