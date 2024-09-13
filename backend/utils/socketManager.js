const chatModel = require('../models/chat/chatModel');

const socketManager = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined`);
    });

    socket.on('sendMessage', async ({ senderName, senderId, senderRole, receiverName, receiverId, receiverRole, message }) => {
      try {
        const newMessage = await chatModel.sendMessage(senderName, senderId, senderRole, receiverName, receiverId, receiverRole, message);
        io.to(receiverId).emit('newMessage', newMessage);
        io.to(senderId).emit('messageSent', newMessage);
        console.log(`Message sent from ${senderName} (${senderRole}) to ${receiverName} (${receiverRole})`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

module.exports = socketManager;