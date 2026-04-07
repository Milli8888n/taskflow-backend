# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 2 (PHẦN 2: COMMENT MODULE + FRONTEND)

Tiếp theo Phần 1 (Project & Task), phần này giải thích **Comment Module** và **toàn bộ giao diện Frontend EJS** của Sprint 2.

---

# FILE 9: `src/services/commentService.js`

### Hàm thêm bình luận

```javascript
const Comment = require('../models/commentModel');
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const AppError = require('../utils/AppError');
```
- Import 3 Model: Comment (tạo mới), Task (tìm task chứa comment), Project (kiểm tra membership).

```javascript
exports.addComment = async (taskId, content, userId) => {
```
- `taskId`: ID task mà comment gắn vào.
- `content`: Nội dung bình luận (text).
- `userId`: Ai đang viết comment.

```javascript
  const task = await Task.findOne({ _id: taskId, isDeleted: false });

  if (!task) {
    throw new AppError('Không tìm thấy công việc', 404);
  }
```
- Tìm task. Nếu task đã bị soft delete hoặc không tồn tại → Lỗi 404.

```javascript
  const project = await Project.findOne({
    _id: task.projectId,
    isDeleted: false
  });

  if (!project) {
    throw new AppError('Dự án chứa công việc này không tồn tại', 404);
  }
```
- Từ task, lấy `projectId` → Tìm project.
- Tại sao check project? Vì nếu project đã bị xóa mềm, ta không nên cho phép comment thêm.

```javascript
  const isMember = project.members.some(
    m => m.toString() === userId.toString()
  );

  if (!isMember) {
    throw new AppError('Bạn không phải thành viên của dự án này', 403);
  }
```
- **Check chuỗi 3 tầng hoàn chỉnh:** Task tồn tại → Project chứa task tồn tại → User thuộc project đó.
- Đây là "cross-resource authorization" (phân quyền xuyên tài nguyên) – kỹ thuật bảo mật quan trọng.

```javascript
  const comment = await Comment.create({
    taskId: taskId,
    author: userId,
    content: content
  });
```
- Tạo comment mới. `timestamps: true` tự gán `createdAt`.

```javascript
  const populatedComment = await Comment.findById(comment._id)
    .populate('author', 'name avatar');
```
- Sau khi tạo, query lại comment vừa tạo VÀ populate trường `author`.
- Tại sao phải query lại? Vì `Comment.create()` trả về document thô (author là ObjectId).
- Frontend cần nhận ngay `author: { name: "Nguyễn A", avatar: "https://..." }` để hiển thị tức thì.
- `.populate('author', 'name avatar')`: Thay ObjectId bằng object User chỉ chứa name + avatar.

```javascript
  return populatedComment;
};
```

---

### Hàm lấy danh sách bình luận

```javascript
exports.getCommentsByTask = async (taskId) => {
```

```javascript
  const task = await Task.findOne({ _id: taskId, isDeleted: false });

  if (!task) {
    throw new AppError('Không tìm thấy công việc', 404);
  }
```
- Kiểm tra task tồn tại trước khi lấy comments.

```javascript
  const comments = await Comment.find({ taskId: taskId })
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });
```
- `Comment.find({ taskId })`: Lấy tất cả comments thuộc task này.
- `.populate('author', 'name avatar')`: Thay ID tác giả bằng object { name, avatar }.
- `.sort({ createdAt: -1 })`: Mới nhất trước (giống Facebook comments mặc định).
- Index `{ taskId: 1, createdAt: -1 }` đã được khai báo trong commentModel → Query cực nhanh.

```javascript
  return comments;
};
```
- Trả mảng comments. Nếu task chưa có comment → Mảng rỗng `[]`.

---

# FILE 10: `src/controllers/commentController.js`

```javascript
const commentService = require('../services/commentService');

exports.addComment = async (req, res, next) => {
  try {
    const comment = await commentService.addComment(
      req.params.taskId,
      req.body.content,
      req.user._id
    );
```
- `req.params.taskId`: Từ URL `/tasks/:taskId/comments`.
- `req.body.content`: Nội dung comment client gửi: `{ "content": "Tôi đã hoàn thành phần này" }`.
- `req.user._id`: Tác giả (người đang login).

