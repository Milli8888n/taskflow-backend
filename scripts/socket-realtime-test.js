// scripts/socket-realtime-test.js
// Cách chạy:
// 1) npm i -D socket.io-client
// 2) node scripts/socket-realtime-test.js <ACCESS_TOKEN_USER_A> <ACCESS_TOKEN_USER_B> <PROJECT_ID>

const { io } = require("socket.io-client");

const [, , tokenA, tokenB, projectId] = process.argv;

if (!tokenA || !tokenB || !projectId) {
  console.error("Usage: node scripts/socket-realtime-test.js <TOKEN_A> <TOKEN_B> <PROJECT_ID>");
  process.exit(1);
}

const SERVER_URL = "http://localhost:5000";

function createClient(label, token) {
  const socket = io(SERVER_URL, {
    auth: { token },
    transports: ["websocket"], // rõ ràng cho test terminal
  });

  socket.on("connect", () => {
    console.log(`[${label}] connected: ${socket.id}`);
    socket.emit("joinProject", projectId);
    console.log(`[${label}] joined room project:${projectId}`);
  });

  socket.on("connect_error", (err) => {
    console.error(`[${label}] connect_error:`, err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[${label}] disconnected:`, reason);
  });

  // Listen các event realtime cần verify
  socket.on("taskCreated", (payload) => {
    console.log(`[${label}] taskCreated ->`, payload?._id || payload);
  });

  socket.on("taskUpdated", (payload) => {
    console.log(`[${label}] taskUpdated ->`, payload?._id || payload);
  });

  socket.on("taskDeleted", (payload) => {
    console.log(`[${label}] taskDeleted ->`, payload?._id || payload);
  });

  socket.on("commentCreated", (payload) => {
    console.log(`[${label}] commentCreated ->`, payload?._id || payload);
  });

  return socket;
}

const clientA = createClient("A", tokenA);
const clientB = createClient("B", tokenB);

console.log("\n== Ready ==");
console.log("Giữ script chạy, rồi dùng API/terminal để create/update/delete task và add comment.");
console.log("Bạn sẽ thấy event realtime in ra ở cả [A] và [B].");
console.log("Nhấn Ctrl+C để thoát.\n");

process.on("SIGINT", () => {
  clientA.emit("leaveProject", projectId);
  clientB.emit("leaveProject", projectId);
  clientA.disconnect();
  clientB.disconnect();
  process.exit(0);
});