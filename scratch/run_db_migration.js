const { Client } = require('pg');

const password = encodeURIComponent(process.env.DB_PASSWORD || "placeholder");
const connectionString = process.env.DATABASE_URL || `postgresql://postgres.sqidwtxualtmelvjgxir:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to database successfully.");

  try {
    // 1. Alter product_reviews table
    console.log("Altering public.product_reviews to add images column...");
    await client.query(`
      ALTER TABLE public.product_reviews 
      ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::TEXT[] NOT NULL;
    `);
    console.log("product_reviews altered successfully.");

    // 2. Alter store_settings table to add SMTP credentials
    console.log("Altering public.store_settings to add SMTP configuration columns...");
    await client.query(`
      ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT;
      ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS smtp_port INT DEFAULT 587;
      ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS smtp_user TEXT;
      ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS smtp_pass TEXT;
    `);
    console.log("store_settings altered successfully.");

    // 3. Pre-seed/Update SMTP credentials in store_settings (ID = 1)
    console.log("Seeding SMTP configuration into public.store_settings...");
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    await client.query(`
      UPDATE public.store_settings 
      SET 
        smtp_host = 'smtp-relay.brevo.com',
        smtp_port = 587,
        smtp_user = $1,
        smtp_pass = $2
      WHERE id = 1;
    `, [smtpUser, smtpPass]);
    console.log("SMTP configurations seeded successfully.");

    // 4. Create review-images storage bucket and set policies
    console.log("Creating review-images storage bucket...");
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('review-images', 'review-images', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("Creating storage policies for review-images...");
    await client.query(`
      DROP POLICY IF EXISTS "Public Read Review Images" ON storage.objects;
      DROP POLICY IF EXISTS "Users upload review images" ON storage.objects;
      DROP POLICY IF EXISTS "Admins full control review images" ON storage.objects;

      CREATE POLICY "Public Read Review Images" ON storage.objects
          FOR SELECT USING (bucket_id = 'review-images');

      CREATE POLICY "Users upload review images" ON storage.objects
          FOR INSERT WITH CHECK (
              bucket_id = 'review-images' 
              AND auth.role() = 'authenticated'
          );

      CREATE POLICY "Admins full control review images" ON storage.objects
          USING (
              bucket_id = 'review-images'
              AND EXISTS (
                  SELECT 1 FROM public.profiles
                  WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
              )
          );
    `);
    console.log("Storage bucket policies set up successfully.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

run();
