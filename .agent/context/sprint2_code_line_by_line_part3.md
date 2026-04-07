# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 2 (PHẦN 3: CSS BOARD, TASK DETAIL MODAL, VIEW ROUTES)

Phần cuối của Sprint 2: Board CSS, Modal chi tiết Task (đổi status, xem/thêm comments), và View Routes render trang EJS.

---

# FILE 16: `public/css/board.css` (Style cho trang Board Kanban)

```css
.board-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}
```
- `max-width: 1400px`: Giới hạn chiều rộng tối đa. Trên màn hình 4K, nội dung không bị dãn quá rộng.
- `margin: 0 auto`: `0` trên/dưới, `auto` trái/phải = căn giữa ngang.
  - `auto` nghĩa là "tự chia đều khoảng trống". Trái auto + Phải auto = giữa.
- `padding: 1.5rem`: Khoảng đệm bên trong = 24px. Nội dung không sát viền trình duyệt.

```css
.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
```
- `display: flex`: Bật Flexbox cho header.
- `justify-content: space-between`: Đẩy phần tử con ra 2 đầu.
  - Tiêu đề nằm bên trái, nút "+ Thêm công việc" nằm bên phải.
- `align-items: center`: Căn giữa theo trục dọc (chữ h1 to và nút nhỏ cùng ngang nhau).

```css
.board-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  min-height: 70vh;
}
```
- `display: grid`: Bật CSS Grid – hệ thống bố cục 2 chiều mạnh mẽ hơn Flexbox cho layout lưới.
- `grid-template-columns: repeat(3, 1fr)`: Tạo 3 cột bằng nhau.
  - `repeat(3, ...)`: Lặp 3 lần.
  - `1fr`: Fractional unit. Mỗi cột chiếm 1 phần bằng nhau trong không gian còn lại.
  - 3 cột × `1fr` = mỗi cột = 33.33% chiều rộng.
- `gap: 1.5rem`: Khoảng cách giữa các cột = 24px.
- `min-height: 70vh`: Chiều cao tối thiểu = 70% viewport. Cột không bị quá thấp khi chưa có task.

```css
.board-column {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: var(--shadow);
}
```
- Mỗi cột là 1 card trắng, bo tròn, có bóng đổ nhẹ.

```css
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
  margin-bottom: 1rem;
}
```
- `border-bottom: 2px solid #f1f5f9`: Đường kẻ ngang nhẹ phân cách header với body.

```css
.task-count {
  background: var(--primary-color);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
```
- Badge tròn hiện số lượng task. `border-radius: 999px` = tròn hoàn hảo (giá trị lớn hơn nửa kích thước).

```css
.task-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border-left: 3px solid transparent;
}
```
- `cursor: pointer`: Con trỏ bàn tay khi hover → Báo hiệu "có thể click".
- `transition: transform 0.15s ease, box-shadow 0.15s ease`: Khi CSS thay đổi `transform` hoặc `box-shadow`, chuyển đổi mượt 0.15 giây.
  - 2 thuộc tính tách bằng dấu phẩy.
- `border-left: 3px solid transparent`: Viền trái 3px, màu trong suốt (ẩn). Hover sẽ đổi màu.

```css
.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-color);
}
```
- `transform: translateY(-2px)`: Di chuyển card lên 2px → Hiệu ứng "nổi lên" khi hover.
- `box-shadow: 0 4px 12px ...`: Bóng đổ đậm hơn → Card nổi bật hơn.
- `border-left-color: var(--primary-color)`: Viền trái đổi sang màu indigo → Điểm nhấn trực quan.

```css
.task-card-priority {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}
```
- `display: inline-block`: Badge priority nằm cùng dòng nhưng có width/height (khác `inline`).
- `text-transform: uppercase`: Chuyển text thành CHỮ HOA. "High" → "HIGH".
- Badge nhỏ gọn ở góc trên card, màu sắc do JS set qua `style="background: ..."`.

```css
.task-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}
```
- Footer card: Bên trái hiện assignee 👤, bên phải hiện deadline 📅.
- `color: var(--text-muted)`: Màu xám nhạt cho thông tin phụ.

