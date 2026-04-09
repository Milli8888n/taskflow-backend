const AppError = require('../utils/AppError');

const restrictToOwner = (req, res, next) => {
  if (req.project.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('Chỉ chủ dự án mới được thực hiện thao tác này', 403));
  }
  next();
};

module.exports = restrictToOwner;