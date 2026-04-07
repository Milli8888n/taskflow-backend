# HƯỚNG DẪN TỪNG BƯỚC – SPRINT 2: PROJECT, TASK, COMMENT & REALTIME

Tài liệu này cầm tay chỉ việc (Step-by-step) cho từng Micro-Task trong Sprint 2. Mỗi task được trình bày theo cấu trúc: **Mục tiêu → Các bước thực hiện → Giải thích tại sao → Kiểm tra kết quả**.

---

## S2-01: Viết Project Model (`src/models/projectModel.js`)

**Mục tiêu:** Tạo bảng Projects trong MongoDB, định nghĩa ai là chủ (owner), ai là thành viên (members).

**Bước 1:** Tạo file `src/models/projectModel.js`, viết Schema:
```javascript
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên dự án'],
    trim: true,
    maxlength: [100, 'Tên dự án không quá 100 ký tự']
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dự án phải có chủ sở hữu']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
```

*Giải thích:*
- `ObjectId` + `ref: 'User'`: Tạo liên kết tới bảng Users. Khi dùng `.populate()`, MongoDB sẽ tự join và trả object User thay vì chỉ ID.
- `members: [{ ... }]`: Dấu ngoặc vuông `[]` bọc ngoài = mảng. Mỗi phần tử là 1 ObjectId User.
- `isDeleted`: Soft delete. Không xóa thật khỏi DB, chỉ đánh dấu đã xóa.

**Kiểm tra:** Import Model vào Node REPL (`node -e "require('./src/models/projectModel')"`) không báo lỗi.

---

## S2-02: Viết Task Model (`src/models/taskModel.js`)

**Mục tiêu:** Tạo bảng Tasks. Mỗi task thuộc 1 project, có status, priority, người được giao và deadline.

**Bước 1:** Tạo file `src/models/taskModel.js`:
```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề công việc'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Công việc phải thuộc một dự án']
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deadline: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index để tăng tốc query "lấy tất cả task của 1 project"
taskSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
```

*Giải thích:*
- `enum`: Giới hạn giá trị được chấp nhận. Nếu gửi `status: "ABC"` → Mongoose tự báo lỗi validation.
- `assignee: default: null`: Task mới tạo có thể chưa giao cho ai.
- `taskSchema.index({ projectId: 1, status: 1 })`: Compound Index. MongoDB xây chỉ mục gồm 2 trường, query theo `{ projectId, status }` sẽ cực nhanh (O(log n) thay vì O(n)).

**Kiểm tra:** Không báo lỗi khi import.

---

## S2-03: Viết Comment Model (`src/models/commentModel.js`)

**Mục tiêu:** Tạo bảng Comments. Mỗi comment gắn vào 1 task.

**Bước 1:** Tạo file `src/models/commentModel.js`:
```javascript
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Comment phải thuộc một công việc']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment phải có tác giả']
  },
  content: {
    type: String,
    required: [true, 'Nội dung bình luận không được để trống'],
    trim: true
  }
}, {
  timestamps: true
});

commentSchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
```

*Giải thích:*
- `{ taskId: 1, createdAt: -1 }`: Index sắp xếp theo taskId tăng dần VÀ createdAt giảm dần. Query "lấy comments mới nhất của task X" sẽ rất nhanh.

**Kiểm tra:** Import thành công, không lỗi.

---

## S2-04: Viết Middleware kiểm tra quyền Project

**Mục tiêu:** Tạo 2 middleware bảo vệ route: Kiểm tra user có thuộc project không + Kiểm tra user có phải owner không.

**Bước 1:** Tạo file `src/middlewares/checkProjectMembership.js`:
```javascript
const Project = require('../models/projectModel');
const AppError = require('../utils/AppError');

const checkProjectMembership = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: projectId,
      isDeleted: false
    });

    if (!project) {
      return next(new AppError('Không tìm thấy dự án', 404));
    }

    const isMember = project.members.some(
      member => member.toString() === userId.toString()
    );

    if (!isMember) {
      return next(new AppError('Bạn không phải thành viên của dự án này', 403));
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkProjectMembership;
```

*Giải thích:*
- `.some()` duyệt mảng members, trả `true` nếu ít nhất 1 phần tử thỏa điều kiện.
- `.toString()` vì ObjectId không so sánh `===` trực tiếp được (khác kiểu dữ liệu).
- `req.project = project`: Gắn project vào request để controller phía sau dùng (tránh query lại).