---

### Responsive cho Mobile

```css
@media (max-width: 768px) {
  .board-columns {
    grid-template-columns: 1fr;
  }
}
```
- `@media (max-width: 768px)`: Media query. CSS bên trong chỉ áp dụng khi màn hình ≤ 768px (tablet/mobile).
- `grid-template-columns: 1fr`: Đổi từ 3 cột thành 1 cột. Các cột xếp chồng dọc.
- Tại sao 768px? Là breakpoint phổ biến cho tablet. iPad portrait = 768px.

---

# FILE 17: `public/js/board.js` (Bổ sung – Modal chi tiết Task)

### Hàm hiện modal chi tiết task

```javascript
function showTaskDetail(task) {
```
- Nhận object `task` (từ data đã fetch) và hiện modal để xem/sửa.

```javascript
  let existingModal = document.getElementById('task-detail-modal');
  if (existingModal) existingModal.remove();
```
- Kiểm tra: Nếu modal cũ đang tồn tại → Xóa luôn trước khi tạo mới.
- `.remove()`: Xóa phần tử DOM. Tránh chồng modal lên nhau.

```javascript
  const modal = document.createElement('div');
  modal.id = 'task-detail-modal';
  modal.className = 'modal-overlay';
```
- Tạo modal bằng JS thuần (dynamic creation), không viết sẵn trong HTML.
- Tại sao? Vì mỗi task có data khác nhau. Tạo động linh hoạt hơn.

```javascript
  modal.innerHTML = `
    <div class="modal-card modal-large">
      <div class="modal-close" id="btn-close-detail">&times;</div>

      <h2>${task.title}</h2>
      <p class="text-muted">${task.description || 'Không có mô tả'}</p>

      <div class="task-detail-grid">
        <div class="detail-item">
          <label>Trạng thái</label>
          <select id="task-status-select">
            <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>📋 To Do</option>
            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
            <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>✅ Done</option>
          </select>
        </div>
```
- `&times;`: HTML entity cho ký tự ✕ (dấu nhân). Dùng làm nút đóng modal.
- `<select>`: Dropdown chọn trạng thái.
- `${task.status === 'To Do' ? 'selected' : ''}`: Nếu task đang ở "To Do" → Thêm attribute `selected` → Dropdown hiện đúng trạng thái hiện tại.
  - `selected`: Attribute HTML đánh dấu option được chọn mặc định.
  - Nếu không có `selected`, dropdown luôn hiện option đầu tiên bất kể status thật.

```javascript
        <div class="detail-item">
          <label>Ưu tiên</label>
          <select id="task-priority-select">
            <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>🟢 Low</option>
            <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>🟡 Medium</option>
            <option value="High" ${task.priority === 'High' ? 'selected' : ''}>🔴 High</option>
          </select>
        </div>
      </div>
```
- Tương tự dropdown status. Emoji tròn màu giúp nhận biết trực quan.

```javascript
      <button class="btn-primary" id="btn-save-task" style="margin-top: 1rem;">
        Lưu thay đổi
      </button>

      <hr style="margin: 1.5rem 0;">

      <h3>💬 Bình luận</h3>
      <div id="comments-container"></div>

      <form id="comment-form" style="margin-top: 1rem;">
        <textarea id="comment-input" placeholder="Viết bình luận..." rows="2" required></textarea>
        <button type="submit" class="btn-primary" style="margin-top: 0.5rem;">Gửi</button>
      </form>
    </div>
  `;
```
- `<hr>`: Đường kẻ ngang phân cách phần edit task và phần comments.
- `id="comments-container"`: Container rỗng. JS sẽ fetch comments rồi render vào đây.
- `<form id="comment-form">`: Form gửi comment mới. `<textarea>` cho phép nhập đa dòng.

```javascript
  document.body.appendChild(modal);
```
- Gắn modal vào cuối `<body>`. Modal hiện lên trang.

```javascript
  modal.style.display = 'flex';
```
- Hiện modal. `flex` để CSS căn giữa nội dung.

---

### Bắt sự kiện trên modal chi tiết

