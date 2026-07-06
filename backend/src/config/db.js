const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = {
  execute: async (sql, params = []) => {
    let counter = 1;
    // Replace all ? with $1, $2, etc.
    let pgSql = sql.replace(/\?/g, () => `$${counter++}`);
    
    // Convert MySQL DATE_FORMAT to PostgreSQL TO_CHAR
    pgSql = pgSql.replace(/DATE_FORMAT\(([^,]+),\s*'%Y-%m'\)/g, "TO_CHAR($1, 'YYYY-MM')");
    
    try {
      const result = await pool.query(pgSql, params);
      
      // Mimic mysql2 return format
      // mysql2 returns [rows, fields] for SELECT
      // For INSERT/UPDATE/DELETE, result.rows is usually empty unless RETURNING is used
      if (pgSql.trim().toUpperCase().startsWith('SELECT')) {
        return [result.rows, result.fields];
      } else {
        // If RETURNING was used, get the id
        const insertId = (result.rows && result.rows.length > 0) ? result.rows[0].id : null;
        return [{ insertId, affectedRows: result.rowCount }];
      }
    } catch (err) {
      console.error('Database Error:', err.message, '\nQuery:', pgSql, '\nParams:', params);
      throw err;
    }
  }
};
