# GIẢI THÍCH TỪNG DÒNG CODE – SPRINT 2 (PHẦN 1: PROJECT MODULE)

Sprint 2 xây dựng toàn bộ CRUD cho Project, Task, Comment. Phần 1 tập trung vào **Module Project** – trái tim quản lý không gian làm việc.

---

# FILE 1: `src/middlewares/checkProjectMembership.js` (Lính gác quyền truy cập Project)

**File này là "tấm khiên" bảo vệ xuyên suốt Sprint 2, 3. Mọi thao tác Task/Comment đều phải qua đây.**

```javascript
const Project = require('../models/projectModel');
```
- Import Model Project để truy vấn danh sách thành viên.

```javascript
const AppError = require('../utils/AppError');
```
- Import class lỗi tùy chỉnh.

```javascript
const checkProjectMembership = async (req, res, next) => {
```
- `checkProjectMembership`: Middleware kiểm tra user hiện tại có phải thành viên của project không.
- `async`: Bên trong có `await` query DB.
- `(req, res, next)`: 3 tham số chuẩn middleware Express.

```javascript
  try {
    const projectId = req.params.projectId;
```
- `req.params`: Object chứa các tham số trên URL.
  - URL mẫu: `/api/v1/projects/:projectId/tasks` → request `/api/v1/projects/abc123/tasks`.
  - `req.params.projectId` = `"abc123"`.
- `:projectId`: Phần có dấu `:` trong route definition là "dynamic parameter" (tham số động).

```javascript
    if (!projectId) {
      return next(new AppError('Thiếu Project ID', 400));
    }
```
- Phòng trường hợp URL không có projectId (route được gắn sai).

```javascript
    const project = await Project.findById(projectId);
```
- `Project.findById(projectId)`: Tìm document Project theo `_id`.
  - Tương đương: `Project.findOne({ _id: projectId })`.
  - Nếu `projectId` không phải ObjectId hợp lệ → Mongoose throw `CastError` → Error Handler sẽ xử lý.

```javascript
    if (!project) {
      return next(new AppError('Không tìm thấy dự án', 404));
    }
```
- `findById` trả `null` nếu không tìm thấy → Lỗi 404.

```javascript
    const isMember = project.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );
```
- `project.members`: Mảng các ObjectId (ID của các thành viên).
- `.some(callback)`: Duyệt mảng, trả `true` nếu BẤT KỲ phần tử nào thỏa điều kiện.
  - `some` dừng ngay khi tìm thấy 1 phần tử thỏa → Nhanh hơn `.filter()` hay `.find()` khi chỉ cần biết "có hay không".
- `memberId.toString()`: Chuyển ObjectId thành chuỗi string.
  - ObjectId là object đặc biệt của MongoDB. Không thể so sánh bằng `===` trực tiếp.
  - `new ObjectId("abc") === new ObjectId("abc")` → `false` (2 object khác nhau trong bộ nhớ).
  - `"abc" === "abc"` → `true` (so sánh giá trị chuỗi).
- `req.user._id.toString()`: ID của user hiện tại (được gắn bởi `protect` middleware ở Sprint 1).
- Kết quả: `isMember` = `true` (user trong project) hoặc `false` (user ngoại lai).

```javascript
    if (!isMember) {
      return next(new AppError('Bạn không có quyền truy cập dự án này', 403));
    }
```
- `403 Forbidden`: Server hiểu request, biết bạn là ai, nhưng bạn không có phận sự ở đây.
- Khác `401 Unauthorized`: 401 = chưa xác thực (chưa login). 403 = đã xác thực nhưng không đủ quyền.

```javascript
    req.project = project;
```
- Gắn object project vào `req` để controller phía sau dùng lại.
- Tại sao? Để tránh query DB lần 2. Controller cần project info thì lấy luôn từ `req.project`.

```javascript
    next();
  } catch (error) {
    next(error);
  }
};
```
- `next()`: Mọi thứ OK, cho request đi tiếp.
- `catch`: Bắt lỗi không lường trước (DB disconnect, v.v.) → Đẩy cho Error Handler.