```javascript
  document.getElementById('btn-close-detail').addEventListener('click', () => {
    modal.remove();
  });
```
- Bấm dấu ✕ → Xóa modal khỏi DOM.

```javascript
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
```
- Click vào overlay tối → Đóng modal. Click vào card → Không đóng.

---

### Lưu thay đổi Task (Update Status/Priority)

```javascript
  document.getElementById('btn-save-task').addEventListener('click', async () => {
    const newStatus = document.getElementById('task-status-select').value;
    const newPriority = document.getElementById('task-priority-select').value;
```
- `.value` của `<select>`: Giá trị attribute `value` của `<option>` đang được chọn.

```javascript
    try {
      const response = await fetch(
        `/api/v1/projects/${projectId}/tasks/${task._id}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            status: newStatus,
            priority: newPriority
          })
        }
      );
```
- `method: 'PUT'`: HTTP PUT = cập nhật tài nguyên.
- URL: `/api/v1/projects/<projectId>/tasks/<taskId>`.
- Body: Chỉ gửi trường cần sửa. Service sẽ dùng whitelist để chỉ cập nhật trường cho phép.

```javascript
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      modal.remove();
      loadBoard();
```
- Cập nhật thành công → Đóng modal → Reload board (cards tự chuyển cột).

```javascript
    } catch (error) {
      alert(error.message);
    }
  });
```

---

### Load bình luận trong modal

```javascript
  loadComments(task._id);
```
- Gọi ngay khi modal mở để fetch comments.

```javascript
async function loadComments(taskId) {
  try {
    const response = await fetch(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
      { headers: authHeaders() }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    const container = document.getElementById('comments-container');
    container.innerHTML = '';
```
- Gọi API lấy comments của task → Xóa nội dung cũ → Render mới.

```javascript
    if (data.data.comments.length === 0) {
      container.innerHTML = '<p class="text-muted">Chưa có bình luận nào</p>';
      return;
    }
```
- Trường hợp chưa có comment → Hiện thông báo.

```javascript
    data.data.comments.forEach(comment => {
      const commentEl = document.createElement('div');
      commentEl.className = 'comment-item';

      const timeAgo = getTimeAgo(comment.createdAt);
```
- `getTimeAgo()`: Hàm chuyển timestamp thành dạng "5 phút trước", "2 giờ trước".

```javascript
      commentEl.innerHTML = `
        <div class="comment-header">
          <strong>${comment.author.name}</strong>
          <span class="text-muted">${timeAgo}</span>
        </div>
        <p class="comment-content">${comment.content}</p>
      `;
```
- `comment.author.name`: Tên tác giả (đã populate từ backend).
- `comment.content`: Nội dung bình luận.

```javascript
      container.appendChild(commentEl);
    });
  } catch (error) {
    console.error('Lỗi load comments:', error);
  }
}
```

---

### Gửi comment mới

```javascript
  document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const content = document.getElementById('comment-input').value.trim();
```
- Lấy nội dung comment, xóa khoảng trắng.

```javascript
    if (!content) return;
```
- Comment rỗng → Bỏ qua.

```javascript
    try {
      const response = await fetch(
        `/api/v1/projects/${projectId}/tasks/${task._id}/comments`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ content })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      document.getElementById('comment-input').value = '';
      loadComments(task._id);
```
- Gửi comment → Xóa ô input → Load lại danh sách comments (hiện comment mới nhất).

```javascript
    } catch (error) {
      alert(error.message);
    }
  });