**Bước 2:** Tạo file `src/middlewares/restrictToOwner.js`:
```javascript
const AppError = require('../utils/AppError');

const restrictToOwner = (req, res, next) => {
  if (req.project.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('Chỉ chủ dự án mới được thực hiện thao tác này', 403));
  }
  next();
};

module.exports = restrictToOwner;
```

*Giải thích:*
- Middleware này chạy SAU `checkProjectMembership`, nên `req.project` đã tồn tại.
- Dùng cho các endpoint nhạy cảm: xóa project, xóa member.

**Kiểm tra:** Chưa test được ngay – sẽ test khi có Project Route.

---

## S2-05: Viết Project Service (`src/services/projectService.js`)

**Mục tiêu:** Toàn bộ logic xử lý dự án: Tạo, Lấy danh sách, Lấy chi tiết, Cập nhật, Xóa, Thêm/Xóa thành viên.

**Bước 1:** Viết hàm tạo project:
```javascript
const Project = require('../models/projectModel');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

exports.createProject = async (name, description, userId) => {
  const project = await Project.create({
    name,
    description,
    owner: userId,
    members: [userId]     // Chủ dự án tự động thành thành viên
  });
  return project;
};
```

*Giải thích:*
- `members: [userId]`: Owner cũng là member. Logic membership check sẽ dùng mảng `members`, nếu owner không nằm trong đó thì chính chủ sẽ bị chặn bởi middleware.

**Bước 2:** Viết hàm lấy danh sách project của user:
```javascript
exports.getMyProjects = async (userId) => {
  const projects = await Project.find({
    members: userId,
    isDeleted: false
  })
    .populate('owner', 'name email avatar')
    .sort({ updatedAt: -1 });
  return projects;
};
```

*Giải thích:*
- `{ members: userId }`: MongoDB tự hiểu "tìm documents có mảng `members` chứa `userId`".
- `.populate('owner', 'name email avatar')`: Thay ObjectId của owner bằng object `{ name, email, avatar }`.
- `.sort({ updatedAt: -1 })`: Dự án cập nhật gần nhất hiện trước.

**Bước 3:** Viết các hàm còn lại (chi tiết, cập nhật, xóa, thêm/xóa thành viên):
```javascript
exports.getProjectById = async (projectId) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: false })
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');
  if (!project) throw new AppError('Không tìm thấy dự án', 404);
  return project;
};

exports.updateProject = async (projectId, updateData) => {
  const allowedFields = ['name', 'description'];
  const filtered = {};
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) filtered[field] = updateData[field];
  });

  const project = await Project.findByIdAndUpdate(projectId, filtered, {
    new: true,
    runValidators: true
  });
  return project;
};

exports.deleteProject = async (projectId) => {
  const project = await Project.findByIdAndUpdate(projectId, { isDeleted: true }, { new: true });
  return { message: 'Đã xóa dự án' };
};

exports.addMember = async (projectId, email) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError('Không tìm thấy người dùng với email này', 404);

  const project = await Project.findById(projectId);
  const isAlreadyMember = project.members.some(m => m.toString() === user._id.toString());
  if (isAlreadyMember) throw new AppError('Người này đã là thành viên', 400);

  project.members.push(user._id);
  await project.save();
  return project;
};

exports.removeMember = async (projectId, memberId, requestUserId) => {
  const project = await Project.findById(projectId);

  if (project.owner.toString() !== requestUserId.toString()) {
    throw new AppError('Chỉ chủ dự án mới có quyền xóa thành viên', 403);
  }
  if (memberId === project.owner.toString()) {
    throw new AppError('Không thể xóa chủ dự án', 400);
  }

  const index = project.members.findIndex(m => m.toString() === memberId);
  if (index === -1) throw new AppError('Người này không phải thành viên', 404);

  project.members.splice(index, 1);
  await project.save();
  return project;
};

exports.getMembers = async (projectId) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: false })
    .populate('members', 'name email avatar')
    .populate('owner', 'name email avatar');
  if (!project) throw new AppError('Không tìm thấy dự án', 404);
  return { owner: project.owner, members: project.members };
};
```

**Kiểm tra:** Chưa test – cần Controller + Route.

---

## S2-06: Viết Project Controller (`src/controllers/projectController.js`)

