# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 2 (PHẦN 4: SOCKET.IO REALTIME)

Phần quan trọng nhất của Sprint 2: Tích hợp Socket.io cho realtime updates. Khi 1 member đổi status task, các member khác thấy card tự động di chuyển cột mà không cần refresh.

---

# FILE 23: `src/config/socket.js` (Cấu hình Socket.io Server)

```javascript
const socketIO = require('socket.io');
```
- Import thư viện `socket.io`. Đây là phần SERVER. Client sẽ dùng thư viện client riêng.

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
```
- Import JWT và User model để xác thực socket connection.

```javascript
let io;
```
- Khai báo biến `io` ở scope module (bên ngoài mọi hàm). Biến này sẽ chứa instance Socket.io server.
- Dùng `let` vì sẽ được gán giá trị trong `initSocket()`.
- Đặt ở scope module → Mọi hàm trong file đều truy cập được.

```javascript
const initSocket = (server) => {
```
- `server`: HTTP server instance (từ `app.listen()` hoặc `http.createServer(app)`).
- Socket.io cần gắn vào HTTP server để "cưỡi" trên cùng một cổng.

```javascript
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
```
- `socketIO(server, options)`: Tạo Socket.io server gắn vào HTTP server.
- `cors: { origin: '*' }`: Cho phép mọi domain kết nối. Production nên đổi thành domain cụ thể.
- `methods: ['GET', 'POST']`: Cho phép 2 HTTP method.
- Sau dòng này, `io` là Socket.io server instance. Dùng `io.emit()` để gửi event tới TẤT CẢ clients.

---

### Middleware xác thực Socket

```javascript
  io.use(async (socket, next) => {
```
- `io.use(middleware)`: Đăng ký middleware chạy TRƯỚC mỗi socket connection.
- Giống `app.use()` của Express nhưng cho Socket.io.
- `socket`: Object đại diện cho 1 kết nối client cụ thể.
- `next`: Gọi để cho phép connection tiếp tục. `next(error)` để từ chối.

```javascript
    try {
      const token = socket.handshake.auth.token;
```
- `socket.handshake`: Object chứa thông tin của lần "bắt tay" đầu tiên (initial connection).
- `.auth`: Object do client gửi kèm khi connect. Client code: `io({ auth: { token: "eyJ..." } })`.
- `.token`: Giá trị JWT token.
- Tại sao token qua handshake chứ không qua header?
  - WebSocket không dùng HTTP headers theo cách thông thường.
  - Socket.io cung cấp `auth` object riêng cho mục đích xác thực.

```javascript
      if (!token) {
        return next(new Error('Authentication error: No token'));
      }
```
- Client không gửi token → Từ chối kết nối.
- `next(new Error(...))`: Socket.io sẽ ngắt kết nối và gửi lỗi về client.

```javascript
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
```
- Giải mã JWT. Nếu token sai/hết hạn → Throw lỗi → Rơi vào catch.

```javascript
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
```
- Kiểm tra user còn tồn tại.

```javascript
      socket.user = user;
```
- **Gắn user vào socket object.** Từ đây, trong mọi event handler, `socket.user` chứa thông tin user đã xác thực.
- Giống `req.user` của Express middleware.

```javascript
      next();
```
- Xác thực OK → Cho phép connection.

```javascript
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
```

---

### Xử lý sự kiện Connection

```javascript
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);
```
- `io.on('connection', callback)`: Mỗi khi 1 client kết nối thành công (đã qua middleware auth).
- `socket.id`: ID duy nhất Socket.io tự gán cho mỗi connection (vd: `"xk2abc..."`, random).
- Log để debug: Biết ai vừa vào.

---

#### Sự kiện JOIN ROOM

```javascript
    socket.on('joinProject', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`${socket.user.name} joined room: project:${projectId}`);
    });
```
- `socket.on('joinProject', callback)`: Lắng nghe event tên `joinProject` từ client.
- `projectId`: Dữ liệu client gửi kèm. Ví dụ: `socket.emit('joinProject', 'abc123')`.
- `socket.join('project:abc123')`: Cho socket này vào "phòng" (room) tên `project:abc123`.
  - **Room (Phòng)**: Nhóm các socket connections. Khi emit vào room, chỉ members trong room nhận được.
  - Tại sao prefix `project:`? Để tránh xung đột tên. ID project thuần `abc123` có thể trùng với ID khác (task, user).
  - Mỗi socket có thể join nhiều room cùng lúc (vd: vừa xem project A, vừa nhận notification).

---

#### Sự kiện LEAVE ROOM

```javascript
    socket.on('leaveProject', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`${socket.user.name} left room: project:${projectId}`);
    });
