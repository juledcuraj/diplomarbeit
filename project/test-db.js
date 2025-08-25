const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'myuser',
  password: 'password123',
  database: 'myappdb',
  ssl: false,
});

console.log('Testing database connection...');

pool.query('SELECT 1 as test')
  .then(result => {
    console.log('✅ SUCCESS! Database connection works:', result.rows[0]);
    console.log('Database is accessible from Node.js!');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ ERROR! Database connection failed:', err.message);
    console.log('Full error:', err);
    process.exit(1);
  });