```

---

### Hàm tính "thời gian trước"

```javascript
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
```
- `new Date(dateString)`: Parse chuỗi ISO `"2026-04-03T10:30:00Z"` thành object Date.
- `now - date`: Phép trừ 2 Date trả về số milliseconds chênh lệch.
- `/ 1000`: Chuyển milliseconds → seconds.
- `Math.floor(...)`: Làm tròn xuống. `59.7` → `59`.

```javascript
  if (seconds < 60) return 'Vừa xong';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;

  return date.toLocaleDateString('vi-VN');
}
```
- Chuỗi if else: Dưới 60 giây = "Vừa xong". Dưới 60 phút = "X phút trước". Dưới 24 giờ = "X giờ trước". Dưới 30 ngày = "X ngày trước". Trên 30 ngày = Hiện ngày tháng Việt Nam.
- Giống logic "3 hours ago" trên Facebook / YouTube.

---

# FILE 18: `src/routes/viewRoutes.js` (Bổ sung route render EJS)

```javascript
const express = require('express');
const router = express.Router();
```

```javascript
router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Đăng Nhập - TaskFlow' });
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Đăng Ký - TaskFlow' });
});
```
- 3 route từ Sprint 1 (giữ nguyên).

```javascript
router.get('/projects', (req, res) => {
  res.render('project/index', { title: 'Dự Án - TaskFlow' });
});
```
- `GET /projects`: Render trang danh sách project. EJS file: `views/project/index.ejs`.
- Trang này chỉ là HTML khung. Dữ liệu project được JS fetch từ API và render client-side.

```javascript
router.get('/projects/:projectId/board', (req, res) => {
  res.render('project/board', { title: 'Board - TaskFlow' });
});
```
- `GET /projects/:projectId/board`: Render trang Board Kanban.
- `:projectId` trong URL sẽ bị JS client lấy bằng `window.location.pathname.split('/')[2]`.
- Không cần truyền `projectId` vào EJS vì JS client tự rút từ URL.

```javascript
module.exports = router;
```

**Cập nhật trong app.js:** (Nếu chưa gắn)
```javascript
const viewRoutes = require('./routes/viewRoutes');
app.use('/', viewRoutes);
```

---

# FILE 19: CSS bổ sung cho Modal (`public/css/style.css` – thêm vào cuối)

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
```
- `position: fixed`: Cố định trên viewport. Không bị ảnh hưởng bởi scroll.
- `top: 0; left: 0; width: 100%; height: 100%`: Phủ kín toàn màn hình.
- `background: rgba(0,0,0,0.5)`: Nền đen trong suốt 50% → Hiệu ứng tối mờ phía sau.
- `z-index: 1000`: Nằm trên tất cả phần tử khác. Số càng cao → Càng nằm trên.
  - Navbar thường `z-index: 100`. Modal cần cao hơn → `1000`.

```css
.modal-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 480px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}
```
- `position: relative`: Để phần tử con (nút đóng) có thể dùng `position: absolute` định vị theo card.
- `max-height: 90vh`: Card tối đa 90% chiều cao viewport. Nếu nội dung dài → Xuất hiện scroll.
- `overflow-y: auto`: Tự thêm scrollbar dọc khi nội dung tràn.

```css
.modal-large {
  max-width: 600px;
}
```
- Modal chi tiết task rộng hơn modal tạo project (600px vs 480px).

```css
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: #f1f5f9;
}
```
- `position: absolute`: Nằm góc phải trên của `modal-card` (cha là `relative`).
- `border-radius: 50%`: Hình tròn. `50%` của hình vuông 32×32 = tròn hoàn hảo.
- Hover: Nền xám nhẹ → Feedback trực quan khi rê chuột.

---

# FILE 20: CSS cho Comments

```css
.comment-item {
  padding: 0.75rem;
  border-left: 3px solid var(--primary-color);
  background: #f8fafc;
  border-radius: 0 8px 8px 0;
  margin-bottom: 0.75rem;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
}

.comment-content {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-color);
}

#comment-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
}
```
- `border-left: 3px solid indigo`: Viền trái trang trí, giống style comment Slack/Discord.
- `border-radius: 0 8px 8px 0`: Bo tròn 3 góc, góc trái trên/dưới giữ vuông (vì có border-left).
  - Thứ tự: trên-trái, trên-phải, dưới-phải, dưới-trái.
- `font-family: inherit`: Textarea mặc định dùng font monospace. `inherit` bắt nó dùng font của cha (Inter).
- `resize: vertical`: Cho phép kéo thay đổi chiều cao textarea (không được kéo ngang).

---

# FILE 21: `src/services/dashboardService.js` (Thống kê Dashboard)