```
- `socket.leave(roomName)`: Rời khỏi room. Không nhận event từ room này nữa.
- Khi nào gọi? Khi user chuyển từ board project A sang board project B.

---

#### Sự kiện DISCONNECT

```javascript
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
```
- `disconnect`: Event đặc biệt, tự phát khi client mất kết nối (đóng tab, mất mạng, v.v.).
- Socket.io tự xóa socket khỏi tất cả rooms khi disconnect.
- Log để debug.

```javascript
  });
```
- Đóng callback `io.on('connection', ...)`.

---

### Hàm lấy io và emit event

```javascript
  return io;
};
```

```javascript
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo!');
  }
  return io;
};
```
- `getIO()`: Hàm trả về instance `io` sau khi đã init.
- Service sẽ gọi `getIO()` để emit events. Ví dụ: `getIO().to('project:abc').emit('taskUpdated', data)`.
- Throw error nếu gọi trước khi init → Debug dễ (biết ngay problem).

```javascript
module.exports = { initSocket, getIO };
```
- Xuất 2 hàm: `initSocket` cho server.js, `getIO` cho services.

---

# FILE 24: `src/server.js` (Cập nhật – Tích hợp Socket.io)

```javascript
require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
```
- `const http = require('http')`: Module HTTP built-in của Node.js.
- Tại sao cần `http`? Vì Socket.io cần gắn vào HTTP server, không gắn trực tiếp vào Express app.

```javascript
connectDB();

