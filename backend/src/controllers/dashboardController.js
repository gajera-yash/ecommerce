const pool = require('../config/db');

exports.getSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    const [[todayOrders]] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE order_date = ?', [today]);
    const [[monthRevenue]] = await pool.execute('SELECT COALESCE(SUM(sale_price),0) as gross, COALESCE(SUM(profit),0) as net_profit, COUNT(*) as total_orders FROM orders WHERE order_date >= ?', [monthStart]);
    const [[pendingOrders]] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE delivery_status = "PENDING"');
    const [[returnedCancelled]] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE delivery_status IN ("RETURNED","CANCELLED")');
    const [[monthExpenses]] = await pool.execute('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE expense_date >= ?', [monthStart]);

    res.json({
      todayOrders: todayOrders.count,
      monthGrossRevenue: monthRevenue.gross,
      monthNetProfit: monthRevenue.net_profit - monthExpenses.total,
      monthTotalOrders: monthRevenue.total_orders,
      pendingOrders: pendingOrders.count,
      returnedCancelled: returnedCancelled.count,
      monthExpenses: monthExpenses.total
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getCharts = async (req, res) => {
  try {
    // Platform split for current month
    const monthStart = new Date().toISOString().substring(0, 7) + '-01';
    const [platformSplit] = await pool.execute(
      'SELECT platform, COALESCE(SUM(sale_price),0) as revenue, COALESCE(SUM(profit),0) as profit FROM orders WHERE order_date >= ? GROUP BY platform',
      [monthStart]
    );

    // Monthly trend - last 6 months
    const [monthlyTrend] = await pool.execute(
      `SELECT DATE_FORMAT(order_date, '%Y-%m') as month, COALESCE(SUM(sale_price),0) as revenue, COALESCE(SUM(profit),0) as profit, COUNT(*) as orders
       FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY month ORDER BY month`
    );

    res.json({ platformSplit, monthlyTrend });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTopProducts = async (req, res) => {
  try {
    const monthStart = new Date().toISOString().substring(0, 7) + '-01';
    const [rows] = await pool.execute(
      `SELECT product_name, product_sku, SUM(quantity) as total_qty, SUM(sale_price) as total_revenue, SUM(profit) as total_profit
       FROM orders WHERE order_date >= ? GROUP BY product_name, product_sku ORDER BY total_revenue DESC LIMIT 5`,
      [monthStart]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
