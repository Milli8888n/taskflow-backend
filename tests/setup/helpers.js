const request = require("supertest");
const app = require("../../src/app");

const createAuthUser = async (userData) => {
  await request(app).post("/api/v1/auth/register").send(userData);
  const res = await request(app).post("/api/v1/auth/login").send({
    email: userData.email,
    password: userData.password,
  });
  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    user: res.body.data.user,
  };
};

module.exports = { createAuthUser };