const server = http.createServer(app);
```
- `http.createServer(app)`: Tạo HTTP server từ Express app.
  - Trước đây dùng `app.listen()` – thực ra nó cũng gọi `http.createServer(app).listen()` ngầm.
  - Tách ra để lấy biến `server` truyền cho Socket.io.

```javascript
initSocket(server);
```
- Khởi tạo Socket.io, gắn vào HTTP server.
- Từ đây, server vừa xử lý HTTP requests (Express) VÀ WebSocket connections (Socket.io) trên cùng 1 cổng.

```javascript
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```
- `server.listen()` thay vì `app.listen()`. Vì `server` bây giờ là HTTP server chính.

---

# FILE 25: Emit events từ Service (Cập nhật Service)

**Thêm vào `src/services/taskService.js`:**

```javascript
const { getIO } = require('../config/socket');
```
- Import hàm lấy Socket.io instance.

```javascript
// Thêm vào cuối hàm createTask, TRƯỚC return:
const io = getIO();
io.to(`project:${projectId}`).emit('taskCreated', task);
```
- `getIO()`: Lấy Socket.io server instance.
- `.to('project:abc123')`: Chọn room.
  - Chỉ clients đang ở trong room `project:abc123` mới nhận event.
  - Clients ở room khác (hoặc không join room nào) → Không nhận.
- `.emit('taskCreated', task)`: Phát event tên `taskCreated` kèm dữ liệu `task`.
  - Client lắng nghe: `socket.on('taskCreated', (task) => { ... })`.
- Kết quả: Khi member A tạo task, member B đang mở board cùng project sẽ thấy task mới xuất hiện tức thì.

```javascript
// Thêm vào cuối hàm updateTask, TRƯỚC return:
const io = getIO();
io.to(`project:${task.projectId}`).emit('taskUpdated', task);
```
- Khi task được cập nhật (đổi status, assignee, priority), emit event `taskUpdated`.
- `task.projectId`: Lấy projectId từ task document (vì task đã có trường này).

---

# FILE 26: Client Socket.io (Thêm vào `public/js/board.js`)

```html
<!-- Thêm vào board.ejs TRƯỚC script board.js -->
<script src="/socket.io/socket.io.js"></script>
```
- Socket.io server tự phục vụ file client JS tại URL `/socket.io/socket.io.js`.
- Không cần cài thêm gì. Khi init Socket.io server, nó tự tạo endpoint này.

```javascript
const socket = io({
  auth: {
    token: localStorage.getItem('accessToken')
  }
});
```
- `io({...})`: Hàm toàn cục từ thư viện Socket.io client. Kết nối tới server.
- `auth: { token: ... }`: Gửi JWT token khi bắt tay. Server middleware sẽ đọc từ `socket.handshake.auth.token`.

```javascript
socket.on('connect', () => {
  console.log('Socket connected!');
  socket.emit('joinProject', projectId);
});
```
- `'connect'`: Event đặc biệt, phát khi kết nối WebSocket thành công.
- `socket.emit('joinProject', projectId)`: Gửi event lên server để join room.
  - Server nhận: `socket.on('joinProject', ...)` → `socket.join('project:abc123')`.

```javascript
socket.on('taskCreated', (task) => {
  console.log('Nhận task mới từ socket:', task);
  loadBoard();
});
```
- Lắng nghe event `taskCreated` từ server.
- `(task)`: Dữ liệu server gửi kèm (object task mới).
- `loadBoard()`: Reload toàn bộ board. Cách đơn giản nhất (không tối ưu nhưng hoạt động).
  - Cách tối ưu hơn: Parse task, xác định status, render 1 card mới vào đúng cột. Nhưng phức tạp hơn.

```javascript
socket.on('taskUpdated', (task) => {
  console.log('Task được cập nhật từ socket:', task);
  loadBoard();
});
```
- Tương tự: Khi member khác đổi status → Board tự reload hiện trạng thái mới.
- Kịch bản thực tế: Member A kéo task sang "Done" → Server emit `taskUpdated` → Member B đang xem board → `loadBoard()` chạy → Card tự di chuyển sang cột Done.

```javascript
socket.on('disconnect', () => {
  console.log('Socket disconnected');
});
```
- Khi mất kết nối (mạng chập, server restart). Socket.io client tự reconnect.

```javascript
socket.on('connect_error', (error) => {
  console.error('Socket error:', error.message);
  if (error.message.includes('Authentication')) {
    window.location.href = '/login';
  }
});
```
- `connect_error`: Phát khi kết nối thất bại (token sai, server chết).
- Nếu lỗi xác thực → Chuyển về trang login (token có thể hết hạn).
- `error.message.includes('Authentication')`: Kiểm tra message lỗi có chứa từ "Authentication" không.

---

# TỔNG KẾT LUỒNG REALTIME

```
┌──────────────────────────────────────────────────────────┐
│                    LUỒNG HOẠT ĐỘNG                       │
│                                                          │
│  Member A (Chrome)         Server            Member B    │
│      │                       │              (Firefox)    │
│      │──── joinProject ─────>│                   │       │
│      │                       │<── joinProject ───│       │
│      │                       │                   │       │
│      │  (Cả 2 đã join room "project:abc")        │       │
│      │                       │                   │       │
│      │── POST /tasks ───────>│                   │       │
│      │                       │── taskCreated ───>│       │
│      │<── 201 Created ──────│                   │       │
│      │                       │                   │       │
│      │  (A thấy task qua     │    (B thấy task   │       │
│      │   API response)       │    qua socket)    │       │
│      │                       │                   │       │
│      │── PUT /tasks/:id ────>│                   │       │
│      │                       │── taskUpdated ──>│        │
│      │<── 200 OK ───────────│                   │       │
│      │                       │                   │       │
│      │  (A reload board)     │  (B auto reload)  │       │
└──────────────────────────────────────────────────────────┘
```

- Member A thao tác → API xử lý → Service emit socket event → Member B nhận event → UI tự cập nhật.
- Member A nhận kết quả qua HTTP response (JSON). Member B nhận qua WebSocket (socket event).
- Cả 2 đều thấy kết quả gần như cùng lúc (< 100ms độ trễ).
