const pool = require('../config/db');
const { calculateOrderProfit } = require('../utils/profitCalculator');

exports.getOrders = async (req, res) => {
  try {
    const { search, platform, delivery_status, payment_status, from, to, sort_by, sort_order, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (search) { sql += ' AND (order_id LIKE ? OR product_name LIKE ? OR customer_name LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
    if (platform) { sql += ' AND platform = ?'; params.push(platform); }
    if (delivery_status) { sql += ' AND delivery_status = ?'; params.push(delivery_status); }
    if (payment_status) { sql += ' AND payment_status = ?'; params.push(payment_status); }
    if (from) { sql += ' AND order_date >= ?'; params.push(from); }
    if (to) { sql += ' AND order_date <= ?'; params.push(to); }

    // Count
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    // Sort
    const allowedSort = ['order_date', 'sale_price', 'profit', 'net_amount_received', 'created_at'];
    const col = allowedSort.includes(sort_by) ? sort_by : 'order_date';
    const dir = sort_order === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${col} ${dir}`;

    // Paginate
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(sql, params);
    res.json({ orders: rows, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOrder = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createOrder = async (req, res) => {
  try {
    const o = req.body;
    const saleTotal = (o.sale_price || 0) * (o.quantity || 1);
    const costTotal = (o.my_cost_price || 0) * (o.quantity || 1);
    const platformFee = o.platform_fee || 0;
    const shippingFee = o.shipping_fee || 0;
    const otherDeductions = o.other_deductions || 0;
    const netReceived = saleTotal - platformFee - shippingFee - otherDeductions;
    const profit = netReceived - costTotal;
    const margin = saleTotal > 0 ? ((profit / saleTotal) * 100).toFixed(2) : 0;

    const [result] = await pool.execute(
      `INSERT INTO orders (order_id,platform,product_name,product_sku,category,quantity,sale_price,my_cost_price,platform_fee,shipping_fee,other_deductions,net_amount_received,profit,profit_margin,order_date,delivery_status,payment_status,customer_name,customer_city,customer_state,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [o.order_id,o.platform,o.product_name,o.product_sku||'',o.category||'',o.quantity||1,saleTotal,costTotal,platformFee,shippingFee,otherDeductions,netReceived,profit,margin,o.order_date,o.delivery_status||'PENDING',o.payment_status||'PENDING',o.customer_name||'',o.customer_city||'',o.customer_state||'',o.notes||'']
    );
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateOrder = async (req, res) => {
  try {
    const o = req.body;
    const saleTotal = (o.sale_price || 0) * (o.quantity || 1);
    const costTotal = (o.my_cost_price || 0) * (o.quantity || 1);
    const platformFee = o.platform_fee || 0;
    const shippingFee = o.shipping_fee || 0;
    const otherDeductions = o.other_deductions || 0;
    const netReceived = saleTotal - platformFee - shippingFee - otherDeductions;
    const profit = netReceived - costTotal;
    const margin = saleTotal > 0 ? ((profit / saleTotal) * 100).toFixed(2) : 0;

    await pool.execute(
      `UPDATE orders SET order_id=?,platform=?,product_name=?,product_sku=?,category=?,quantity=?,sale_price=?,my_cost_price=?,platform_fee=?,shipping_fee=?,other_deductions=?,net_amount_received=?,profit=?,profit_margin=?,order_date=?,delivery_status=?,payment_status=?,customer_name=?,customer_city=?,customer_state=?,notes=? WHERE id=?`,
      [o.order_id,o.platform,o.product_name,o.product_sku||'',o.category||'',o.quantity||1,saleTotal,costTotal,platformFee,shippingFee,otherDeductions,netReceived,profit,margin,o.order_date,o.delivery_status,o.payment_status,o.customer_name||'',o.customer_city||'',o.customer_state||'',o.notes||'',req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteOrder = async (req, res) => {
  try {
    await pool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.bulkStatus = async (req, res) => {
  try {
    const { ids, delivery_status, payment_status } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'No order ids provided' });
    const placeholders = ids.map(() => '?').join(',');
    if (delivery_status) {
      await pool.execute(`UPDATE orders SET delivery_status = ? WHERE id IN (${placeholders})`, [delivery_status, ...ids]);
    }
    if (payment_status) {
      await pool.execute(`UPDATE orders SET payment_status = ? WHERE id IN (${placeholders})`, [payment_status, ...ids]);
    }
    res.json({ message: `${ids.length} orders updated` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
