const chatModel = require('../../models/chat/chatModel');

const chatController = {
  getMessages: async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
      const messages = await chatModel.getMessages(userId1, userId2);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
};

module.exports = chatController;