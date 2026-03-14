const pg = require('pg');
const pool = new pg.Pool({host:'localhost',port:5432,database:'tassa_dev',user:'postgres',password:''});

async function main() {
  try {
    const t = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='addresses'");
    console.log('addresses table exists:', t.rows.length > 0);
    
    const c = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='addresses' ORDER BY ordinal_position");
    console.log('Columns:');
    c.rows.forEach(r => console.log('  ', r.column_name, '-', r.data_type));
    
    const cnt = await pool.query("SELECT COUNT(*) FROM addresses");
    console.log('Row count:', cnt.rows[0].count);
    
    // Check if there are any users with CUSTOMER role
    const users = await pool.query("SELECT u.id, u.phone, u.name, ur.role_id, r.name as role_name FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'CUSTOMER' LIMIT 5");
    console.log('\nCustomer users:');
    users.rows.forEach(r => console.log('  ', r.id, r.phone, r.name, r.role_name));
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}
main();
