const jwt = require('jsonwebtoken');
const UserModel = require('../models/user/userModel');
const ErrorHandler = require('../utils/errorHandler');

const ROLES = {
  OWNER: 'owner',
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
  MANAGER: 'manager'
};

const isAuthenticatedUser = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new ErrorHandler('Please login to access this resource', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.getUserById(decoded.id);

    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };

    next();
  } catch (error) {
    console.error('Error in isAuthenticatedUser:', error);
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler('Token has expired', 401));
    }
    return next(new ErrorHandler('Authentication failed', 401));
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ErrorHandler('User role not found', 403));
    }

    const hasPermission = allowedRoles.some(role => role.toLowerCase() === req.user.role.toLowerCase());

    if (!hasPermission) {
      return next(new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403));
    }

    next();
  };
};

module.exports = {
  isAuthenticatedUser,
  authorizeRoles,
  ROLES
};