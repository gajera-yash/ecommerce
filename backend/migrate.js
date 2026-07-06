const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    console.log('Adding columns to products table...');
    try {
      await pool.execute('ALTER TABLE products ADD COLUMN packaging_charge DECIMAL(10,2) DEFAULT 0 AFTER cost_price');
    } catch(e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('Column packaging_charge already exists.'); }

    try {
      await pool.execute('ALTER TABLE products ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 0 AFTER packaging_charge');
    } catch(e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('Column gst_rate already exists.'); }

    console.log('Adding columns to orders table...');
    try {
      await pool.execute('ALTER TABLE orders ADD COLUMN packaging_cost DECIMAL(10,2) DEFAULT 0 AFTER my_cost_price');
    } catch(e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('Column packaging_cost already exists.'); }

    try {
      await pool.execute('ALTER TABLE orders ADD COLUMN gst_amount DECIMAL(10,2) DEFAULT 0 AFTER packaging_cost');
    } catch(e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('Column gst_amount already exists.'); }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