```javascript
module.exports = checkProjectMembership;
```

---

# FILE 2: `src/middlewares/restrictToOwner.js` (Chặn nếu không phải chủ dự án)

```javascript
const AppError = require('../utils/AppError');
```

```javascript
const restrictToOwner = (req, res, next) => {
```
- Middleware này chạy SAU `checkProjectMembership` → `req.project` đã có sẵn.

```javascript
  if (req.project.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('Chỉ chủ dự án mới có quyền thực hiện hành động này', 403));
  }
```
- `req.project.owner`: ObjectId của người tạo project.
- So sánh chuỗi: Owner ID có trùng với ID người đang gọi API không?
- Nếu không trùng → Bạn chỉ là member thường, không được phép xóa project / mời thành viên.

```javascript
  next();
};

module.exports = restrictToOwner;
```

---

# FILE 3: `src/services/projectService.js` (Logic nghiệp vụ Project)

### Hàm tạo Project

```javascript
const Project = require('../models/projectModel');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
```
- Import 3 thứ: Model Project (thao tác DB), Model User (tìm email khi mời member), AppError.

```javascript
exports.createProject = async (projectData, userId) => {
```
- `projectData`: Object `{ name, description }` từ `req.body`.
- `userId`: ID của người đang đăng nhập. Controller sẽ truyền `req.user._id`.
- Tách riêng `userId` thay vì để trong `projectData` → Đảm bảo client không thể tự gửi `owner: "fakeId"` để chiếm quyền.

```javascript
  const project = await Project.create({
    name: projectData.name,
    description: projectData.description || '',
    owner: userId,
    members: [userId]
  });
```
- `Project.create({...})`: Tạo document mới và insert vào MongoDB.
- `owner: userId`: Người tạo project tự động thành owner.
- `members: [userId]`: Owner cũng là member. Mảng `members` khởi tạo chứa sẵn ID owner.
  - Tại sao owner cũng nằm trong members? Vì khi kiểm tra quyền truy cập task, ta chỉ check `members.includes(userId)`. Nếu owner không nằm trong members, owner sẽ không truy cập được task trong project của chính mình!
- `description: projectData.description || ''`: Nếu client không gửi description → dùng chuỗi rỗng.

```javascript
  return project;
};
```
- Trả về document project vừa tạo (MongoDB đã tự gán `_id` và `timestamps`).

---

### Hàm lấy danh sách Project của tôi

```javascript
exports.getMyProjects = async (userId) => {
```
- `userId`: ID của user đang login. Chỉ trả về projects mà user này tham gia.

```javascript
  const projects = await Project.find({
    members: userId,
    isDeleted: false
  })
```
- `Project.find({...})`: Tìm TẤT CẢ documents thỏa điều kiện (khác `findOne` chỉ trả 1).
- `members: userId`: Điều kiện "mảng `members` chứa giá trị `userId`".
  - MongoDB tự hiểu: Khi so sánh 1 giá trị với 1 trường mảng, nó kiểm tra CÓ phần tử nào match hay không.
  - Ví dụ: `members = [id1, id2, id3]`, query `members: id2` → MATCH (vì id2 nằm trong mảng).
- `isDeleted: false`: Chỉ lấy project đang hoạt động (chưa bị xóa mềm).

```javascript
  .populate('owner', 'name email avatar')
```
- `.populate(field, selectFields)`: Thay thế ObjectId bằng document thật.
  - TRƯỚC populate: `owner: "60d5f484c3f2a1..."` (chuỗi ID vô nghĩa).
  - SAU populate: `owner: { _id: "60d5f...", name: "Nguyễn Văn A", email: "a@gmail.com", avatar: "https://..." }`.
- `'name email avatar'`: Chỉ lấy 3 trường này từ User. Không lấy password, refreshToken (tiết kiệm băng thông + bảo mật).
- Cách populate hoạt động nội bộ: Mongoose gửi thêm 1 query riêng tới collection `users` → JOIN giả lập ở tầng application.

