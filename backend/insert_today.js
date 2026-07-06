const pool = require('./src/config/db');

async function insertTodayOrders() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const orders = [
      ['AMZ-10099','AMAZON','Wireless Earbuds Pro','WEP-001','Electronics',2,1299,450,155.88,50,0,today,'PENDING','PENDING','Rahul Sharma','Mumbai','Maharashtra'],
      ['FLK-20099','FLIPKART','Phone Case Premium','PCP-002','Accessories',1,399,80,55.86,40,0,today,'SHIPPED','PAID','Amit Kumar','Bangalore','Karnataka'],
      ['AMZ-10098','AMAZON','USB-C Cable 2m','USB-003','Electronics',3,199,40,23.88,30,0,yesterday,'DELIVERED','PAID','Priya Patel','Delhi','Delhi']
    ];

    for (const o of orders) {
      const saleTotal = o[6] * o[5];
      const platformFee = o[8] * o[5];
      const shippingFee = o[9];
      const otherDed = o[10];
      const netReceived = saleTotal - platformFee - shippingFee - otherDed;
      const costTotal = o[7] * o[5];
      const profit = netReceived - costTotal;
      const margin = saleTotal > 0 ? ((profit / saleTotal) * 100) : 0;
      await pool.execute(
        `INSERT INTO orders (order_id, platform, product_name, product_sku, category, quantity, sale_price, my_cost_price, platform_fee, shipping_fee, other_deductions, net_amount_received, profit, profit_margin, order_date, delivery_status, payment_status, customer_name, customer_city, customer_state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [o[0],o[1],o[2],o[3],o[4],o[5],saleTotal,costTotal,platformFee,shippingFee,otherDed,netReceived,profit,margin.toFixed(2),o[11],o[12],o[13],o[14],o[15],o[16]]
      );
    }
    console.log('Inserted today orders!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
insertTodayOrders();
