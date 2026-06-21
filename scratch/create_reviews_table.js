const { Client } = require('pg');

const password = encodeURIComponent("asZ2G?YwHp45h+gj");
const connectionString = `postgresql://postgres.sqidwtxualtmelvjgxir:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to database successfully.");

  try {
    console.log("Creating public.product_reviews table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.product_reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        reviewer_name TEXT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        is_verified_buyer BOOLEAN DEFAULT true NOT NULL,
        is_approved BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log("Table product_reviews created/verified.");

    // Enable RLS
    console.log("Enabling RLS on product_reviews...");
    await client.query(`
      ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
    `);

    // Drop existing policies if any
    console.log("Creating RLS policies...");
    await client.query(`
      DROP POLICY IF EXISTS "Anyone read approved reviews" ON public.product_reviews;
      DROP POLICY IF EXISTS "Users insert own reviews" ON public.product_reviews;
      DROP POLICY IF EXISTS "Admin full control of reviews" ON public.product_reviews;

      CREATE POLICY "Anyone read approved reviews" ON public.product_reviews
          FOR SELECT USING (is_approved = true);

      CREATE POLICY "Users insert own reviews" ON public.product_reviews
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Admin full control of reviews" ON public.product_reviews
          USING (
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
