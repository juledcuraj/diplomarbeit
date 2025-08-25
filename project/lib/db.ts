import { Pool } from 'pg';

console.log('Initializing PostgreSQL connection pool...');

// Use connection string approach that might bypass Windows networking issues
const connectionString = 'postgresql://myuser:password123@localhost:5432/myappdb';

const pool = new Pool({
  connectionString: connectionString,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test the connection on startup
pool.on('connect', (client) => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection immediately
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Database connection pool initialized successfully');
    release();
  }
});

export default pool;
