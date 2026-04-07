### 1. Chuẩn bị môi trường

Trước tiên cần có MongoDB đang chạy. Có 3 cách phổ biến nhất ở Việt Nam năm 2026:

| Cách                  | Phù hợp với                  | Ưu điểm                              | Nhược điểm                          |
|-----------------------|------------------------------|--------------------------------------|-------------------------------------|
| MongoDB Atlas (cloud) | Học, dự án cá nhân, production nhỏ | Miễn phí tier 512MB, dễ setup        | Có thể chậm nếu server xa (Singapore tốt nhất) |
| Docker local          | Dev máy mạnh                 | Nhanh, offline, giống production     | Cần biết Docker cơ bản              |
| MongoDB Community local | Máy yếu, không muốn Docker   | Đơn giản                             | Phải cài thủ công                   |

#### Cách nhanh nhất: MongoDB Atlas

1. Đăng ký tại: https://www.mongodb.com/cloud/atlas
2. Tạo cluster miễn phí → chọn **M0 Sandbox**
3. Chọn region gần nhất (Singapore hoặc Tokyo)
4. Tạo user database (ví dụ: username `devuser`, password mạnh)
5. Trong **Network Access** → Add IP → chọn **0.0.0.0/0** (cho phép mọi nơi – chỉ dùng khi học)
6. Copy **connection string** (dạng mongodb+srv://...)

Chuỗi kết nối mẫu:
```
mongodb+srv://devuser:matkhau123@cluster0.abcde.mongodb.net/myapp?retryWrites=true&w=majority
```

### 2. Cài đặt Mongoose vào project Express

Tiếp tục từ project Express ở bài trước:

```bash
# Vào thư mục dự án
cd my-first-express

# Cài mongoose (phiên bản mới nhất ~9.2.x)
npm install mongoose
```

### 3. Kết nối MongoDB với Mongoose

Tạo file `db.js` (hoặc `config/db.js`)

```js
// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Các option khuyến nghị 2026 (hầu hết mặc định tốt rồi)
      // serverSelectionTimeoutMS: 5000,   // mặc định 30000
    });

    console.log('MongoDB kết nối thành công ✓');
  } catch (err) {
    console.error('MongoDB kết nối thất bại:', err.message);
    process.exit(1); // Thoát app nếu DB lỗi (phù hợp production)
  }
};

module.exports = connectDB;
```

Sửa file `index.js` (hoặc `app.js`) chính:

```js
const express = require('express');
const connectDB = require('./db'); // hoặc ./config/db

require('dotenv').config(); // nếu dùng file .env

const app = express();
const port = process.env.PORT || 3000;

// Kết nối DB ngay khi app khởi động
connectDB();

app.get('/', (req, res) => {
  res.send('Server Express + MongoDB sẵn sàng!');
});

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
```

Tạo file `.env` (đừng commit lên git):

```
MONGO_URI=mongodb+srv://devuser:matkhau123@cluster0.abcde.mongodb.net/myapp?retryWrites=true&w=majority
PORT=3000
```

Cài thêm `dotenv` nếu chưa có:

```bash
npm install dotenv
```

Chạy thử:

```bash
node index.js
```

Thấy dòng **"MongoDB kết nối thành công ✓"** → OK!

### 4. Định nghĩa Schema & Model (Ví dụ: User)

Tạo thư mục `models`, file `models/User.js`

```js
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên không được để trống'],
    trim: true,
    minlength: [2, 'Tên phải dài ít nhất 2 ký tự']
  },
  email: {
    type: String,
    required: true,
    unique: true,          // tạo index unique
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  age: {
    type: Number,
    min: [18, 'Phải trên 18 tuổi'],
    max: 100
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true          // tự động thêm updatedAt
});

// Tạo index cho tìm kiếm nhanh (nếu cần)
userSchema.index({ email: 1 });

// Export model
module.exports = mongoose.model('User', userSchema);
```

### 5. CRUD cơ bản với Express + Mongoose

Tạo file `routes/users.js`

```js
// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET tất cả users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-__v'); // loại bỏ __v
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET một user theo ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST tạo user mới
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT cập nhật user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // trả về document mới + validate
    );
    if (!user) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
```

Kết nối route vào `index.js`:

```js
// Thêm vào index.js (sau app = express())
app.use(express.json()); // parse JSON body

const userRouter = require('./routes/users');
app.use('/api/users', userRouter);
```