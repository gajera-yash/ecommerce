const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', ['admin@business.com']);
    console.log('Existing user:', rows);

    const hash = await bcrypt.hash('Admin@123', 10);
    
    if (rows.length > 0) {
      const [updateResult] = await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hash, 'admin@business.com']);
      console.log('User password updated:', updateResult);
    } else {
      const [insertResult] = await pool.execute(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        ['Admin', 'admin@business.com', hash]
      );
      console.log('User inserted:', insertResult);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