```javascript
  .sort({ createdAt: -1 });
```
- `.sort({ createdAt: -1 })`: Sắp xếp theo ngày tạo giảm dần.
  - `-1` = descending (mới nhất trước). `1` = ascending (cũ nhất trước).
  - Project tạo gần đây nhất nằm đầu danh sách.

```javascript
  return projects;
};
```
- Trả về mảng projects. Nếu user chưa tham gia project nào → Mảng rỗng `[]`.

---

### Hàm mời thành viên

```javascript
exports.addMember = async (projectId, email, requestUserId) => {
```
- `projectId`: ID project muốn thêm member.
- `email`: Email người được mời.
- `requestUserId`: ID người đang gọi API (phải là owner mới được mời).

```javascript
  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new AppError('Không tìm thấy dự án', 404);
  }
```
- Tìm project. `project.isDeleted`: Kiểm tra thêm cờ xóa mềm.

```javascript
  if (project.owner.toString() !== requestUserId.toString()) {
    throw new AppError('Chỉ chủ dự án mới có quyền mời thành viên', 403);
  }
```
- CHECK 1: Người gọi có phải owner không?
- Tại sao check ở service mà không dùng middleware? Cả 2 cách đều được. Ở đây check trong service cho gọn vì logic đã phức tạp.

```javascript
  const userToAdd = await User.findOne({ email: email });

  if (!userToAdd) {
    throw new AppError('Không tìm thấy tài khoản với email này', 404);
  }
```
- CHECK 2: Email được mời có tồn tại trong hệ thống không?
- `User.findOne({ email })`: Tìm user theo email.
- Nếu `null` → Email chưa đăng ký → Không thể mời.

```javascript
  const isAlreadyMember = project.members.some(
    memberId => memberId.toString() === userToAdd._id.toString()
  );

  if (isAlreadyMember) {
    throw new AppError('Thành viên đã có trong dự án', 400);
  }
```
- CHECK 3: Người được mời đã nằm trong project chưa?
- `.some(...)`: Duyệt mảng members, so sánh từng ID.
- Nếu đã là member → Lỗi 400 "đã có rồi". Tránh mảng members bị trùng lặp.

```javascript
  project.members.push(userToAdd._id);
```
- `.push(value)`: Thêm phần tử mới vào cuối mảng.
- `userToAdd._id`: ID của user được mời.
- Sau dòng này, mảng `members` có thêm 1 phần tử. Nhưng CHƯA lưu vào DB.

```javascript
  await project.save();
```
- `.save()`: Lưu thay đổi xuống MongoDB.
- Mongoose sẽ so sánh document hiện tại với bản gốc, chỉ gửi phần thay đổi (trường `members`).
- `pre('save')` hooks (nếu có) sẽ chạy trước khi lưu.

```javascript
  return project;
};
```

---

### Hàm xóa Project (Soft Delete)

```javascript
exports.deleteProject = async (projectId, requestUserId) => {
```
- `projectId`: Project cần xóa.
- `requestUserId`: Ai đang yêu cầu xóa (phải là owner).

```javascript
  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new AppError('Không tìm thấy dự án', 404);
  }

  if (project.owner.toString() !== requestUserId.toString()) {
    throw new AppError('Chỉ chủ dự án mới có quyền xóa', 403);
  }
```
- Tìm project + check quyền owner. Giống logic addMember.

```javascript
  project.isDeleted = true;
  await project.save();
```
- **Soft Delete**: KHÔNG xóa Document khỏi DB. Chỉ lật cờ `isDeleted` thành `true`.
- Tại sao không dùng `Project.deleteOne()`?
  - Xóa cứng (hard delete) → Mất dữ liệu vĩnh viễn, không thể khôi phục.
  - Xóa mềm → Dữ liệu vẫn còn. Admin có thể phục hồi nếu xóa nhầm.
  - Query `getMyProjects` đã filter `isDeleted: false` → User không thấy project đã xóa.

```javascript
  return { message: 'Đã xóa dự án thành công' };
};
```

---

# FILE 4: `src/controllers/projectController.js` (Điều phối Project)

