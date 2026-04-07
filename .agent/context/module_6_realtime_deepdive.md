# ĐÀO SÂU TRONG MODULE 6: ĐỒNG BỘ THỜI GIAN THỰC (SOCKET.IO)

Vũ khí hạng nặng nhất để ứng dụng phân biệt giữa một con Web Cùn (Bấm 1 nút chờ quay vòng vòng load thẻ) với một Web App Động Hiện Đại chuẩn Single Page Architecture. Socket mở 1 kết nối duy trì vĩnh viễn (TCP Tube) làm cầu nối song phương, giúp thông tin truyền ngược tự động từ Server về màn hình các Máy tính đang làm việc chung.

---

## 🌍 Sub-Item 1: Ráp Kênh Giao Tiếp Vào Trục Express (`server.js`)

Không giống như khai báo API Route chớp tắt. `Socket.io` phải ngồi "chễm chệ" lên cùng 1 cái cổng cổng Network Port của thằng Khởi tạo Express Server gốc (Trục Application).

* **Định vị Code:** Tại `src/server.js` (không làm trong app.js)
* **Code Skeleton Triển khai Gắn Trục:**
  ```javascript
  const app = require('./app');               // Đây là app express cũ
  const http = require('http');               // Thư viện Cốt lõi của Node
  const { Server } = require('socket.io');    // Bộ gắp gói Socket.io

  // 1. Ép app dính trấu vào HTTP core
  const server = http.createServer(app);

  // 2. Gọi lớp chắn Socket bọc xung quanh HTTP, cấu hình CORS dãi cho FrontEnd
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT"] }
  });

  // 3. Biến 'io' thành biến toàn cục (Toàn ứng dụng) Bằng cách gán nó nhét vào đối tượng 'app' của Express.
  // ĐÂY LÀ KỸ THUẬT SIÊU CẤP ĐỂ TỪ ROUTE CHUI VÔ LẤY BẮN EVENT, KHỎI PHẢI XÀI FILE EXPORT REDUX
  app.set('socketio', io);

  // ... Config chạy hàm on('connection') 
  // Lệnh Listen Server:
  server.listen(5000, () => { console.log('Chạy Server thành công TCP')})
  ```

---

## 🔐 Sub-Item 2: Xác Thực JWT Vòng Ngoài Ống Đồng (Socket Auth)

Nhiều anh em không biết rằng Hacker có thể cầm Postman viết WebSockets rỗng, chui vào đường ống của ta không thông qua API Express hòng nghe lén dữ liệu chát chít công ty. Nên Socket cũng CẦN phải có hàm Lính Gác Bảo Vệ (Authentication Middleware).

* **Luồng Trình Bày (Kẹp ngầm ở Bước Config Connection):**
  ```javascript
  // Lính biên mậu kẹp ngầm Socket: Nếu Request mồi vào ko mang vé Token Bearer -> Đấm nó bay ra.
  io.use((socket, next) => {
    const token = socket.handshake.auth.token; // Thẻ được gửi từ giao diện trỏ lên
    if (!token) return next(new Error('Authentication error'));
    
    // Gỡ thẻ bóc ra Id User nội bộ
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = decoded; // Dán mẹ Id lên trán của Client kết nối này
      next();
    });
  });
  ```

---

## 🚪 Sub-Item 3: Thuật Toán Phân Luồng Phòng Chứa (Room Logic / Multiplexing)

Nếu không phân phòng, Máy A đổi Task Trello, thì Server hú la làng làm cho 10.000 user đang trực tuyến web (Bao gồm rẽ qua dự án khác) cũng bị hú giật giật màn hình giùm là nát server (Overload Broadcast Data).

