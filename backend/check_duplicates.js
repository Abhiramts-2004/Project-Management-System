import { query } from './src/db/db.js';

const checkDuplicates = async () => {
  try {
    const result = await query("SELECT id, username, email, role FROM users WHERE email = 'sanji@example.com'");
    console.log("Users found:", result.rows);
  } catch (error) {
    console.error("Error:", error);
  }
};

checkDuplicates();
