const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    // Create DB and tables just in case they aren't created yet
    // But since the server was running for 5 minutes, we assume the schema might be imported
    // Let's just do the insert
    
    const hash = await bcrypt.hash('Admin@123', 10);
    // Ignore duplicate email if already exists
    const [result] = await pool.execute(
      'INSERT IGNORE INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      ['Admin', 'admin@business.com', hash]
    );
    console.log('Admin user seeded:', result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