* **Logic Nhóm (Join Room):** "Ông đăng nhập Board dự án nào, tui đẩy ông vào 1 cái Room cách âm của tên Dự án đó".
  ```javascript
  io.on('connection', (socket) => {
    console.log(`[+] User vào mạng: ${socket.user.id}`);

    // FE sẽ có thẻ JS tự động gửi chữ 'join_project' mang theo ProjectId lúc load cái Board làm việc
    socket.on('join_project', (projectId) => {
      socket.join(projectId); 
      console.log(`User vô phòng ${projectId}`);
    });

    // Khi User Tắt thẻ trính duyệt về Home
    socket.on('disconnect', () => { ... });
  });
  ```

---

## 🔫 Sub-Item 4: Súng Bắn Lệnh Trigger Từ API Trong Controller
Sau khi thiết lập Socket.io nằm gầm chạy ẩn. Việc tiếp theo chúng ta làm là cấu hình các Cò Súng (Trigger Emit Event) ngay bên dưới cái rốn của các hàm REST API thao tác dữ liệu thành công.

*Ví dụ cho tính năng Mấu chốt Trello: Kép Dịch (Move) Trạng Thái Task Trello:*
* **Code Skeleton Controller (`taskController.js`):**
  ```javascript
  exports.updateTaskStatus = async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { status, projectId } = req.body;  // Cần bắt được ProjectId ở đây nha
      
      // Khúc xử lí Data cứng DB (Đã lưu xong ok)
      const updatedTask = await taskService.updateTaskStatus(taskId, status);

      // KHÚC NÀY NÈ: Bóp Còi Gửi Data Qua Ống Ngưng Trệ Tức Thì!
      // Rút cây súng 'io' móc ngầm ra từ trong tay đối tượng 'req' lấy từ cái app.set trên server.js
      const io = req.app.get('socketio');
      
      // Bắn lệnh vào cái Phòng kín có Tên là ProjectId duy nhất. KHÔNG HÚ PHÒNG KHÁC.
      io.to(projectId).emit('task_status_changed', {
         task: updatedTask,
         changed_by: req.user.id  // Report luôn thằng Khốn nào vừa đổi task
      });

      res.status(200).json({ status: 'ok' }); // Trả lại HTTP xong xoá sổ
    } catch(err) { /*...*/}
  };
  ```

---

## 💻 Sub-Item 5: Chuẩn Bị Góc Nhìn FrontEnd Kéo Thả (EJS Client Javascript)

Bên góc FrontEnd giao diện UI. Tệp `board.ejs` phải có một cái kẹo bẫy thòng lọng nghe lén thụ động từ Server hú để Update Dom.
* **Code Skeleton (Client Socket.io):**
  ```html
  <!-- Tag Script Ở Dưới Body -->
  <script src="/socket.io/socket.io.js"></script>
  <script>
    // Config gửi Token Auth để Server chịu nhận
    const socket = io("http://localhost:5000", {
       auth: { token: "CHUỖI_JWT_LỚP_TRÊN_LUU_COOKIE" }
    });
    
    const CurentProjectId = "CHUOIID123";
    // Mồi phòng lúc trang load
    socket.emit('join_project', CurentProjectId);

    // [THỤ ĐỘNG NGHE SERVER]: Cứ mỗi lần thằng nào đó Đổi Trang Thái => Chốt Bẫy Nổ -> Gọi Hàm Update Giao diện JS Vanilla Dom (Xóa cục div này nhét qua mảng In-Progress Tương Ứng).
    socket.on('task_status_changed', (payload) => {
       console.log('Rút súng!', payload);
       const domTaskCard = document.getElementById(payload.task._id);
       const columnContainer = document.getElementById(`column-${payload.task.status}`);
       columnContainer.appendChild(domTaskCard); // Ép cột Task tự giác di chuyển bằng Dom Thao Tác. Trơn tru!
    });
  </script>
  ```
  *Bằng việc tích hợp ngầm `io.to(id).emit` trong ruột con API lưu DB, và giăng 1 cái thẻ bắt thụ động JS Frontend `on('event')` ở trên đầu Client như thế này. Ứng dụng đột pháp thành System Chat Hai Chiều Đời Mới.*