**Mục tiêu:** Mỗi hàm: nhận request → gọi service → trả response. Không chứa logic nghiệp vụ.

```javascript
const projectService = require('../services/projectService');

exports.createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(
      req.body.name, req.body.description, req.user._id
    );
    res.status(201).json({ status: 'success', data: { project } });
  } catch (error) { next(error); }
};

exports.getMyProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getMyProjects(req.user._id);
    res.status(200).json({ status: 'success', results: projects.length, data: { projects } });
  } catch (error) { next(error); }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId);
    res.status(200).json({ status: 'success', data: { project } });
  } catch (error) { next(error); }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.body);
    res.status(200).json({ status: 'success', data: { project } });
  } catch (error) { next(error); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.projectId);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};

exports.addMember = async (req, res, next) => {
  try {
    const project = await projectService.addMember(req.params.projectId, req.body.email);
    res.status(200).json({ status: 'success', data: { project }, message: 'Đã thêm thành viên' });
  } catch (error) { next(error); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const project = await projectService.removeMember(
      req.params.projectId, req.params.memberId, req.user._id
    );
    res.status(200).json({ status: 'success', data: { project }, message: 'Đã xóa thành viên' });
  } catch (error) { next(error); }
};

exports.getMembers = async (req, res, next) => {
  try {
    const data = await projectService.getMembers(req.params.projectId);
    res.status(200).json({ status: 'success', data });
  } catch (error) { next(error); }
};
```

**Kiểm tra:** Chưa test – cần Route.

---

## S2-07: Viết Project Route (`src/routes/projectRoutes.js`)

**Mục tiêu:** Bản đồ URL → Controller. Gắn middleware bảo vệ.

```javascript
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const checkProjectMembership = require('../middlewares/checkProjectMembership');
const restrictToOwner = require('../middlewares/restrictToOwner');

// Tất cả route dưới đây đều cần đăng nhập
router.use(protect);

// Tạo project + Lấy danh sách project của tôi
router.route('/')
  .get(projectController.getMyProjects)
  .post(projectController.createProject);

// Chi tiết + Cập nhật + Xóa (cần là member, cập nhật/xóa cần là owner)
router.route('/:projectId')
  .get(checkProjectMembership, projectController.getProject)
  .put(checkProjectMembership, restrictToOwner, projectController.updateProject)
  .delete(checkProjectMembership, restrictToOwner, projectController.deleteProject);

// Quản lý thành viên
router.get('/:projectId/members', checkProjectMembership, projectController.getMembers);
router.post('/:projectId/members', checkProjectMembership, restrictToOwner, projectController.addMember);
router.delete('/:projectId/members/:memberId', checkProjectMembership, restrictToOwner, projectController.removeMember);

// Nested route: Tasks thuộc project (sẽ gắn ở S2-10)

module.exports = router;
```

*Giải thích chuỗi middleware:*
- `protect` → `checkProjectMembership` → `restrictToOwner` → `controller`
- Ví dụ `DELETE /:projectId`: Check login → Check member → Check owner → Xóa.
- Nếu bất kỳ bước nào fail, `next(error)` ngắt luồng → Error Handler trả lỗi.

**Gắn vào `app.js`:**
```javascript
const projectRoutes = require('./routes/projectRoutes');
app.use('/api/v1/projects', projectRoutes);
```

**Kiểm tra bằng Postman:**
1. `POST /api/v1/projects` với body `{ "name": "Dự án Test" }` → 201.
2. `GET /api/v1/projects` → Danh sách 1 project.
3. `GET /api/v1/projects/:id` → Chi tiết project.
4. `PUT /api/v1/projects/:id` với body `{ "name": "Đổi tên" }` → 200.
5. `POST /api/v1/projects/:id/members` với body `{ "email": "member@test.com" }` → 200.
6. `GET /api/v1/projects/:id/members` → Danh sách members.

---

## S2-08: Viết Task Service (`src/services/taskService.js`)

**Mục tiêu:** Logic CRUD task + Search/Filter.

