const { Client } = require('pg');

// URL encode password characters to avoid invalid URL parsing
const password = encodeURIComponent("asZ2G?YwHp45h+gj");
const connectionString = `postgresql://postgres.sqidwtxualtmelvjgxir:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to database successfully.");

  try {
    // 1. Add color column
    console.log("Adding 'color' column to public.product_variants...");
    await client.query(`
      ALTER TABLE public.product_variants 
      ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'Standard';
    `);
    console.log("'color' column added/verified.");

    // 2. Find and drop the unique constraint (product_id, size)
    console.log("Finding unique constraint name on product_id, size...");
    const res = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'public.product_variants'::regclass 
        AND contype = 'u';
    `);

    for (const row of res.rows) {
      console.log(`Dropping constraint: ${row.conname}`);
      await client.query(`
        ALTER TABLE public.product_variants 
        DROP CONSTRAINT IF EXISTS "${row.conname}" CASCADE;
      `);
    }

    // 3. Create the new unique constraint
    console.log("Creating new unique constraint on (product_id, size, color)...");
    await client.query(`
      ALTER TABLE public.product_variants 
      ADD CONSTRAINT product_variants_product_id_size_color_key UNIQUE (product_id, size, color);
    `);
    console.log("New unique constraint created successfully.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

run();