```javascript
    res.status(201).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};
```

```javascript
exports.getComments = async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsByTask(req.params.taskId);

    res.status(200).json({
      status: 'success',
      results: comments.length,
      data: { comments }
    });
  } catch (error) {
    next(error);
  }
};
```
- `results: comments.length`: Đếm số comments trả về. Hữu ích cho Frontend hiện badge "12 bình luận".

---

# FILE 11: `src/routes/commentRoutes.js`

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
```
- `mergeParams: true`: Giống taskRoutes. Để nhận `taskId` từ route cha.

```javascript
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(commentController.getComments)
  .post(commentController.addComment);

module.exports = router;
```
- `GET /` → `GET /api/v1/tasks/:taskId/comments` (lấy comments).
- `POST /` → `POST /api/v1/tasks/:taskId/comments` (thêm comment mới).

**Gắn vào taskRoutes.js (thêm vào cuối file):**
```javascript
const commentRoutes = require('./commentRoutes');
router.use('/:taskId/comments', commentRoutes);
```
- Nested route: `/projects/:projectId/tasks/:taskId/comments`.

---

# FILE 12: `src/views/project/index.ejs` (Trang danh sách Project)

```html
<%- include('../partials/_header') %>

<div class="projects-container">
  <div class="projects-header">
    <h1>Dự Án Của Tôi</h1>
    <button class="btn-primary" id="btn-create-project">
      + Tạo Dự Án Mới
    </button>
  </div>
```
- `projects-container`: Layout chính bọc nội dung.
- `id="btn-create-project"`: ID để JS bắt sự kiện click mở modal tạo project.

```html
  <div class="projects-grid" id="projects-grid">
    <!-- JS sẽ render cards vào đây -->
  </div>
</div>
```
- `projects-grid`: Container cho các project cards. CSS Grid sẽ xếp thành lưới.
- `id="projects-grid"`: JS dùng `getElementById` để chèn HTML cards vào bên trong.
- Nội dung rỗng ban đầu. JS sẽ gọi API lấy dữ liệu rồi render.

```html
<!-- Modal Tạo Project -->
<div class="modal-overlay" id="modal-overlay" style="display: none;">
  <div class="modal-card">
    <h2>Tạo Dự Án Mới</h2>
    <form id="create-project-form">
      <div class="form-group">
        <label for="project-name">Tên dự án</label>
        <input type="text" id="project-name" required>
      </div>
      <div class="form-group">
        <label for="project-desc">Mô tả</label>
        <textarea id="project-desc" rows="3"></textarea>
      </div>
```
- `modal-overlay`: Lớp phủ tối mờ toàn màn hình. Click vào đóng modal.
- `style="display: none;"`: Modal ẩn mặc định. JS sẽ hiện khi bấm nút "Tạo".
- `<textarea>`: Ô nhập đa dòng (khác `<input>` chỉ 1 dòng). `rows="3"`: 3 dòng cao.

```html
      <div class="modal-actions">
        <button type="button" class="btn-secondary" id="btn-cancel">Hủy</button>
        <button type="submit" class="btn-primary">Tạo</button>
      </div>
    </form>
  </div>
</div>
```
- `type="button"`: Nút Hủy. Khác `type="submit"`, nút này KHÔNG submit form. Chỉ dùng JS bắt click để đóng modal.
- `type="submit"`: Nút Tạo. Phát sự kiện submit trên form.

```html
<script src="/js/projects.js"></script>
<%- include('../partials/_footer') %>
```
- Nhúng file JS xử lý logic trang Projects.

---

# FILE 13: `public/js/projects.js` (Client JS trang danh sách Project)

```javascript
const API_URL = '/api/v1/projects';