```javascript
const projectService = require('../services/projectService');
```

### Controller tạo Project

```javascript
exports.createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user._id);
```
- `req.body`: Dữ liệu client gửi `{ name, description }`.
- `req.user._id`: ID user đang login (được gắn bởi `protect` middleware).
- Controller chỉ làm 2 việc: Lấy input → Gọi service → Trả output. KHÔNG chứa logic nghiệp vụ.

```javascript
    res.status(201).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};
```

### Controller lấy danh sách

```javascript
exports.getMyProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getMyProjects(req.user._id);

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects }
    });
```
- `results: projects.length`: Đếm số project trả về. Hữu ích cho Frontend hiển thị "Bạn có 5 dự án".
- `.length`: Thuộc tính đếm số phần tử trong mảng.

### Controller mời thành viên

```javascript
exports.addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
```
- Destructuring lấy `email` từ body. Client gửi: `{ "email": "abc@gmail.com" }`.

```javascript
    const project = await projectService.addMember(
      req.params.projectId,
      email,
      req.user._id
    );
```
- `req.params.projectId`: Lấy từ URL `/projects/:projectId/members`.
- Truyền 3 tham số: project nào, mời ai, ai đang mời.

### Controller xóa Project

```javascript
exports.deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(
      req.params.projectId,
      req.user._id
    );

    res.status(200).json({
      status: 'success',
      message: result.message
    });
```
- Xóa mềm thành công → Trả message xác nhận.

---

# FILE 5: `src/routes/projectRoutes.js` (Bảng chỉ đường Project)

```javascript
const express = require('express');
const router = express.Router();

const projectController = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
```
- Import controller và middleware bảo vệ (check JWT).

```javascript
router.use(protect);
```
- `router.use(protect)`: Gắn middleware `protect` cho TẤT CẢ route bên dưới trong router này.
- Nghĩa là: Mọi endpoint project đều yêu cầu đăng nhập. Không cần ghi `protect` trước từng route.
- Khác với ghi từng route: `router.get('/', protect, controller.xxx)` → Phải lặp lại `protect` cho mỗi route.

```javascript
router
  .route('/')
  .get(projectController.getMyProjects)
  .post(projectController.createProject);
```
- `.route('/')`: Gom nhóm các route cùng path `/`.
- `.get(...)`: `GET /api/v1/projects` → Lấy danh sách.
- `.post(...)`: `POST /api/v1/projects` → Tạo mới.
- Viết chuỗi (chaining) giúp code gọn hơn thay vì:
  ```javascript
  router.get('/', projectController.getMyProjects);
  router.post('/', projectController.createProject);
  ```

```javascript
router.post('/:projectId/members', projectController.addMember);
```
- `POST /api/v1/projects/:projectId/members`: Mời thành viên vào project cụ thể.
- `:projectId`: Parameter động, truy cập qua `req.params.projectId`.

```javascript
router.delete('/:projectId', projectController.deleteProject);
```
- `DELETE /api/v1/projects/:projectId`: Xóa (mềm) project.

```javascript
const taskRoutes = require('./taskRoutes');
router.use('/:projectId/tasks', taskRoutes);
```
- **Nested Routes (Route lồng nhau)**: Đây la kỹ thuật quan trọng!
- `router.use('/:projectId/tasks', taskRoutes)`: Mọi request có dạng `/projects/:projectId/tasks/...` sẽ được chuyển tiếp sang `taskRoutes` xử lý.
- Ví dụ: `POST /api/v1/projects/abc123/tasks` → Express strip prefix, taskRoutes nhận path `/`.
- Nhờ vậy taskRoutes không cần biết projectId nằm ở đâu → Tách biệt rõ ràng.

```javascript
module.exports = router;
```

**Gắn vào app.js:**
```javascript
const projectRoutes = require('./routes/projectRoutes');
app.use('/api/v1/projects', projectRoutes);
```

---

# FILE 6: `src/services/taskService.js` (Logic nghiệp vụ Task)

### Hàm tạo Task

```javascript
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const AppError = require('../utils/AppError');
```

