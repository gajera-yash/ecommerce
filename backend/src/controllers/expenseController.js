const pool = require('../config/db');

exports.getExpenses = async (req, res) => {
  try {
    const { from, to, category } = req.query;
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    if (from) { sql += ' AND expense_date >= ?'; params.push(from); }
    if (to) { sql += ' AND expense_date <= ?'; params.push(to); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY expense_date DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createExpense = async (req, res) => {
  try {
    const { title, amount, category, expense_date, notes } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO expenses (title,amount,category,expense_date,notes) VALUES (?,?,?,?,?) RETURNING id',
      [title, amount, category||'General', expense_date, notes||'']
    );
    const [rows] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateExpense = async (req, res) => {
  try {
    const { title, amount, category, expense_date, notes } = req.body;
    await pool.execute(
      'UPDATE expenses SET title=?,amount=?,category=?,expense_date=?,notes=? WHERE id=?',
      [title, amount, category, expense_date, notes||'', req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteExpense = async (req, res) => {
  try {
    await pool.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
