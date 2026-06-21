const { Client } = require('pg');

const password = encodeURIComponent("asZ2G?YwHp45h+gj");
const connectionString = `postgresql://postgres.sqidwtxualtmelvjgxir:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to database successfully.");

  try {
    console.log("Confirming email for test_admin_qa_123@ayraa.pk...");
    const result = await client.query(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW() 
      WHERE email = 'test_admin_qa_123@ayraa.pk';
    `);
    console.log("Update result rows affected:", result.rowCount);
    
    // Check if user has a profile in public.profiles, if not, create one
    console.log("Checking public.profiles entry...");
    const userRes = await client.query(`
      SELECT id FROM auth.users WHERE email = 'test_admin_qa_123@ayraa.pk';
    `);
    
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      const profileRes = await client.query(`
        SELECT id FROM public.profiles WHERE id = $1;
      `, [userId]);
      
      if (profileRes.rows.length === 0) {
        console.log("Creating missing profile entry in public.profiles...");
        await client.query(`
          INSERT INTO public.profiles (id, email, full_name, role)
          VALUES ($1, 'test_admin_qa_123@ayraa.pk', 'Test Admin QA', 'customer');
        `, [userId]);
        console.log("Profile created successfully.");
      } else {
        console.log("Profile already exists.");
      }
    } else {
      console.log("User not found in auth.users.");
    }
  } catch (err) {
    console.error("Execution failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

run();
