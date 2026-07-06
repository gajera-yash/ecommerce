const assert = require('assert');

async function test() {
  try {
    // Login to get token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@business.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
    const token = loginData.token;
    console.log('Login successful');

    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    // Create Product
    const prodRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Product ' + Date.now(),
        sku: 'TEST-SKU-' + Date.now(),
        category: 'Electronics',
        cost_price: 100,
        packaging_charge: 10,
        gst_rate: 18,
        mrp: 500
      })
    });
    const prodData = await prodRes.json();
    console.log('Product created:', prodData);

    // Create Order
    const orderRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        order_id: 'ORD-' + Date.now(),
        platform: 'AMAZON',
        product_sku: prodData.sku,
        product_name: prodData.name,
        quantity: 1,
        sale_price: 500, // unit
        my_cost_price: 100, // unit
        packaging_cost: 10, // unit
        gst_amount: 90, // total
        platform_fee: 50,
        shipping_fee: 40
      })
    });
    const orderData = await orderRes.json();
    console.log('Order created:', orderData);

    // Check Profit logic
    console.log('Net Received expected 410, got:', orderData.net_amount_received);
    console.log('Profit expected 210, got:', orderData.profit);
    assert.strictEqual(parseFloat(orderData.net_amount_received), 410);
    assert.strictEqual(parseFloat(orderData.profit), 210);

    // Call summary report for today
    const today = new Date().toISOString().split('T')[0];
    const summaryRes = await fetch(`http://localhost:5000/api/reports/overall-summary?from=${today}&to=${today}`, { headers });
    const summaryData = await summaryRes.json();
    console.log('Overall Summary:', summaryData);
    
    console.log('Test completed successfully');
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

test();
