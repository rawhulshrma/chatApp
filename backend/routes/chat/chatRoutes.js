const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chat/chatController');
const auth = require('../../middleware/auth');

router.get('/messages/:userId1/:userId2', auth, chatController.getMessages);

module.exports = router;