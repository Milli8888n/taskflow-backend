const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên'],
    trim: true,
    // trim: true tự động xóa khoảng trắng đầu/cuối
    // " Nguyễn Văn A " → "Nguyễn Văn A"
  },
  email: {
    type: String,
    required: [true, 'Vui lòng cung cấp email'],
    unique: true,    
    lowercase: true, // Tự chuyển "ABC@Gmail.com" → "abc@gmail.com"
    match: [
      /^\S+@\S+\.\S+$/, 
      'Email không hợp lệ'
    ]
    // Regex giải thích: ^\S+ (ít nhất 1 ký tự không trắng) @ \S+ . \S+$
  },
  password: {
    type: String,
    required: [true, 'Vui lòng cung cấp mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
    // select: false → Khi query User bình thường, password sẽ bị ẩn đi
    // Muốn lấy phải ghi rõ: User.findOne().select('+password')
  },
  avatar: {
    type: String,
    default: ''
    // Lưu URL ảnh. Mặc định rỗng (chưa có avatar)
  },
  refreshToken: {
    type: String,
    select: false
    // Lưu refresh token hiện tại. Ẩn khỏi query thông thường.
  }
}, {
  timestamps: true
  // Tự động tạo 2 trường: createdAt và updatedAt
});

// ========== PRE-SAVE HOOK: TỰ ĐỘNG HASH PASSWORD ==========
// Hook chạy TRƯỚC mỗi lần .save()
// Keyword "function" bắt buộc (không dùng arrow =>), vì cần truy cập "this"
userSchema.pre('save', async function(next) {
  // Kiểm tra: password có bị thay đổi không?
  // Nếu user chỉ đổi tên (không đổi pass), thì bỏ qua khỏi hash lại
  if (!this.isModified('password')) return next();
  
  // Tạo salt (muối) với 10 rounds rồi hash password
  // Salt rounds càng cao càng an toàn nhưng càng chậm. 10 là mức cân bằng.
  this.password = await bcrypt.hash(this.password, 10);
  
  next(); // Cho phép tiếp tục save xuống MongoDB
});

// ========== INSTANCE METHOD: SO SÁNH PASSWORD ==========
// Method gắn vào MỖI document user
// Gọi bằng: user.comparePassword('mật_khẩu_nhập_vào')
userSchema.methods.comparePassword = async function(candidatePassword) {
  // bcrypt.compare so sánh chuỗi text thô với chuỗi đã hash
  // Trả về true/false
  return await bcrypt.compare(candidatePassword, this.password);
};

// ========== TOJSON METHOD: ẨN PASSWORD TRONG RESPONSE ==========
// Tự động được gọi khi res.json() hoặc JSON.stringify()
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  // Xóa trường password khỏi object trước khi trả về
  delete user.password;
  delete user.refreshToken;
  return user;
};

// ========== EXPORT MODEL ==========
module.exports = mongoose.model('User', userSchema);