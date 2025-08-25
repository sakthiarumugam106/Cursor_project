const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  const sqlPath = path.resolve(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const dbName = process.env.DB_NAME || 'education_management';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    multipleStatements: true
  });

  try {
    console.log(`🧹 Dropping database ${dbName} if exists...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log('🚀 Recreating schema...');
    await connection.query(sql);
    console.log('✅ Reset completed.');
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }

  if (process.argv.includes('--seed')) {
    console.log('🌱 Seeding data...');
    require('./seed');
  }
}

resetDatabase();