function getToken() {
  return localStorage.getItem('accessToken');
}
```
- `getToken()`: Hàm lấy JWT token từ localStorage (đã lưu lúc đăng nhập).
- Tách thành hàm riêng vì dùng ở nhiều chỗ (mỗi lần fetch API đều cần).

```javascript
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}
```
- Hàm tạo headers chuẩn cho mọi API call.
- `Authorization: Bearer <token>`: Header xác thực. Backend middleware `protect` sẽ đọc header này.

---

### Load danh sách projects

```javascript
async function loadProjects() {
  try {
    const response = await fetch(API_URL, {
      headers: authHeaders()
    });
```
- `fetch(API_URL, { headers })`: GET request tới `/api/v1/projects` kèm header Authorization.
- Không cần ghi `method: 'GET'` vì GET là mặc định của fetch.

```javascript
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }
```
- Parse response và check lỗi.

```javascript
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';
```
- `grid.innerHTML = ''`: Xóa sạch nội dung cũ trước khi render mới (tránh bị trùng lặp nếu gọi lại).

```javascript
    if (data.data.projects.length === 0) {
      grid.innerHTML = '<p class="empty-text">Bạn chưa có dự án nào. Hãy tạo mới!</p>';
      return;
    }
```
- Trường hợp user mới, chưa có project đã tạo/tham gia. Hiện thông báo thay vì trang trắng.

```javascript
    data.data.projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card';
```
- `.forEach(callback)`: Duyệt mảng projects. Mỗi vòng lặp, `project` là 1 object project.
- `document.createElement('div')`: Tạo thẻ `<div>` mới trong bộ nhớ (chưa gắn vào trang).
- `.className = 'project-card'`: Gán class CSS cho card.

```javascript
      card.innerHTML = `
        <h3 class="project-card-title">${project.name}</h3>
        <p class="project-card-desc">${project.description || 'Chưa có mô tả'}</p>
        <div class="project-card-meta">
          <span>${project.members.length} thành viên</span>
        </div>
      `;
```
- Template literal để xây HTML.
- `${project.name}`: Chèn tên project.
- `${project.description || 'Chưa có mô tả'}`: Nếu description rỗng → Hiện text mặc định.
- `${project.members.length}`: Đếm số thành viên.

```javascript
      card.addEventListener('click', () => {
        window.location.href = `/projects/${project._id}/board`;
      });
```
- Khi click vào card → Chuyển sang trang Board của project đó.
- `project._id`: MongoDB ObjectId, dùng làm phần URL.
- `/projects/abc123/board`: Trang Board Kanban (sẽ viết ở Sprint 2 Frontend).

```javascript
      grid.appendChild(card);
    });
```
- `.appendChild(card)`: Gắn card vào trong grid. Card hiện lên trang.
- Mỗi vòng lặp thêm 1 card → Kết quả: Grid chứa nhiều cards.

---

### Xử lý Modal tạo project

```javascript
const btnCreate = document.getElementById('btn-create-project');
const modal = document.getElementById('modal-overlay');
const btnCancel = document.getElementById('btn-cancel');

btnCreate.addEventListener('click', () => {
  modal.style.display = 'flex';
});
```
- Click nút "Tạo Dự Án" → Hiện modal (`display: flex` để căn giữa).

```javascript
btnCancel.addEventListener('click', () => {
  modal.style.display = 'none';
});
```
- Click nút "Hủy" → Ẩn modal.

```javascript
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});
```
- Click vào vùng tối mờ bên ngoài card modal → Đóng modal.
- `e.target`: Phần tử thực sự được click. Nếu click vào chính overlay (không phải card bên trong) → Đóng.
- `e.target === modal`: So sánh strict. Chỉ đóng khi click đúng vào overlay, không đóng khi click vào form bên trong.

```javascript
const createForm = document.getElementById('create-project-form');

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('project-name').value.trim();
  const description = document.getElementById('project-desc').value.trim();
```
- `e.preventDefault()`: Chặn reload trang.
- `.trim()`: Xóa khoảng trắng đầu/cuối.

```javascript
  if (!name) {
    alert('Vui lòng nhập tên dự án');
    return;
  }
