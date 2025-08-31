-- Create admin user in auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
INSERT INTO public.profiles (id, email, role, full_name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin', 'Admin User')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Insert sample categories
INSERT INTO public.categories (id, name, slug, description, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Electronics', 'electronics', 'Electronic devices and gadgets', true),
  ('22222222-2222-2222-2222-222222222222', 'Clothing', 'clothing', 'Fashion and apparel', true),
  ('33333333-3333-3333-3333-333333333333', 'Home & Garden', 'home-garden', 'Home improvement and garden supplies', true),
  ('44444444-4444-4444-4444-444444444444', 'Sports', 'sports', 'Sports and fitness equipment', true),
  ('55555555-5555-5555-5555-555555555555', 'Books', 'books', 'Books and educational materials', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (id, name, slug, description, price, category_id, stock_quantity, image_urls, is_active, featured) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Wireless Bluetooth Headphones', 'wireless-bluetooth-headphones', 'High-quality wireless headphones with noise cancellation and 30-hour battery life.', 99.99, '11111111-1111-1111-1111-111111111111', 50, ARRAY['https://example.com/headphones1.jpg'], true, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Smartphone', 'smartphone', 'Latest generation smartphone with advanced camera system and fast processor.', 699.99, '11111111-1111-1111-1111-111111111111', 25, ARRAY['https://example.com/phone1.jpg'], true, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cotton T-Shirt', 'cotton-t-shirt', 'Comfortable 100% organic cotton t-shirt available in multiple colors.', 24.99, '22222222-2222-2222-2222-222222222222', 100, ARRAY['https://example.com/tshirt1.jpg'], true, false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Running Shoes', 'running-shoes', 'Lightweight running shoes with excellent cushioning and breathable mesh upper.', 129.99, '44444444-4444-4444-4444-444444444444', 30, ARRAY['https://example.com/shoes1.jpg'], true, true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Coffee Table', 'coffee-table', 'Modern wooden coffee table perfect for living room decoration.', 299.99, '33333333-3333-3333-3333-333333333333', 15, ARRAY['https://example.com/table1.jpg'], true, false),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Programming Book', 'programming-book', 'Complete guide to modern web development with practical examples.', 49.99, '55555555-5555-5555-5555-555555555555', 40, ARRAY['https://example.com/book1.jpg'], true, false),
  ('12345678-1234-1234-abcd-123456789abc', 'Laptop Computer', 'laptop-computer', 'High-performance laptop with fast SSD storage and long battery life.', 1299.99, '11111111-1111-1111-1111-111111111111', 10, ARRAY['https://example.com/laptop1.jpg'], true, true),
  ('87654321-4321-4321-dcba-cba987654321', 'Yoga Mat', 'yoga-mat', 'Non-slip yoga mat made from eco-friendly materials.', 39.99, '44444444-4444-4444-4444-444444444444', 60, ARRAY['https://example.com/yogamat1.jpg'], true, false)
ON CONFLICT (id) DO NOTHING;

-- Create a demo user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'user@example.com',
  crypt('user123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create demo user profile
INSERT INTO public.profiles (id, email, role, full_name) VALUES 
  ('00000000-0000-0000-0000-000000000002', 'user@example.com', 'user', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- Insert sample cart items for demo user
INSERT INTO public.cart_items (id, user_id, product_id, quantity) VALUES
  ('abcdefab-cdef-abcd-efab-cdefabcdefab', '00000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1),
  ('bcdefabc-defa-bcde-fabc-defabcdefabc', '00000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2)
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Insert sample order
INSERT INTO public.orders (id, user_id, status, total_amount, shipping_address, payment_status) VALUES
  ('fedcbafe-dcba-fedc-bafe-dcbafedcbafe', '00000000-0000-0000-0000-000000000002', 'delivered', 154.98, '{"street": "123 Main St", "city": "Anytown", "state": "CA", "zip": "12345", "country": "USA"}', 'paid')
ON CONFLICT (id) DO NOTHING;

-- Insert sample order items
INSERT INTO public.order_items (id, order_id, product_id, quantity, price, product_name, product_image_url) VALUES
  ('cdefcdef-cdef-cdef-cdef-cdefcdefcdef', 'fedcbafe-dcba-fedc-bafe-dcbafedcbafe', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 129.99, 'Running Shoes', 'https://example.com/shoes1.jpg'),
  ('defcdefc-defc-defc-defc-defcdefcdefc', 'fedcbafe-dcba-fedc-bafe-dcbafedcbafe', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 24.99, 'Cotton T-Shirt', 'https://example.com/tshirt1.jpg')
ON CONFLICT (id) DO NOTHING;

-- Insert sample reviews
INSERT INTO public.reviews (id, user_id, product_id, rating, title, comment, verified_purchase) VALUES
  ('facefacd-face-facd-face-facdfacefacd', '00000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Excellent headphones!', 'Great sound quality and comfortable to wear for long periods.', false),
  ('acefaces-cefa-cefd-aces-facesacfaces', '00000000-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 'Good running shoes', 'Very comfortable and lightweight. Perfect for daily runs.', true),
  ('beefbeef-beef-beef-beef-beefbeefbeef', '00000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5, 'Amazing phone!', 'Fast performance and great camera quality. Highly recommended!', false)
ON CONFLICT (user_id, product_id) DO NOTHING;