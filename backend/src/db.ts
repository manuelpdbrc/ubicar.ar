import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL?.replace('?connection_limit=3', '') || '',
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export default pool;
export { pool };