```
- Validate client-side. `return` dừng hàm, không gửi API.

```javascript
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, description })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    modal.style.display = 'none';
    createForm.reset();
    loadProjects();
```
- `method: 'POST'`: Gửi request tạo mới.
- `createForm.reset()`: Xóa sạch dữ liệu trong form (reset về trạng thái ban đầu).
- `loadProjects()`: Gọi lại hàm load danh sách → Danh sách tự cập nhật hiện project mới.

---

# FILE 14: `src/views/project/board.ejs` (Trang Board Kanban – 3 cột)

```html
<%- include('../partials/_header') %>

<div class="board-container">
  <div class="board-header">
    <h1 id="board-title">Đang tải...</h1>
    <button class="btn-primary" id="btn-add-task">+ Thêm công việc</button>
  </div>
```
- `id="board-title"`: JS sẽ đổi text thành tên Project sau khi fetch API.

```html
  <div class="board-columns">
    <div class="board-column" id="column-todo">
      <div class="column-header">
        <h2>📋 To Do</h2>
        <span class="task-count" id="count-todo">0</span>
      </div>
      <div class="column-body" id="tasks-todo"></div>
    </div>

    <div class="board-column" id="column-inprogress">
      <div class="column-header">
        <h2>🔄 In Progress</h2>
        <span class="task-count" id="count-inprogress">0</span>
      </div>
      <div class="column-body" id="tasks-inprogress"></div>
    </div>

    <div class="board-column" id="column-done">
      <div class="column-header">
        <h2>✅ Done</h2>
        <span class="task-count" id="count-done">0</span>
      </div>
      <div class="column-body" id="tasks-done"></div>
    </div>
  </div>
