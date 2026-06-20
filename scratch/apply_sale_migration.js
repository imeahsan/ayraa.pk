const fs = require('fs');
const { Client } = require('pg');

const envPath = 'a:/AntiGravity/Github/ayraa.pk/.env.local';
let connectionString = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/SUPABASE_DB_URL=(.+)/);
  if (match) {
    connectionString = match[1].trim();
  }
}

if (!connectionString) {
  console.error("SUPABASE_DB_URL is missing.");
  process.exit(1);
}

const matchConfig = connectionString.match(/^postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/);
if (!matchConfig) {
  console.error("Failed to parse SUPABASE_DB_URL.");
  process.exit(1);
}

const [_, user, password, host, port, database] = matchConfig;

const client = new Client({
  user,
  password,
  host,
  port: parseInt(port, 10),
  database,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres database successfully.");

    const query = `
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false NOT NULL;
    `;

    await client.query(query);
    console.log("Migration executed successfully. 'is_on_sale' column added to public.products.");
  } catch (error) {
    console.error("Error executing migration:", error);
  } finally {
    await client.end();
  }
}

main();