```javascript
exports.createTask = async (taskData, projectId, userId) => {
```
- `taskData`: `{ title, description, status, priority, deadline, assignee }` từ body.
- `projectId`: Từ URL params.
- `userId`: Người đang login.

```javascript
  const project = await Project.findOne({ _id: projectId, isDeleted: false });

  if (!project) {
    throw new AppError('Không tìm thấy dự án', 404);
  }
```
- Tìm project chưa bị xóa. Kết hợp 2 điều kiện `_id` + `isDeleted` trong 1 query.

```javascript
  const isMember = project.members.some(
    m => m.toString() === userId.toString()
  );

  if (!isMember) {
    throw new AppError('Bạn không phải thành viên của dự án này', 403);
  }
```
- Check quyền: Chỉ member mới được tạo task.

```javascript
  if (taskData.assignee) {
    const isAssigneeMember = project.members.some(
      m => m.toString() === taskData.assignee.toString()
    );

    if (!isAssigneeMember) {
      throw new AppError('Người được giao việc không thuộc dự án này', 400);
    }
  }
```
- **Nested Constraint (Ràng buộc lồng)**: Nếu client gửi kèm `assignee` (giao việc cho ai đó):
  - Phải kiểm tra người đó CÓ nằm trong `project.members` không.
  - Không thể giao việc cho người ngoài project.
- `if (taskData.assignee)`: Chỉ check nếu client có gửi assignee. Task không bắt buộc phải giao cho ai.

```javascript
  const task = await Task.create({
    title: taskData.title,
    description: taskData.description,
    status: taskData.status || 'To Do',
    priority: taskData.priority || 'Medium',
    deadline: taskData.deadline,
    assignee: taskData.assignee,
    projectId: projectId
  });
```
- `status: taskData.status || 'To Do'`: Nếu client không gửi status → mặc định "To Do".
- `projectId: projectId`: Gắn task vào project. Trường này lấy từ URL, KHÔNG cho client tự gửi (bảo mật).

```javascript
  return task;
};
```

### Hàm cập nhật Task

```javascript
exports.updateTask = async (taskId, updateData, userId) => {
```
- `taskId`: ID task cần sửa.
- `updateData`: Object chứa trường cần cập nhật (có thể chỉ 1 trường `{ status: "Done" }`).

```javascript
  const task = await Task.findOne({ _id: taskId, isDeleted: false });

  if (!task) {
    throw new AppError('Không tìm thấy công việc', 404);
  }
```

```javascript
  const project = await Project.findById(task.projectId);

  const isMember = project.members.some(
    m => m.toString() === userId.toString()
  );

  if (!isMember) {
    throw new AppError('Bạn không có quyền sửa công việc này', 403);
  }
```
- Từ task lấy ra `projectId` → Tìm project → Check user có trong members không.
- Luồng: Task → thuộc Project nào → User có trong Project đó không.

```javascript
  const allowedFields = ['title', 'description', 'status', 'priority', 'deadline', 'assignee'];

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      task[field] = updateData[field];
    }
  });
```
- **Whitelist Fields**: Chỉ cho phép cập nhật những trường trong danh sách.
- `allowedFields`: Mảng tên các trường được phép sửa.
- `.forEach(field => {...})`: Duyệt từng trường.
- `updateData[field] !== undefined`: Kiểm tra client có gửi trường này không.
  - Dùng `!== undefined` thay vì `if (updateData[field])` → Vì giá trị có thể là `""` (chuỗi rỗng) hay `null` (xóa assignee). Những giá trị này falsy nhưng hợp lệ.
- `task[field] = updateData[field]`: Gán giá trị mới. Cú pháp bracket notation cho phép dùng biến làm key.
  - Tương đương: `task.status = updateData.status` (nhưng linh hoạt hơn vì `field` là biến).
- Tại sao whitelist? Nếu gán thẳng `Object.assign(task, updateData)`, client có thể gửi `{ projectId: "khác", isDeleted: true }` để hack chuyển task sang project khác hoặc tự xóa task.