</div>
```
- **3 cột Kanban**: To Do, In Progress, Done.
- Mỗi cột có:
  - `column-header`: Tiêu đề + badge đếm số task.
  - `column-body` (vd `id="tasks-todo"`): Container rỗng, JS sẽ render task cards vào đây.
- `id` dễ nhớ theo quy tắc: `tasks-todo`, `tasks-inprogress`, `tasks-done`.
- Emoji 📋🔄✅: Trang trí trực quan, dễ nhận biết cột nào.

```html
<script src="/js/board.js"></script>
<%- include('../partials/_footer') %>
```

---

# FILE 15: `public/js/board.js` (Client JS trang Board)

```javascript
const projectId = window.location.pathname.split('/')[2];
```
- `window.location.pathname`: Đường dẫn URL hiện tại. Ví dụ: `/projects/abc123/board`.
- `.split('/')`: Tách chuỗi bằng `/`. Kết quả: `["", "projects", "abc123", "board"]`.
- `[2]`: Lấy phần tử index 2 = `"abc123"` = projectId.
- Kỹ thuật này tránh phải truyền projectId qua EJS template.

```javascript
const API_BASE = `/api/v1/projects/${projectId}`;
```
- URL gốc cho API. Ví dụ: `/api/v1/projects/abc123`.

```javascript
async function loadBoard() {
  try {
    const [projectRes, tasksRes] = await Promise.all([
      fetch(`${API_BASE}`, { headers: authHeaders() }),
      fetch(`${API_BASE}/tasks`, { headers: authHeaders() })
    ]);
```
- `Promise.all([...])`: Gọi 2 API ĐỒNG THỜI (parallel). Nhanh hơn gọi tuần tự.
  - API 1: Lấy thông tin project (tên, mô tả).
  - API 2: Lấy danh sách tasks.
- `[projectRes, tasksRes]`: Destructuring kết quả. `Promise.all` trả mảng theo thứ tự.
- Tại sao `Promise.all`? Nếu gọi tuần tự: chờ API1 xong → gọi API2. Tổng = 200ms + 200ms = 400ms.
- Dùng `Promise.all`: Gọi cùng lúc. Tổng ≈ max(200ms, 200ms) = 200ms. Nhanh gấp đôi.

```javascript
    const projectData = await projectRes.json();
    const tasksData = await tasksRes.json();

    document.getElementById('board-title').textContent = projectData.data.project.name;
```
- Cập nhật tiêu đề board bằng tên project.

```javascript
    const tasks = tasksData.data.tasks;

    const todoTasks = tasks.filter(t => t.status === 'To Do');
    const inprogressTasks = tasks.filter(t => t.status === 'In Progress');
    const doneTasks = tasks.filter(t => t.status === 'Done');
```
- `.filter(callback)`: Tạo mảng mới chỉ chứa phần tử thỏa điều kiện.
- `t.status === 'To Do'`: Lọc tasks có status = "To Do".
- Kết quả: 3 mảng tách biệt cho 3 cột.

```javascript
    renderColumn('tasks-todo', todoTasks, 'count-todo');
    renderColumn('tasks-inprogress', inprogressTasks, 'count-inprogress');
    renderColumn('tasks-done', doneTasks, 'count-done');
```
- Gọi hàm render cho từng cột.

```javascript
function renderColumn(containerId, tasks, countId) {
  const container = document.getElementById(containerId);
  const countBadge = document.getElementById(countId);

  container.innerHTML = '';
  countBadge.textContent = tasks.length;
```
- Xóa nội dung cũ, cập nhật badge đếm.

```javascript
  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = task._id;
```
- `card.id = task._id`: Gán MongoDB ID làm HTML id.
  - Khi Socket.io báo "task abc123 vừa đổi status", JS dùng `document.getElementById('abc123')` để tìm đúng card DOM và di chuyển nó.

```javascript
    const priorityColors = {
      'Low': '#22c55e',
      'Medium': '#f59e0b',
      'High': '#ef4444'
    };
```
- Object mapping: Mỗi mức ưu tiên tương ứng 1 màu.
  - Low → xanh (an toàn).
  - Medium → vàng (chú ý).
  - High → đỏ (khẩn cấp).

```javascript
    const assigneeName = task.assignee ? task.assignee.name : 'Chưa giao';
```
- `task.assignee`: Có thể `null` (chưa giao cho ai) hoặc object `{ name, avatar }` (đã populate).
- Ternary: Nếu có assignee → Lấy tên. Nếu null → Hiện "Chưa giao".

```javascript
    card.innerHTML = `
      <div class="task-card-priority" style="background: ${priorityColors[task.priority]}">
        ${task.priority}
      </div>
      <h4 class="task-card-title">${task.title}</h4>
      <div class="task-card-footer">
        <span class="task-card-assignee">👤 ${assigneeName}</span>
        ${task.deadline
          ? `<span class="task-card-deadline">📅 ${new Date(task.deadline).toLocaleDateString('vi-VN')}</span>`
          : ''
        }
      </div>
    `;
```
- `priorityColors[task.priority]`: Lấy màu từ object mapping. Ví dụ: `task.priority = "High"` → `"#ef4444"`.
- `new Date(task.deadline).toLocaleDateString('vi-VN')`: Chuyển chuỗi ISO date thành format Việt Nam.
  - Input: `"2026-04-15T00:00:00.000Z"`.
  - Output: `"15/04/2026"`.
- `${task.deadline ? ... : ''}`: Nếu có deadline → Hiện ngày. Nếu null → Không hiện gì.

```javascript
    // Bắt sự kiện click để đổi status (kéo thả đơn giản)
    card.addEventListener('click', () => {
      showTaskDetail(task);
    });

    container.appendChild(card);
  });
}
```
- Click vào task card → Mở modal chi tiết (đổi status, xem comments).
- `appendChild`: Gắn card vào cột tương ứng.

```javascript
// Gọi loadBoard khi trang load xong
document.addEventListener('DOMContentLoaded', loadBoard);
```
- `DOMContentLoaded`: Sự kiện phát khi HTML đã parse xong (chưa cần đợi ảnh/CSS load hết).
- Đảm bảo `loadBoard` chạy sau khi tất cả thẻ HTML đã sẵn sàng (tránh `getElementById` trả `null`).