```javascript
const Task = require('../models/taskModel');
const AppError = require('../utils/AppError');

exports.createTask = async (projectId, taskData, userId) => {
  const task = await Task.create({
    ...taskData,
    projectId: projectId
  });
  return task;
};

exports.getProjectTasks = async (projectId, queryParams = {}) => {
  const filter = { projectId, isDeleted: false };

  if (queryParams.status) filter.status = queryParams.status;
  if (queryParams.priority) filter.priority = queryParams.priority;
  if (queryParams.assignee) filter.assignee = queryParams.assignee;
  if (queryParams.q) {
    filter.$or = [
      { title: { $regex: queryParams.q, $options: 'i' } },
      { description: { $regex: queryParams.q, $options: 'i' } }
    ];
  }

  const tasks = await Task.find(filter)
    .populate('assignee', 'name avatar')
    .sort({ createdAt: -1 });
  return tasks;
};

exports.getTaskById = async (taskId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false })
    .populate('assignee', 'name avatar');
  if (!task) throw new AppError('Không tìm thấy công việc', 404);
  return task;
};

exports.updateTask = async (taskId, updateData) => {
  const allowedFields = ['title', 'description', 'status', 'priority', 'assignee', 'deadline'];
  const filtered = {};
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) filtered[field] = updateData[field];
  });

  const task = await Task.findOneAndUpdate(
    { _id: taskId, isDeleted: false },
    filtered,
    { new: true, runValidators: true }
  ).populate('assignee', 'name avatar');

  if (!task) throw new AppError('Không tìm thấy công việc', 404);
  return task;
};

exports.deleteTask = async (taskId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!task) throw new AppError('Không tìm thấy công việc', 404);
  return { message: 'Đã xóa công việc' };
};
```

*Giải thích:*
- `queryParams.q` → `$regex`: Search text trong title/description.
- `allowedFields`: Whitelist. Chỉ cho phép cập nhật các trường an toàn. Client gửi `{ isDeleted: true }` cũng bị bỏ qua.

**Kiểm tra:** Chưa test – cần Controller + Route.

---

## S2-09: Viết Task Controller (`src/controllers/taskController.js`)

```javascript
const taskService = require('../services/taskService');

exports.createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.params.projectId, req.body, req.user._id);
    res.status(201).json({ status: 'success', data: { task } });
  } catch (error) { next(error); }
};

exports.getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getProjectTasks(req.params.projectId, req.query);
    res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
  } catch (error) { next(error); }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.taskId);
    res.status(200).json({ status: 'success', data: { task } });
  } catch (error) { next(error); }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.taskId, req.body);
    res.status(200).json({ status: 'success', data: { task } });
  } catch (error) { next(error); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.taskId);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};
```

---

## S2-10: Viết Task Route (Nested trong Project)

**Mục tiêu:** Tasks là con của Project. URL: `/api/v1/projects/:projectId/tasks`.

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const checkProjectMembership = require('../middlewares/checkProjectMembership');

router.use(protect);
router.use(checkProjectMembership);

router.route('/')
  .get(taskController.getProjectTasks)
  .post(taskController.createTask);

router.route('/:taskId')
  .get(taskController.getTask)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

// Nested comment routes (gắn ở S2-13)

module.exports = router;
```

*Giải thích:*
- `mergeParams: true`: Cho phép nhận `:projectId` từ route cha (projectRoutes).
- `router.use(checkProjectMembership)`: Mọi thao tác với task đều cần là member project.

**Gắn vào `projectRoutes.js` (cuối file, trước `module.exports`):**
```javascript
const taskRoutes = require('./taskRoutes');
router.use('/:projectId/tasks', taskRoutes);
```

**Kiểm tra Postman:**
1. `POST /api/v1/projects/:projectId/tasks` với body `{ "title": "Task 1" }` → 201.
2. `GET /api/v1/projects/:projectId/tasks` → Danh sách tasks.
3. `PUT /api/v1/projects/:projectId/tasks/:taskId` với `{ "status": "Done" }` → 200.
4. `GET /api/v1/projects/:projectId/tasks?status=Done` → Chỉ tasks Done.
5. `GET /api/v1/projects/:projectId/tasks?q=login` → Tasks chứa "login".

---

## S2-11: Viết Comment Service (`src/services/commentService.js`)

```javascript
const Comment = require('../models/commentModel');
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const AppError = require('../utils/AppError');

exports.addComment = async (taskId, content, userId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false });
  if (!task) throw new AppError('Không tìm thấy công việc', 404);

  const comment = await Comment.create({ taskId, author: userId, content });
  const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar');
  return populatedComment;
};

