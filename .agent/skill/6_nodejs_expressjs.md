### 1. Node.js là gì?

Node.js là **môi trường chạy JavaScript bên ngoài trình duyệt** (server-side JavaScript runtime), được xây dựng trên **V8 Engine** của Google Chrome.

**Đặc điểm nổi bật (2026):**

- **Non-blocking I/O** + **Event-driven** → cực kỳ mạnh về xử lý **I/O nặng** (API, file, database, chat realtime...)
- **Single-threaded** nhưng rất hiệu quả nhờ Event Loop
- **npm** – kho package lớn nhất thế giới (hơn 2.5–3 triệu package)
- Dùng cho: Web server, API backend, CLI tool, Microservices, Serverless, Realtime app (chat, game online, notification)...

**Ví dụ thực tế phổ biến 2026:**
- API REST / GraphQL (80% startup Việt Nam dùng Node.js)
- Ứng dụng realtime (chat, collab tool)
- Microservices, Serverless (Vercel, AWS Lambda, Railway...)
- Công cụ dev (Vite, Turborepo, ESLint plugin, Prettier...)

### 2. Express.js là gì?

Express là **framework web nhẹ nhất và phổ biến nhất** xây dựng trên Node.js.

Nó giúp bạn:

- Xử lý **route** (đường dẫn) dễ dàng
- Middleware (xử lý request/response theo chuỗi)
- Template engine (EJS, Pug, Handlebars...)
- Xử lý static file, form, JSON dễ dàng
- Là nền tảng cho rất nhiều framework hiện đại (NestJS, Fastify, Hono, AdonisJS...)

**So sánh nhanh 2026:**

| Framework     | Độ phức tạp | Performance | Learning curve | Phổ biến | Khuyên dùng khi...                     |
|---------------|-------------|-------------|----------------|----------|----------------------------------------|
| Express       | Thấp        | Tốt         | Rất dễ         | ★★★★★    | Học cơ bản, dự án nhỏ–trung bình       |
| Fastify       | Trung bình  | Rất cao     | Trung bình     | ★★★★     | Cần tốc độ cao                         |
| NestJS        | Cao         | Tốt         | Khó hơn        | ★★★★     | Dự án lớn, cần cấu trúc enterprise     |
| Hono          | Rất thấp    | Siêu cao    | Dễ             | Đang lên | Edge runtime, serverless, Bun          |

### 3. Cài đặt Node.js

- **LTS (khuyên dùng cho production)**: **v24.x** (Krypton) – ổn định đến ~2028
- **Current (phiên bản mới nhất)**: **v25.x**

**Khuyến nghị cho người mới & hầu hết dự án**: **Cài bản LTS v24**

#### Cách 1: Cài trực tiếp (dễ nhất – Windows / macOS)

1. Truy cập: https://nodejs.org
2. Nhấn nút **LTS** (hiện tại là v24.14.x hoặc mới hơn)
3. Tải về và cài đặt như phần mềm bình thường (Next → Next → Finish)
4. Mở terminal / PowerShell / CMD và kiểm tra:

```bash
node -v     # nên ra ~ v24.14.x
npm -v      # nên ra phiên bản 10.x hoặc 11.x
```

#### Cách 2: Dùng NVM (Node Version Manager) – chuyên nghiệp hơn (khuyên dùng lâu dài)

**Windows** → dùng **nvm-windows**  
https://github.com/coreybutler/nvm-windows

**macOS / Linux**:

```bash
# Cài nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# hoặc dùng wget
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Khởi động lại terminal hoặc chạy:
source ~/.bashrc   # hoặc ~/.zshrc tùy shell

# Cài và dùng phiên bản LTS
nvm install 24
nvm use 24
nvm alias default 24   # mặc định luôn dùng v24 khi mở terminal mới
```

### 4. Tạo project Express đầu tiên (Hello World)

```bash
# 1. Tạo thư mục dự án
mkdir my-first-express
cd my-first-express

# 2. Khởi tạo project Node.js
npm init -y

# 3. Cài express
npm install express

# 4. Tạo file index.js
```

**index.js**

```js
const express = require('express');
const app = express();
const port = 3000;

// Route cơ bản
app.get('/', (req, res) => {
  res.send('Xin chào! Đây là server Express đầu tiên của bạn 🚀');
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
```

**Chạy thử**

```bash
node index.js
```

Mở trình duyệt → http://localhost:3000