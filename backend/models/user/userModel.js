// models/userModel.js
const pool = require('../../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userModel = {
  getUserByEmail: async (email) => {
    const query = `
      SELECT id, email, password, role, name, avatar FROM (
        SELECT id, email, password, 'owner' as role, name, avatar FROM owner
        UNION ALL
        SELECT id, email, password, 'admin' as role, name, avatar FROM admin
        UNION ALL
        SELECT id, email, password, 'manager' as role, name, avatar FROM manager
        UNION ALL
        SELECT id, email, password, 'employee' as role, name, avatar FROM employee
      ) AS users
      WHERE LOWER(email) = LOWER($1)
    `;
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
  },

  getUserById: async (id) => {
    const query = `
      SELECT id, email, role, name, avatar FROM (
        SELECT id, email, 'owner' as role, name, avatar FROM owner
        UNION ALL
        SELECT id, email, 'admin' as role, name, avatar FROM admin
        UNION ALL
        SELECT id, email, 'manager' as role, name, avatar FROM manager
        UNION ALL
        SELECT id, email, 'employee' as role, name, avatar FROM employee
      ) AS users
      WHERE id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  createUser: async (userData) => {
    const { name, email, password, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();

    const query = `
      INSERT INTO ${role} (id, name, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, '${role}' as role
    `;

    const { rows } = await pool.query(query, [id, name, email, hashedPassword]);
    return rows[0];
  },

  updateUserProfile: async (userId, role, updates) => {
    const allowedUpdates = ['name', 'email', 'avatar'];
    const updateFields = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key) && updates[key] !== undefined)
      .map((key, index) => `${key} = $${index + 2}`);

    if (updateFields.length === 0) return null;

    const values = updateFields.map(field => updates[field.split(' = ')[0]]);
    const query = `
      UPDATE ${role}
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING id, name, email, avatar, '${role}' as role
    `;

    const { rows } = await pool.query(query, [userId, ...values]);
    return rows[0] || null;
  },

  changePassword: async (userId, role, oldPassword, newPassword) => {
    const user = await pool.query(`SELECT password FROM ${role} WHERE id = $1`, [userId]);
    if (!user.rows[0]) throw new Error('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.rows[0].password);
    if (!isMatch) throw new Error('Incorrect old password');

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const query = `
      UPDATE ${role}
      SET password = $1
      WHERE id = $2
      RETURNING id
    `;
    const { rows } = await pool.query(query, [hashedPassword, userId]);
    return rows[0] ? true : false;
  },

  deleteUser: async (userId, role) => {
    const query = `
      DELETE FROM ${role}
      WHERE id = $1
      RETURNING id
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] ? true : false;
  }
};

module.exports = userModel;
