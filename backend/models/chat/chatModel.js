const pool = require('../../config/db');

const chatModel = {
  createChatTable: async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        sender_id UUID NOT NULL,
        receiver_id UUID NOT NULL,
        message TEXT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('Chat table created successfully');
  },

  sendMessage: async (senderName, senderId, senderRole, receiverName, receiverId, receiverRole, message) => {
    const query = `
      INSERT INTO chats (sender_id, receiver_id, message)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, receiver_id, message, sent_at
    `;
    const values = [senderId, receiverId, message];
    const result = await pool.query(query, values);
    return {
      ...result.rows[0],
      senderName,
      senderRole,
      receiverName,
      receiverRole
    };
  },

  getMessages: async (userId1, userId2) => {
    const query = `
      SELECT * FROM chats
      WHERE (sender_id = $1 AND receiver_id = $2)
      OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY sent_at ASC
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows;
  }
};

module.exports = chatModel;