```javascript
  await task.save();

  return task;
};
```
- Lưu thay đổi vào DB. Mongoose chỉ gửi phần thay đổi (dirty fields).

### Hàm lấy danh sách Task (có filter)

```javascript
exports.getProjectTasks = async (projectId, queryParams) => {
```
- `projectId`: Lấy tasks của project nào.
- `queryParams`: Object từ `req.query`. Ví dụ URL: `?status=Done&priority=High` → `{ status: "Done", priority: "High" }`.

```javascript
  const filter = { projectId: projectId, isDeleted: false };
```
- Bắt đầu xây object filter. 2 điều kiện cố định: thuộc project này + chưa bị xóa.

```javascript
  if (queryParams.status) {
    filter.status = queryParams.status;
  }

  if (queryParams.priority) {
    filter.priority = queryParams.priority;
  }

  if (queryParams.assignee) {
    filter.assignee = queryParams.assignee;
  }
```
- Thêm điều kiện filter TÙY CHỌN. Chỉ thêm nếu client gửi.
- Ví dụ: Client gọi `?status=Done` → `filter = { projectId: "...", isDeleted: false, status: "Done" }`.
- Client không gửi gì → `filter` chỉ có `projectId` + `isDeleted`. Trả tất cả tasks.

```javascript
  const tasks = await Task.find(filter)
    .populate('assignee', 'name avatar')
    .sort({ createdAt: -1 });
```
- `Task.find(filter)`: Query MongoDB với bộ lọc đã xây.
- `.populate('assignee', 'name avatar')`: Thay ObjectId assignee bằng object User (chỉ lấy name + avatar).
  - Frontend cần hiển thị avatar tròn nhỏ góc dưới mỗi card task.
- `.sort({ createdAt: -1 })`: Mới nhất trước.

```javascript
  return tasks;
};
```

---

# FILE 7: `src/controllers/taskController.js`

```javascript
const taskService = require('../services/taskService');

exports.createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(
      req.body,
      req.params.projectId,
      req.user._id
    );
```
- `req.params.projectId`: Từ nested route `/projects/:projectId/tasks`.
  - Để nhận được params từ route cha, taskRoutes phải bật `mergeParams: true` (xem file Routes).

```javascript
    res.status(201).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};
```

```javascript
exports.updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.params.taskId,
      req.body,
      req.user._id
    );
```
- `req.params.taskId`: Từ route `/tasks/:taskId`.

```javascript
exports.getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getProjectTasks(
      req.params.projectId,
      req.query
    );
```
- `req.query`: Các query params sau dấu `?`.
  - URL: `/projects/abc/tasks?status=Done&priority=High`
  - `req.query` = `{ status: "Done", priority: "High" }`.
  - Express tự parse chuỗi URL thành object.

---

# FILE 8: `src/routes/taskRoutes.js`

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
```
- `{ mergeParams: true }`: **CỰC KỲ QUAN TRỌNG.**
  - Mặc định, child router KHÔNG thấy params của parent router.
  - Parent route (projectRoutes): `/:projectId/tasks` → `req.params.projectId` tồn tại.
  - Nếu không `mergeParams`, bên trong taskRoutes `req.params.projectId` = `undefined`.
  - `mergeParams: true` → Gộp params cha vào → taskRoutes truy cập được `projectId`.

```javascript
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
```
- Mọi route task đều cần đăng nhập.

```javascript
router
  .route('/')
  .get(taskController.getProjectTasks)
  .post(taskController.createTask);
```
- `GET /` → `GET /api/v1/projects/:projectId/tasks` (lấy tasks).
- `POST /` → `POST /api/v1/projects/:projectId/tasks` (tạo task).
- Path `/` vì prefix đã được gắn ở projectRoutes (`/:projectId/tasks`).

```javascript
router.put('/:taskId', taskController.updateTask);
```
- `PUT /:taskId` → `PUT /api/v1/projects/:projectId/tasks/:taskId` (cập nhật).
- `req.params` sẽ có cả `projectId` lẫn `taskId` (nhờ mergeParams).

```javascript
module.exports = router;
```
