const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

async function seed() {
  const conn = await pool.getConnection();
  try {
    // Create admin user
    const hash = await bcrypt.hash('Admin@123', 10);
    await conn.execute(
      `INSERT IGNORE INTO users (name, email, password_hash, business_name) VALUES (?, ?, ?, ?)`,
      ['Admin', 'admin@business.com', hash, 'My Seller Business']
    );

    // Seed products
    const products = [
      ['Wireless Earbuds Pro', 'WEP-001', 'Electronics', 450, 1299, 'Bluetooth 5.0 earbuds', 150],
      ['Phone Case Premium', 'PCP-002', 'Accessories', 80, 399, 'Shockproof phone case', 300],
      ['USB-C Cable 2m', 'USB-003', 'Electronics', 40, 199, 'Fast charging cable', 500],
      ['Laptop Stand Aluminum', 'LSA-004', 'Accessories', 350, 999, 'Ergonomic laptop stand', 75],
      ['Screen Protector Pack', 'SPP-005', 'Accessories', 25, 149, 'Tempered glass 3-pack', 400],
      ['Bluetooth Speaker Mini', 'BSM-006', 'Electronics', 600, 1799, 'Portable speaker 10W', 60],
      ['Webcam HD 1080p', 'WHD-007', 'Electronics', 500, 1499, 'HD webcam with mic', 40],
      ['Mouse Pad XL', 'MPX-008', 'Accessories', 120, 499, 'Extended gaming mousepad', 200]
    ];
    for (const p of products) {
      await conn.execute(
        `INSERT IGNORE INTO products (name, sku, category, cost_price, mrp, description, stock_quantity) VALUES (?,?,?,?,?,?,?)`,
        p
      );
    }

    // Seed platform fee rules
    const rules = [
      ['AMAZON', 'Electronics', 12, 0],
      ['AMAZON', 'Accessories', 15, 0],
      ['AMAZON', 'Clothing', 17, 0],
      ['FLIPKART', 'Electronics', 10, 0],
      ['FLIPKART', 'Accessories', 14, 0],
      ['FLIPKART', 'Clothing', 16, 0]
    ];
    for (const r of rules) {
      await conn.execute(
        `INSERT IGNORE INTO platform_fee_rules (platform, category, fee_percentage, fixed_fee, effective_from) VALUES (?,?,?,?,CURDATE())`,
        r
      );
    }

    // Seed orders
    const orders = [
      ['AMZ-10001','AMAZON','Wireless Earbuds Pro','WEP-001','Electronics',2,1299,450,155.88,50,0,'2026-05-22','DELIVERED','PAID','Rahul Sharma','Mumbai','Maharashtra'],
      ['AMZ-10002','AMAZON','USB-C Cable 2m','USB-003','Electronics',3,199,40,23.88,30,0,'2026-05-21','SHIPPED','PAID','Priya Patel','Delhi','Delhi'],
      ['FLK-20001','FLIPKART','Phone Case Premium','PCP-002','Accessories',1,399,80,55.86,40,0,'2026-05-20','DELIVERED','PAID','Amit Kumar','Bangalore','Karnataka'],
      ['AMZ-10003','AMAZON','Laptop Stand Aluminum','LSA-004','Accessories',1,999,350,149.85,60,0,'2026-05-19','PENDING','PENDING','Sneha Reddy','Hyderabad','Telangana'],
      ['FLK-20002','FLIPKART','Bluetooth Speaker Mini','BSM-006','Electronics',1,1799,600,179.90,70,0,'2026-05-18','DELIVERED','PAID','Vikram Singh','Jaipur','Rajasthan'],
      ['AMZ-10004','AMAZON','Screen Protector Pack','SPP-005','Accessories',5,149,25,22.35,25,0,'2026-05-17','CANCELLED','REFUNDED','Deepa Nair','Chennai','Tamil Nadu'],
      ['FLK-20003','FLIPKART','Webcam HD 1080p','WHD-007','Electronics',1,1499,500,149.90,60,0,'2026-05-16','SHIPPED','PAID','Karan Mehta','Pune','Maharashtra'],
      ['AMZ-10005','AMAZON','Mouse Pad XL','MPX-008','Accessories',2,499,120,74.85,35,0,'2026-05-15','DELIVERED','PAID','Neha Gupta','Kolkata','West Bengal'],
      ['FLK-20004','FLIPKART','Wireless Earbuds Pro','WEP-001','Electronics',1,1299,450,129.90,55,0,'2026-05-14','RETURNED','REFUNDED','Rohan Das','Lucknow','Uttar Pradesh'],
      ['AMZ-10006','AMAZON','Phone Case Premium','PCP-002','Accessories',3,399,80,59.85,40,10,'2026-05-23','PENDING','PENDING','Aisha Khan','Ahmedabad','Gujarat'],
      // Older orders for chart data
      ['AMZ-10007','AMAZON','USB-C Cable 2m','USB-003','Electronics',2,199,40,23.88,30,0,'2026-04-10','DELIVERED','PAID','Test User1','Mumbai','Maharashtra'],
      ['FLK-20005','FLIPKART','Laptop Stand Aluminum','LSA-004','Accessories',1,999,350,139.86,60,0,'2026-04-15','DELIVERED','PAID','Test User2','Delhi','Delhi'],
      ['AMZ-10008','AMAZON','Bluetooth Speaker Mini','BSM-006','Electronics',1,1799,600,215.88,70,0,'2026-03-05','DELIVERED','PAID','Test User3','Bangalore','Karnataka'],
      ['FLK-20006','FLIPKART','Webcam HD 1080p','WHD-007','Electronics',2,1499,500,149.90,60,0,'2026-02-20','DELIVERED','PAID','Test User4','Chennai','Tamil Nadu'],
      ['AMZ-10009','AMAZON','Mouse Pad XL','MPX-008','Accessories',1,499,120,74.85,35,0,'2026-01-12','DELIVERED','PAID','Test User5','Pune','Maharashtra'],
      ['FLK-20007','FLIPKART','Screen Protector Pack','SPP-005','Accessories',3,149,25,20.86,25,0,'2025-12-08','DELIVERED','PAID','Test User6','Hyderabad','Telangana']
    ];
    for (const o of orders) {
      const saleTotal = o[6] * o[5]; // sale_price * quantity
      const platformFee = o[8] * o[5];
      const shippingFee = o[9];
      const otherDed = o[10];
      const netReceived = saleTotal - platformFee - shippingFee - otherDed;
      const costTotal = o[7] * o[5];
      const profit = netReceived - costTotal;
      const margin = saleTotal > 0 ? ((profit / saleTotal) * 100) : 0;
      await conn.execute(
        `INSERT INTO orders (order_id, platform, product_name, product_sku, category, quantity, sale_price, my_cost_price, platform_fee, shipping_fee, other_deductions, net_amount_received, profit, profit_margin, order_date, delivery_status, payment_status, customer_name, customer_city, customer_state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [o[0],o[1],o[2],o[3],o[4],o[5],saleTotal,costTotal,platformFee,shippingFee,otherDed,netReceived,profit,margin.toFixed(2),o[11],o[12],o[13],o[14],o[15],o[16]]
      );
    }

    // Seed expenses
    const expenses = [
      ['Packaging Material', 2500, 'Packaging', '2026-05-10', 'Boxes and bubble wrap'],
      ['Courier Pickup Charges', 800, 'Shipping', '2026-05-12', 'Extra pickup fee'],
      ['Product Photography', 3000, 'Marketing', '2026-05-05', 'Studio shoot'],
      ['Storage Rent', 5000, 'Storage', '2026-05-01', 'Monthly warehouse rent'],
      ['Return Processing', 600, 'Returns', '2026-04-28', 'Handling returned items']
    ];
    for (const e of expenses) {
      await conn.execute(
        `INSERT INTO expenses (title, amount, category, expense_date, notes) VALUES (?,?,?,?,?)`,
        e
      );
    }

    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    conn.release();
    process.exit();
  }
}

seed();
