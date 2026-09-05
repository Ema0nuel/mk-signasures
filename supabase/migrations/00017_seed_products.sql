-- Seed real product data for MK Signasures
-- Safe to re-run: uses ON CONFLICT DO NOTHING

-- ============================================================
-- Categories
-- ============================================================
INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567001', 'Wigs', 'wigs', 'Premium quality wigs for every occasion', NULL, NULL, 1, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567002', 'Hair Extensions', 'hair-extensions', 'Extensions that blend seamlessly', NULL, NULL, 2, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567003', 'Clothing', 'clothing', 'Curated styles for the modern woman', NULL, NULL, 3, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567004', 'Accessories', 'accessories', 'Complete your look', NULL, NULL, 4, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Products
-- ============================================================
INSERT INTO products (id, name, slug, description, short_description, category_id, base_price, status, is_featured, meta_title, meta_description, tags)
VALUES
  -- Product 1: Lagos Body Wave Wig
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567001', 'Lagos Body Wave Wig', 'lagos-body-wave-wig',
   'Our signature body wave wig crafted from 100% virgin human hair. Soft, voluminous, and designed to hold its pattern wash after wash. Perfect for everyday glam or special occasions.',
   '100% virgin human hair body wave wig',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567001', 85000, 'active', true,
   'Lagos Body Wave Wig | MK Signasures', 'Premium body wave wig from MK Signasures',
   ARRAY['wigs', 'body-wave', 'bestseller']),

  -- Product 2: Abuja Straight Lace Front
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567002', 'Abuja Straight Lace Front', 'abuja-straight-lace-front',
   'Sleek, bone-straight lace front wig with a transparent HD lace that melts into all skin tones. 180% density for a full, natural look.',
   'HD lace front straight wig, 180% density',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567001', 120000, 'active', true,
   'Abuja Straight Lace Front | MK Signasures', 'HD lace front straight wig from MK Signasures',
   ARRAY['wigs', 'lace-front', 'straight']),

  -- Product 3: Ibadan Kinky Curly Bundle
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567003', 'Ibadan Kinky Curly Bundle', 'ibadan-kinky-curly-bundle',
   'Raw kinky curly hair bundles that give you volume and texture. Triple weft construction for minimal shedding. Available in 12 to 26 inches.',
   'Raw kinky curly bundles, triple weft',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567002', 45000, 'active', true,
   'Ibadan Kinky Curly Bundle | MK Signasures', 'Raw kinky curly hair bundles from MK Signasures',
   ARRAY['hair-extensions', 'curly', 'bundles']),

  -- Product 4: Gold Link Chain Necklace
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567004', 'Gold Link Chain Necklace', 'gold-link-chain-necklace',
   '18k gold-plated link chain necklace that elevates any outfit. Tarnish-resistant, waterproof, and built to last. Adjustable 16 to 20 inch chain.',
   '18k gold-plated link chain, adjustable',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567004', 25000, 'active', false,
   'Gold Link Chain Necklace | MK Signasures', '18k gold-plated chain from MK Signasures',
   ARRAY['accessories', 'jewelry', 'necklace']),

  -- Product 5: Flowy Ankara Maxi Dress
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567005', 'Flowy Ankara Maxi Dress', 'flowy-ankara-maxi-dress',
   'Bold ankara print maxi dress with a flattering A-line silhouette. Lightweight cotton fabric, side pockets, and an adjustable waist tie. Perfect for brunch, weddings, or weekends.',
   'Ankara print maxi dress with pockets',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567003', 35000, 'active', true,
   'Flowy Ankara Maxi Dress | MK Signasures', 'Ankara maxi dress from MK Signasures',
   ARRAY['clothing', 'dress', 'ankara'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Variant Attributes
-- ============================================================
INSERT INTO variant_attributes (id, product_id, name, display_name, sort_order)
VALUES
  -- Product 1: Length + Density
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567001', 'b1b2c3d4-e5f6-7890-abcd-ef1234567001', 'length', 'Length', 0),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567002', 'b1b2c3d4-e5f6-7890-abcd-ef1234567001', 'density', 'Density', 1),

  -- Product 2: Length
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567003', 'b1b2c3d4-e5f6-7890-abcd-ef1234567002', 'length', 'Length', 0),

  -- Product 3: Length
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567004', 'b1b2c3d4-e5f6-7890-abcd-ef1234567003', 'length', 'Length', 0),

  -- Product 5: Size
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567005', 'b1b2c3d4-e5f6-7890-abcd-ef1234567005', 'size', 'Size', 0)
ON CONFLICT (product_id, name) DO NOTHING;

