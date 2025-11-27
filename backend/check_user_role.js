import { query } from './src/db/db.js';

const checkUser = async () => {
  try {
    const result = await query("SELECT id, username, role FROM users WHERE username = 'sanji'");
    console.log("User found:", result.rows[0]);
  } catch (error) {
    console.error("Error:", error);
  }
};

checkUser();
