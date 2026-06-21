const { Client } = require('pg');

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

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80"
];

async function seed() {
  const client = new Client(clientConfig);
  await client.connect();
  console.log("Connected to database.");

  try {
    // 1. Fetch all child categories (where parent_id is not null)
    const { rows: categories } = await client.query(`
      SELECT id, name, slug FROM public.categories WHERE parent_id IS NOT NULL;
    `);

    console.log(`Found ${categories.length} child categories to seed.`);

    for (const cat of categories) {
      console.log(`Processing category: ${cat.name} (${cat.slug})`);

      // Check current product count in this category
      const { rows: [{ count }] } = await client.query(`
        SELECT COUNT(*) as count FROM public.products WHERE category_id = $1;
      `, [cat.id]);

      const countNum = parseInt(count);
      const needed = 5 - countNum;

      if (needed <= 0) {
        console.log(`Category ${cat.name} already has ${countNum} products. Skipping.`);
        continue;
      }

      console.log(`Category ${cat.name} has ${countNum} products. Seeding ${needed} more...`);

      for (let i = 1; i <= needed; i++) {
        const prodIndex = countNum + i;
        const name = `${cat.name} Premium Piece ${prodIndex}`;
        const slug = `${cat.slug}-premium-piece-${prodIndex}`;
        
        // Select check instead of ON CONFLICT
        const { rows: existingProd } = await client.query(`
          SELECT id FROM public.products WHERE slug = $1;
        `, [slug]);

        if (existingProd.length > 0) {
          console.log(`Product with slug ${slug} already exists. Skipping.`);
          continue;
        }

        const description = `Indulge in our exquisite ${cat.name.toLowerCase()} design. Handcrafted with precision and detailed gold thread embroidery. Features high-quality comfort fabric suitable for all luxury occasions.`;
        const price = 4500 + (prodIndex * 1500); // PKR pricing logic
        const compareAtPrice = price + 2000;
        
        // Generate a uniquely random SKU to prevent unique key violation
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const sku = `AYR-${cat.slug.slice(0, 3).toUpperCase()}-${randomNum}`;
        
        const fabric = "Premium Weave";
        const color = ["Gold Accent", "Ivory Cream", "Midnight Charcoal", "Crimson Aureate", "Rose Pearl"][prodIndex % 5];
        const includes = "3-Piece Suit (Shirt, Trouser, Dupatta)";
        const careInstructions = "Dry clean only. Iron at low temperature.";

        // Insert product
        const { rows: [insertedProduct] } = await client.query(`
          INSERT INTO public.products (name, slug, description, price, compare_at_price, sku, category_id, fabric, color, includes, care_instructions, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
          RETURNING id;
        `, [name, slug, description, price, compareAtPrice, sku, cat.id, fabric, color, includes, careInstructions]);

        const productId = insertedProduct.id;

        // Insert primary product image
        const imgUrl = UNSPLASH_IMAGES[(cat.name.length + prodIndex) % UNSPLASH_IMAGES.length];
        await client.query(`
          INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary)
          VALUES ($1, $2, $3, 1, true);
        `, [productId, imgUrl, name]);

        // Insert variants (XS, S, M, L, XL)
        const sizes = ["S", "M", "L", "XL"];
        for (const size of sizes) {
          const stock = 10 + (prodIndex * 3) + (size.charCodeAt(0) % 5);
          // Check if variant already exists
          const { rows: existingVar } = await client.query(`
            SELECT id FROM public.product_variants WHERE product_id = $1 AND size = $2;
          `, [productId, size]);

          if (existingVar.length === 0) {
            await client.query(`
              INSERT INTO public.product_variants (product_id, size, stock_quantity, is_available)
              VALUES ($1, $2, $3, true);
            `, [productId, size, stock]);
          }
        }

        console.log(`Seeded product: ${name}`);
      }
    }

    console.log("Database seeding completed successfully.");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

seed();
