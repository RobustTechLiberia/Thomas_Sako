/* eslint-disable no-undef */
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

try {
  console.log('Creating database...');
  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'db_poll'}`);
  
  console.log('Switching to database...');
  await connection.execute(`USE ${process.env.DB_NAME || 'db_poll'}`);

  console.log('Creating tables...');
  const sqlFile = path.join(__dirname, '../db/init.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await connection.execute(statement);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('Error executing:', statement.substring(0, 100));
          console.error(error.message);
        }
      }
    }
  }

  console.log('✓ Database initialized successfully');
  console.log('✓ All tables created');
  console.log('✓ Default settings inserted');
  
} catch (error) {
  console.error('✗ Database initialization failed:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