```javascript
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
```

```javascript
exports.getDashboardStats = async (userId) => {
```
- `userId`: Lấy thống kê cho user đang login.

```javascript
  const myProjects = await Project.find({
    members: userId,
    isDeleted: false
  });
```
- Tìm tất cả project user tham gia VÀ đang hoạt động.

```javascript
  const projectIds = myProjects.map(p => p._id);
```
- `.map(p => p._id)`: Rút mảng ID từ mảng project objects.
  - Input: `[{ _id: "a", name: "X" }, { _id: "b", name: "Y" }]`
  - Output: `["a", "b"]`
  - Mảng ID này dùng cho query tasks thuộc các project của user.

```javascript
  const allTasks = await Task.find({
    projectId: { $in: projectIds },
    isDeleted: false
  });
```
- `{ $in: projectIds }`: Toán tử MongoDB `$in` = "nằm trong danh sách".
  - `projectId: { $in: ["a", "b"] }` → Tìm tasks có projectId là "a" HOẶC "b".
  - Tương đương SQL: `WHERE projectId IN ('a', 'b')`.
- Kết quả: Tất cả tasks thuộc tất cả project của user.

```javascript
  const totalTasks = allTasks.length;
  const todoCount = allTasks.filter(t => t.status === 'To Do').length;
  const inProgressCount = allTasks.filter(t => t.status === 'In Progress').length;
  const doneCount = allTasks.filter(t => t.status === 'Done').length;
```
- `.filter(...)`: Lọc tasks theo status rồi đếm `.length`.
- Tại sao filter ở JS thay vì filter ở MongoDB?
  - Vì ta đã có `allTasks` rồi (1 query), filter JS nhanh hơn gọi thêm 3 query DB.
  - Nếu dữ liệu lớn (hàng triệu tasks), nên dùng aggregation MongoDB thay thế.

```javascript
  const overdueTasks = allTasks.filter(task => {
    if (!task.deadline) return false;
    return new Date(task.deadline) < new Date() && task.status !== 'Done';
  }).length;
```
- **Tính `isOverdue` on-the-fly** (tính ngay lúc cần, không lưu DB):
  - `!task.deadline`: Không có deadline → Không thể trễ hạn → `false`.
  - `new Date(task.deadline) < new Date()`: Deadline đã qua thời điểm hiện tại.
  - `task.status !== 'Done'`: Chỉ tính trễ nếu chưa hoàn thành.
  - Cả 2 điều kiện đúng → Task trễ hạn.
- Tại sao không lưu `isOverdue` trong DB?
  - Vì `isOverdue` thay đổi theo thời gian (tự động trở thành `true` khi đến hạn).
  - Nếu lưu DB → Phải có cron job cập nhật mỗi phút → Phức tạp, dễ sai.
  - Tính on-the-fly → Luôn chính xác. Trade-off: Chậm hơn 1 chút nhưng đơn giản.

```javascript
  return {
    totalProjects: myProjects.length,
    totalTasks,
    todoCount,
    inProgressCount,
    doneCount,
    overdueTasks,
    completionRate: totalTasks > 0
      ? Math.round((doneCount / totalTasks) * 100)
      : 0
  };
};
```
- `totalProjects`: Số project đang tham gia.
- `completionRate`: Tỷ lệ hoàn thành (% tasks Done).
  - `totalTasks > 0`: Tránh chia cho 0 (NaN).
  - `Math.round(...)`: Làm tròn. `33.333` → `33`.
  - `(doneCount / totalTasks) * 100`: VD: 3/10 × 100 = 30%.

---

# FILE 22: `src/controllers/dashboardController.js` + Route

**Controller:**
```javascript
const dashboardService = require('../services/dashboardService');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user._id);

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};
```

**Route (`src/routes/dashboardRoutes.js`):**
```javascript
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/stats', dashboardController.getStats);

module.exports = router;
```
- `GET /api/v1/dashboard/stats`: Trả object thống kê cho Frontend hiển thị.

**Gắn vào app.js:**
```javascript
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/v1/dashboard', dashboardRoutes);
```
