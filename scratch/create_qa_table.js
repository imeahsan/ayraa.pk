const { Client } = require('pg');

const password = encodeURIComponent("asZ2G?YwHp45h+gj");
const connectionString = `postgresql://postgres.sqidwtxualtmelvjgxir:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to database successfully.");

  try {
    console.log("Creating public.product_questions table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.product_questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
        question_text TEXT NOT NULL,
        answer_text TEXT,
        is_answered BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        answered_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log("Table product_questions created/verified.");

    // Enable RLS
    console.log("Enabling RLS on product_questions...");
    await client.query(`
      ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;
    `);

    // Drop existing policies if any
    console.log("Creating RLS policies...");
    await client.query(`
      DROP POLICY IF EXISTS "Anyone read product questions" ON public.product_questions;
      DROP POLICY IF EXISTS "Anyone insert product questions" ON public.product_questions;
      DROP POLICY IF EXISTS "Admin update product questions" ON public.product_questions;
      DROP POLICY IF EXISTS "Admin delete product questions" ON public.product_questions;

      CREATE POLICY "Anyone read product questions" ON public.product_questions
          FOR SELECT USING (true);

      CREATE POLICY "Anyone insert product questions" ON public.product_questions
          FOR INSERT WITH CHECK (true);

      CREATE POLICY "Admin update product questions" ON public.product_questions
          FOR UPDATE USING (
              EXISTS (
                  SELECT 1 FROM public.profiles
                  WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
              )
          );

      CREATE POLICY "Admin delete product questions" ON public.product_questions
          FOR DELETE USING (
              EXISTS (
                  SELECT 1 FROM public.profiles
                  WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
              )
          );
    `);
    console.log("RLS policies created successfully.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

run();
