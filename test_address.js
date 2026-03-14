// Test script: create an address using a real customer's JWT token
const pg = require('pg');
const jwt = require('jsonwebtoken');

const pool = new pg.Pool({
  host: 'localhost', port: 5432,
  database: 'tassa_dev', user: 'postgres', password: 'newpassword'
});

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production';

async function main() {
  try {
    // 1) Find a customer user
    const users = await pool.query(`
      SELECT u.id, u.phone, u.full_name, r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'CUSTOMER'
      LIMIT 5
    `);
    
    if (users.rows.length === 0) {
      console.log('No CUSTOMER users found. Checking all users:');
      const allUsers = await pool.query('SELECT id, phone, name FROM users LIMIT 5');
      console.log(allUsers.rows);
      
      const allRoles = await pool.query(`
        SELECT u.id, u.phone, r.name as role 
        FROM users u 
        JOIN user_roles ur ON u.id = ur.user_id 
        JOIN roles r ON ur.role_id = r.id
      `);
      console.log('User-roles:', allRoles.rows);
      pool.end();
      return;
    }
    
    const user = users.rows[0];
    console.log('Using customer:', user.id, user.phone, user.name);
    
    // 2) Generate a valid JWT
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, roles: ['CUSTOMER'], activeRole: 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '1h', issuer: 'tassa-api', audience: 'tassa-app' }
    );
    console.log('Token generated (first 50 chars):', token.substring(0, 50) + '...');
    
    // 3) POST to create address
    const body = JSON.stringify({
      label: 'home',
      fullName: 'Test User',
      phone: '+91 9876543210',
      addressLine1: 'Main Market Bhadas',
      city: 'Nuh',
      state: 'Haryana',
      pincode: '122107',
      isDefault: false,
    });
    
    console.log('\nPOST /api/v1/customers/addresses');
    console.log('Body:', body);
    
    const http = require('http');
    const result = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost', port: 3000,
        path: '/api/v1/customers/addresses',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, body: data });
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    
    console.log('\nResponse status:', result.status);
    try {
      const parsed = JSON.parse(result.body);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Raw response:', result.body);
    }
    
    // 4) Check addresses in DB
    const addrs = await pool.query('SELECT id, user_id, label, full_name, city FROM addresses WHERE user_id = $1', [user.id]);
    console.log('\nAddresses in DB for this user:', addrs.rows);
    
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  } finally {
    pool.end();
  }
}

main();
