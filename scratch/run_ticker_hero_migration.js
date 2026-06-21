const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const clientConfig = {
  user: 'postgres.sqidwtxualtmelvjgxir',
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  database: 'postgres',
  password: 'asZ2G?YwHp45h+gj',
  port: 6543,
  ssl: {
    rejectUnauthorized: false
  }
};

async function run() {
  const client = new Client(clientConfig);
  await client.connect();
  console.log("Connected to database successfully.");

  try {
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260621000003_ticker_hero_admin.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Executing SQL migration...");
    await client.query(sql);
    console.log("Migration executed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

run();
