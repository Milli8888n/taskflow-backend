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