-- ============================================================
-- Variant Options
-- ============================================================
INSERT INTO variant_options (id, attribute_id, value, display_value, sort_order)
VALUES
  -- Product 1: Length options
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567001', 'c1b2c3d4-e5f6-7890-abcd-ef1234567001', '14', '14 inches', 0),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567002', 'c1b2c3d4-e5f6-7890-abcd-ef1234567001', '18', '18 inches', 1),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567003', 'c1b2c3d4-e5f6-7890-abcd-ef1234567001', '22', '22 inches', 2),

  -- Product 1: Density options
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567004', 'c1b2c3d4-e5f6-7890-abcd-ef1234567002', '150', '150%', 0),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567005', 'c1b2c3d4-e5f6-7890-abcd-ef1234567002', '180', '180%', 1),

  -- Product 2: Length options
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567006', 'c1b2c3d4-e5f6-7890-abcd-ef1234567003', '16', '16 inches', 0),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567007', 'c1b2c3d4-e5f6-7890-abcd-ef1234567003', '20', '20 inches', 1),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567008', 'c1b2c3d4-e5f6-7890-abcd-ef1234567003', '24', '24 inches', 2),

  -- Product 3: Length options
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567009', 'c1b2c3d4-e5f6-7890-abcd-ef1234567004', '12', '12 inches', 0),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567010', 'c1b2c3d4-e5f6-7890-abcd-ef1234567004', '16', '16 inches', 1),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567011', 'c1b2c3d4-e5f6-7890-abcd-ef1234567004', '20', '20 inches', 2),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567012', 'c1b2c3d4-e5f6-7890-abcd-ef1234567004', '26', '26 inches', 3),

  -- Product 5: Size options
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567013', 'c1b2c3d4-e5f6-7890-abcd-ef1234567005', 'S', 'Small', 0),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567014', 'c1b2c3d4-e5f6-7890-abcd-ef1234567005', 'M', 'Medium', 1),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567015', 'c1b2c3d4-e5f6-7890-abcd-ef1234567005', 'L', 'Large', 2),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567016', 'c1b2c3d4-e5f6-7890-abcd-ef1234567005', 'XL', 'Extra Large', 3)
ON CONFLICT (attribute_id, value) DO NOTHING;

-- ============================================================
-- Product Variants
-- ============================================================
INSERT INTO product_variants (id, product_id, sku, price, compare_at_price, stock_quantity, weight_grams, is_active, barcode)
VALUES
  -- Product 1: Lagos Body Wave Wig
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567001', 'b1b2c3d4-e5f6-7890-abcd-ef1234567001', 'LBW-14-150', 85000, NULL, 12, 250, true, NULL),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567002', 'b1b2c3d4-e5f6-7890-abcd-ef1234567001', 'LBW-18-150', 95000, NULL, 8, 300, true, NULL),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567003', 'b1b2c3d4-e5f6-7890-abcd-ef1234567001', 'LBW-22-180', 115000, 130000, 5, 350, true, NULL),

  -- Product 2: Abuja Straight Lace Front
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567004', 'b1b2c3d4-e5f6-7890-abcd-ef1234567002', 'ASLF-16', 120000, NULL, 6, 280, true, NULL),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567005', 'b1b2c3d4-e5f6-7890-abcd-ef1234567002', 'ASLF-20', 145000, NULL, 4, 320, true, NULL),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567006', 'b1b2c3d4-e5f6-7890-abcd-ef1234567002', 'ASLF-24', 170000, 190000, 2, 380, true, NULL),

  -- Product 3: Ibadan Kinky Curly Bundle
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567007', 'b1b2c3d4-e5f6-7890-abcd-ef1234567003', 'IKC-12', 45000, NULL, 20, 150, true, NULL),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567008', 'b1b2c3d4-e5f6-7890-abcd-ef1234567003', 'IKC-26', 75000, 85000, 3, 250, true, NULL),

  -- Product 4: Gold Link Chain Necklace (single variant)
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567009', 'b1b2c3d4-e5f6-7890-abcd-ef1234567004', 'GLCN-ONE', 25000, NULL, 30, 50, true, NULL),

  -- Product 5: Flowy Ankara Maxi Dress
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567010', 'b1b2c3d4-e5f6-7890-abcd-ef1234567005', 'FAMD-S', 35000, NULL, 10, 400, true, NULL),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567011', 'b1b2c3d4-e5f6-7890-abcd-ef1234567005', 'FAMD-M', 35000, NULL, 8, 420, true, NULL),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567012', 'b1b2c3d4-e5f6-7890-abcd-ef1234567005', 'FAMD-L', 35000, NULL, 5, 440, true, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Product Variant Selections (junction table)
-- ============================================================
INSERT INTO product_variant_selections (product_variant_id, variant_option_id)
VALUES
  -- Product 1 variants
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567001', 'd1b2c3d4-e5f6-7890-abcd-ef1234567001'), -- 14 inch
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567001', 'd1b2c3d4-e5f6-7890-abcd-ef1234567004'), -- 150%
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567002', 'd1b2c3d4-e5f6-7890-abcd-ef1234567002'), -- 18 inch
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567002', 'd1b2c3d4-e5f6-7890-abcd-ef1234567004'), -- 150%
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567003', 'd1b2c3d4-e5f6-7890-abcd-ef1234567003'), -- 22 inch
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567003', 'd1b2c3d4-e5f6-7890-abcd-ef1234567005'), -- 180%

  -- Product 2 variants
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567004', 'd1b2c3d4-e5f6-7890-abcd-ef1234567006'), -- 16 inch
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567005', 'd1b2c3d4-e5f6-7890-abcd-ef1234567007'), -- 20 inch
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567006', 'd1b2c3d4-e5f6-7890-abcd-ef1234567008'), -- 24 inch

  -- Product 3 variants
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567007', 'd1b2c3d4-e5f6-7890-abcd-ef1234567009'), -- 12 inch
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567008', 'd1b2c3d4-e5f6-7890-abcd-ef1234567012'), -- 26 inch

  -- Product 5 variants
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567010', 'd1b2c3d4-e5f6-7890-abcd-ef1234567013'), -- S
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567011', 'd1b2c3d4-e5f6-7890-abcd-ef1234567014'), -- M
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567012', 'd1b2c3d4-e5f6-7890-abcd-ef1234567015')  -- L
ON CONFLICT DO NOTHING;

