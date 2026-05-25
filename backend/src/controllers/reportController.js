const pool = require('../config/db');
const { exportCSV } = require('../utils/csvExporter');

exports.platformReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    let sql = `SELECT platform, COUNT(*) as total_orders, COALESCE(SUM(sale_price),0) as gross_revenue,
      COALESCE(SUM(profit),0) as total_profit, COALESCE(AVG(sale_price),0) as avg_order_value
      FROM orders WHERE 1=1`;
    const params = [];
    if (from) { sql += ' AND order_date >= ?'; params.push(from); }
    if (to) { sql += ' AND order_date <= ?'; params.push(to); }
    sql += ' GROUP BY platform';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.productReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    let sql = `SELECT product_name, product_sku, category, COUNT(*) as total_orders, SUM(quantity) as total_qty,
      COALESCE(SUM(sale_price),0) as gross_revenue, COALESCE(SUM(profit),0) as total_profit
      FROM orders WHERE 1=1`;
    const params = [];
    if (from) { sql += ' AND order_date >= ?'; params.push(from); }
    if (to) { sql += ' AND order_date <= ?'; params.push(to); }
    sql += ' GROUP BY product_name, product_sku, category ORDER BY total_profit DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.monthlyPnl = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const [orders] = await pool.execute(
      `SELECT DATE_FORMAT(order_date,'%Y-%m') as month, COUNT(*) as total_orders,
        COALESCE(SUM(sale_price),0) as gross_revenue,
        COALESCE(SUM(platform_fee+shipping_fee+other_deductions),0) as total_deductions,
        COALESCE(SUM(net_amount_received),0) as net_revenue,
        COALESCE(SUM(my_cost_price),0) as total_cost,
        COALESCE(SUM(profit),0) as net_profit
       FROM orders WHERE YEAR(order_date) = ? GROUP BY month ORDER BY month`,
      [year]
    );
    const [expenses] = await pool.execute(
      `SELECT DATE_FORMAT(expense_date,'%Y-%m') as month, COALESCE(SUM(amount),0) as total_expenses
       FROM expenses WHERE YEAR(expense_date) = ? GROUP BY month ORDER BY month`,
      [year]
    );
    // Merge expenses into order months
    const expMap = {};
    expenses.forEach(e => { expMap[e.month] = e.total_expenses; });
    const result = orders.map(o => ({
      ...o,
      expenses: expMap[o.month] || 0,
      final_profit: o.net_profit - (expMap[o.month] || 0),
      margin: o.gross_revenue > 0 ? (((o.net_profit - (expMap[o.month] || 0)) / o.gross_revenue) * 100).toFixed(2) : 0
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.exportCsv = async (req, res) => {
  try {
    const { type, from, to } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (from) { sql += ' AND order_date >= ?'; params.push(from); }
    if (to) { sql += ' AND order_date <= ?'; params.push(to); }
    sql += ' ORDER BY order_date DESC';
    const [rows] = await pool.execute(sql, params);
    const fields = ['order_id','platform','product_name','product_sku','category','quantity','sale_price','my_cost_price','platform_fee','shipping_fee','other_deductions','net_amount_received','profit','profit_margin','order_date','delivery_status','payment_status','customer_name','customer_city','customer_state','notes'];
    const csv = exportCSV(rows, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
    res.send(csv);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
