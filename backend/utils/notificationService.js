// File: utils/notificationService.js
const UserModel = require('../models/user/userModel');
const NotificationModel = require('../models/notification/notification');
const ErrorHandler = require('./errorHandler');

const sendNotification = async (userId, title, message) => {
  try {
    const user = await UserModel.getUserById(userId);
    if (!user) {
      throw new ErrorHandler('User not found', 404);
    }

    const notification = await NotificationModel.createNotification({
      user: userId,
      title,
      message,
      read: false
    });

    // If using real-time notifications, you can uncomment and configure this
    // io.to(userId).emit('newNotification', notification);

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new ErrorHandler('Failed to send notification', 500);
  }
};

const getUserNotifications = async (userId, page = 1, limit = 10) => {
  try {
    const notifications = await NotificationModel.getNotificationsByUserId(userId, page, limit);
    const total = await NotificationModel.countNotifications(userId);

    return {
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new ErrorHandler('Failed to fetch notifications', 500);
  }
};

const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await NotificationModel.updateNotification(notificationId, true);

    if (!notification) {
      throw new ErrorHandler('Notification not found', 404);
    }

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new ErrorHandler('Failed to mark notification as read', 500);
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead
};