-- ============================================================
-- Product Images (using logo as placeholder)
-- ============================================================
INSERT INTO product_images (product_id, product_variant_id, original_url, optimized_url, blur_data_url, alt_text, storage_path, sort_order, is_primary, width, height, file_size_bytes, processing_status)
VALUES
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567001', NULL, '/images/logo.JPG', NULL, NULL, 'Lagos Body Wave Wig', 'products/lagos-body-wave.jpg', 0, true, 800, 1067, 300000, 'completed'),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567002', NULL, '/images/logo.JPG', NULL, NULL, 'Abuja Straight Lace Front Wig', 'products/abuja-straight.jpg', 0, true, 800, 1067, 300000, 'completed'),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567003', NULL, '/images/logo.JPG', NULL, NULL, 'Ibadan Kinky Curly Bundle', 'products/ibadan-kinky-curly.jpg', 0, true, 800, 1067, 300000, 'completed'),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567004', NULL, '/images/logo.JPG', NULL, NULL, 'Gold Link Chain Necklace', 'products/gold-chain.jpg', 0, true, 800, 1067, 300000, 'completed'),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567005', NULL, '/images/logo.JPG', NULL, NULL, 'Flowy Ankara Maxi Dress', 'products/ankara-dress.jpg', 0, true, 800, 1067, 300000, 'completed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Product Reviews (only if table exists and auth users exist)
-- Reviews require real auth.users IDs, so we skip if none exist
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_reviews') THEN
    -- Only insert reviews for users that actually exist in auth.users
    INSERT INTO product_reviews (product_id, user_id, author_name, rating, title, body, verified)
    SELECT * FROM (VALUES
      ('b1b2c3d4-e5f6-7890-abcd-ef1234567001', (SELECT id FROM auth.users LIMIT 1), 'Adaeze N.', 5, 'Absolutely gorgeous', 'The hair quality is amazing. Soft, true to length, and the wave pattern holds perfectly after washing. Will ordering again.', true),
      ('b1b2c3d4-e5f6-7890-abcd-ef1234567002', (SELECT id FROM auth.users LIMIT 1), 'Funke M.', 5, 'HD lace is everything', 'The lace melts into my skin perfectly. Everyone thinks it is my natural hair.', true),
      ('b1b2c3d4-e5f6-7890-abcd-ef1234567003', (SELECT id FROM auth.users LIMIT 1), 'Ngozi E.', 4, 'Beautiful curls', 'The kinky curly texture is so natural. Minimal shedding and great value.', true),
      ('b1b2c3d4-e5f6-7890-abcd-ef1234567004', (SELECT id FROM auth.users LIMIT 1), 'Kemi A.', 5, 'Love this necklace', 'The gold plating looks real and has not tarnished after weeks of daily wear.', true),
      ('b1b2c3d4-e5f6-7890-abcd-ef1234567005', (SELECT id FROM auth.users LIMIT 1), 'Temi B.', 5, 'Stunning dress', 'The ankara print is vibrant and the A-line cut is very flattering.', true)
    ) AS v(product_id, user_id, author_name, rating, title, body, verified)
    WHERE v.user_id IS NOT NULL
    ON CONFLICT (product_id, user_id) DO NOTHING;
  END IF;
END $$;