exports.getCommentsByTask = async (taskId) => {
  const task = await Task.findOne({ _id: taskId, isDeleted: false });
  if (!task) throw new AppError('Không tìm thấy công việc', 404);

  const comments = await Comment.find({ taskId })
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });
  return comments;
};
```

---

## S2-12: Viết Comment Controller (`src/controllers/commentController.js`)

```javascript
const commentService = require('../services/commentService');

exports.addComment = async (req, res, next) => {
  try {
    const comment = await commentService.addComment(
      req.params.taskId, req.body.content, req.user._id
    );
    res.status(201).json({ status: 'success', data: { comment } });
  } catch (error) { next(error); }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsByTask(req.params.taskId);
    res.status(200).json({ status: 'success', results: comments.length, data: { comments } });
  } catch (error) { next(error); }
};
```

---

## S2-13: Viết Comment Route (Nested trong Task)

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(commentController.getComments)
  .post(commentController.addComment);

module.exports = router;
```

**Gắn vào `taskRoutes.js`:**
```javascript
const commentRoutes = require('./commentRoutes');
router.use('/:taskId/comments', commentRoutes);
```

**Kiểm tra Postman:**
1. `POST /api/v1/projects/:pid/tasks/:tid/comments` với body `{ "content": "Bình luận test" }` → 201.
2. `GET /api/v1/projects/:pid/tasks/:tid/comments` → Danh sách comments.

---

## S2-14: Viết Socket.io cấu hình (`src/config/socket.js`)

**Mục tiêu:** Thiết lập realtime. Khi member A đổi task, member B thấy ngay mà không cần F5.

**Bước 1:** Tạo file `src/config/socket.js` (xem chi tiết code ở `sprint2_code_line_by_line_part4.md`).

**Bước 2:** Cập nhật `src/server.js` – thay `app.listen()` bằng `http.createServer(app)` + `initSocket(server)` + `server.listen()`.

**Bước 3:** Thêm emit vào `taskService.js`:
```javascript
const { getIO } = require('../config/socket');
// Cuối hàm createTask:
getIO().to(`project:${projectId}`).emit('taskCreated', task);
// Cuối hàm updateTask:
getIO().to(`project:${task.projectId}`).emit('taskUpdated', task);
// Cuối hàm deleteTask:
getIO().to(`project:${task.projectId}`).emit('taskDeleted', { taskId: task._id });
```

**Kiểm tra:** Mở 2 tab trình duyệt cùng project → Tab A tạo task → Tab B tự hiện task mới.

---

## S2-15: Viết View Routes + Frontend EJS (Projects + Board)

**Mục tiêu:** Tạo giao diện danh sách project, giao diện Kanban Board 3 cột.

**Bước 1:** Cập nhật `src/routes/viewRoutes.js` – thêm:
```javascript
router.get('/projects', (req, res) => {
  res.render('project/index', { title: 'Dự Án - TaskFlow' });
});

router.get('/projects/:projectId/board', (req, res) => {
  res.render('project/board', { title: 'Board - TaskFlow' });
});
```

**Bước 2:** Tạo `src/views/project/index.ejs` (trang danh sách project với grid cards + modal tạo mới).

**Bước 3:** Tạo `public/js/projects.js` (client JS: loadProjects, createProject).

**Bước 4:** Tạo `src/views/project/board.ejs` (3 cột Kanban: To Do, In Progress, Done).

**Bước 5:** Tạo `public/js/board.js` (client JS: loadBoard, renderColumn, showTaskDetail, loadComments, Socket.io client).

**Bước 6:** Tạo `public/css/board.css` (style cho board layout, cards, priority badges).

**Kiểm tra:** Truy cập `http://localhost:5000/projects` → Thấy trang danh sách. Click project → Thấy Board 3 cột.

---

## S2-16: Viết Dashboard Service + Controller + Route

**Bước 1:** Tạo `src/services/dashboardService.js` – hàm `getDashboardStats(userId)`.

**Bước 2:** Tạo `src/controllers/dashboardController.js` – hàm `getStats`.

**Bước 3:** Tạo `src/routes/dashboardRoutes.js`:
```javascript
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/stats', dashboardController.getStats);
module.exports = router;
```

**Gắn vào `app.js`:**
```javascript
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/v1/dashboard', dashboardRoutes);
```

**Kiểm tra Postman:**
1. `GET /api/v1/dashboard/stats` → Nhận object `{ totalProjects, totalTasks, todoCount, ... }`.
