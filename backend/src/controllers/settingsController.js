const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getFeeRules = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM platform_fee_rules ORDER BY platform, category');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createFeeRule = async (req, res) => {
  try {
    const { platform, category, fee_percentage, fixed_fee, effective_from } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO platform_fee_rules (platform,category,fee_percentage,fixed_fee,effective_from) VALUES (?,?,?,?,?)',
      [platform, category, fee_percentage||0, fixed_fee||0, effective_from||new Date().toISOString().split('T')[0]]
    );
    const [rows] = await pool.execute('SELECT * FROM platform_fee_rules WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateFeeRule = async (req, res) => {
  try {
    const { platform, category, fee_percentage, fixed_fee, effective_from } = req.body;
    await pool.execute(
      'UPDATE platform_fee_rules SET platform=?,category=?,fee_percentage=?,fixed_fee=?,effective_from=? WHERE id=?',
      [platform, category, fee_percentage, fixed_fee, effective_from, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM platform_fee_rules WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteFeeRule = async (req, res) => {
  try {
    await pool.execute('DELETE FROM platform_fee_rules WHERE id = ?', [req.params.id]);
    res.json({ message: 'Fee rule deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id,name,email,business_name,currency_symbol,default_platform FROM users WHERE id = ?', [req.userId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password, business_name, currency_symbol, default_platform } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.execute('UPDATE users SET name=?,email=?,password_hash=?,business_name=?,currency_symbol=?,default_platform=? WHERE id=?',
        [name, email, hash, business_name||'', currency_symbol||'₹', default_platform||'AMAZON', req.userId]);
    } else {
      await pool.execute('UPDATE users SET name=?,email=?,business_name=?,currency_symbol=?,default_platform=? WHERE id=?',
        [name, email, business_name||'', currency_symbol||'₹', default_platform||'AMAZON', req.userId]);
    }
    const [rows] = await pool.execute('SELECT id,name,email,business_name,currency_symbol,default_platform FROM users WHERE id = ?', [req.userId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
