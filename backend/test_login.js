async function testLogin() {
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
    console.log('Login Data:', data);
  } catch (err) {
    console.error('Login Error:', err.message);
  }
}
testLogin();
