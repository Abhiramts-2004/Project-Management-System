import { query } from '../db/db.js';

export const getActivityLogs = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.username 
       FROM activity_logs a 
       LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC 
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
