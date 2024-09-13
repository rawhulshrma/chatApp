const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const pool = require('./config/db.js');

// Routes

const ownerRoutes = require('./routes/owner/onwerRoutes'); // Fixed typo here
const authRoutes = require('./routes/auth/authRoutes');
const chatRoutes = require('./routes/chat/chatRoutes');
// Models

const ownerModel = require('./models/owner/ownerModels');
const chatModel = require('./models/chatModel');


// Middleware
const socketManager = require('./utils/socketManager');
const errorMiddleware = require('./middleware/error');
const multer = require('multer');

// App setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads')); // Serve static files from 'uploads' directory

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to CRM Database API');
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/owner', ownerRoutes);
app.use('/api/v1/chat', chatRoutes);

// Socket.IO logic
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

// Initialize database tables
const initializeTables = async () => {
  try {
    await Promise.all([
      ownerModel.createOwnerTable(),
      chatModel.createChatTable(),
      ownerModel.createOwnerTable(),
     
      // Add more model initialization as needed
    ]);
    console.log('All database tables initialized successfully.');
  } catch (err) {
    console.error('Error Initializing Tables:', err);
    process.exit(1);
  }
};

// Error handling for 404 routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
});

app.use(errorMiddleware);

// Database connection and server start
const startServer = async () => {
  try {
    console.log('Attempting to connect to the database...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
    
    await initializeTables();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

socketManager(io);
// Start initialization and server
startServer();

module.exports = app;
