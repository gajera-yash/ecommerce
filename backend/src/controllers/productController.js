const pool = require('../config/db');

exports.getProducts = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, sku, category, cost_price, mrp, description, stock_quantity, low_stock_threshold } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO products (name,sku,category,cost_price,mrp,description,stock_quantity,low_stock_threshold) VALUES (?,?,?,?,?,?,?,?)',
      [name, sku, category||'', cost_price||0, mrp||0, description||'', stock_quantity||0, low_stock_threshold||10]
    );
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'SKU already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, sku, category, cost_price, mrp, description, stock_quantity, low_stock_threshold } = req.body;
    await pool.execute(
      'UPDATE products SET name=?,sku=?,category=?,cost_price=?,mrp=?,description=?,stock_quantity=?,low_stock_threshold=? WHERE id=?',
      [name, sku, category||'', cost_price||0, mrp||0, description||'', stock_quantity||0, low_stock_threshold||10, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteProduct = async (req, res) => {
  try {
    await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
