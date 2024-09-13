const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const protect = (roles) => async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (roles && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
};

module.exports = { protect };
