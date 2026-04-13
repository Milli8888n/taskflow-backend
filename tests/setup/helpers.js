const request = require("supertest");
const app = require("../../src/app");
const { faker } = require("@faker-js/faker");

/**
 * Tạo user mới + đăng nhập, trả về { accessToken, refreshToken, user }
 * Nếu không truyền overrides, Faker sẽ tự sinh dữ liệu ngẫu nhiên.
 */
const createAuthUser = async (overrides = {}) => {
  const userData = {
    name: overrides.name || faker.person.fullName(),
    email: overrides.email || faker.internet.email().toLowerCase(),
    password: overrides.password || "Test@1234",
  };

  // Đăng ký
  const regRes = await request(app)
    .post("/api/v1/auth/register")
    .send(userData);

  if (regRes.statusCode !== 201) {
    throw new Error(
      `Register failed (${regRes.statusCode}): ${JSON.stringify(regRes.body)}`
    );
  }

  // Đăng nhập
  const loginRes = await request(app).post("/api/v1/auth/login").send({
    email: userData.email,
    password: userData.password,
  });

  if (loginRes.statusCode !== 200) {
    throw new Error(
      `Login failed (${loginRes.statusCode}): ${JSON.stringify(loginRes.body)}`
    );
  }

  return {
    accessToken: loginRes.body.data.accessToken,
    refreshToken: loginRes.body.data.refreshToken,
    user: loginRes.body.data.user,
  };
};

/**
 * Tạo project, trả về project object từ API response.
 */
const createProject = async (accessToken, overrides = {}) => {
  const projectData = {
    name: overrides.name || faker.commerce.productName(),
    description:
      overrides.description || faker.lorem.sentence(),
  };

  const res = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(projectData);

  if (res.statusCode !== 201) {
    throw new Error(
      `Create project failed (${res.statusCode}): ${JSON.stringify(res.body)}`
    );
  }

  return res.body.data.project;
};

/**
 * Tạo task trong project, trả về task object từ API response.
 */
const createTask = async (accessToken, projectId, overrides = {}) => {
  const taskData = {
    title: overrides.title || faker.hacker.phrase(),
    description: overrides.description || faker.lorem.paragraph(),
    status: overrides.status || "To Do",
    priority: overrides.priority || "Medium",
    ...overrides,
  };

  const res = await request(app)
    .post(`/api/v1/projects/${projectId}/tasks`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send(taskData);

  if (res.statusCode !== 201) {
    throw new Error(
      `Create task failed (${res.statusCode}): ${JSON.stringify(res.body)}`
    );
  }

  return res.body.data.task;
};

module.exports = { createAuthUser, createProject, createTask };
