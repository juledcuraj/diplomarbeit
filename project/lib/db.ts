import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'myuser',
  password: 'mysecretpassword',
  database: 'myappdb',
});

export default pool;