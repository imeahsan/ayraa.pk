const fs = require('fs');
const path = require('path');
const { Client } = require('e:\\CODES\\AyraCollection\\ayra-frontend\\node_modules\\pg');

// Parse .env.local
const envPath = 'e:\\CODES\\AyraCollection\\ayra-frontend\\.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const connectionString = env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL not found in .env.local');
  process.exit(1);
}

// Parse postgresql://[user]:[password]@[host]:[port]/[database]
const urlMatch = connectionString.match(/^postgresql:\/\/([^:]+):(.*)@([^:]+):(\d+)\/(.+)$/);
if (!urlMatch) {
  console.error('Failed to parse SUPABASE_DB_URL:', connectionString);
  process.exit(1);
}

const dbConfig = {
  user: urlMatch[1],
  password: urlMatch[2],
  host: urlMatch[3],
  port: parseInt(urlMatch[4], 10),
  database: urlMatch[5],
  ssl: {
    rejectUnauthorized: false
  }
};

const migrations = [
  '20260627000004_pos_payment_methods.sql'
];

async function run() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to database:', dbConfig.host);

    for (const migration of migrations) {
      console.log(`\n--- Applying migration: ${migration} ---`);
      const migrationPath = path.join('e:\\CODES\\AyraCollection\\ayra-frontend\\supabase\\migrations', migration);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await client.query(sql);
      console.log(`Successfully applied: ${migration}`);
    }
    
    console.log('\nMigration applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
