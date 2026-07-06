async function testDashboard() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@business.com',
        password: 'Admin@123'
      })
    });
    const data = await res.json();
    console.log('Login Status:', res.status);
    
    if (data.token) {
      const res2 = await fetch('http://localhost:5000/api/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      const data2 = await res2.json();
      console.log('Dashboard Status:', res2.status);
      console.log('Dashboard Data:', data2);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testDashboard();
