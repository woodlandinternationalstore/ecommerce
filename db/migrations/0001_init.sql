-- Woodland International Store: initial schema (PostgreSQL / Neon)

-- UTC timestamps stored as text 'YYYY-MM-DD HH24:MI:SS' so they sort and display simply.
CREATE OR REPLACE FUNCTION utcnow() RETURNS text LANGUAGE sql AS
$$ SELECT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS') $$;

CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL, password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin','sales','inventory')), active integer NOT NULL DEFAULT 1,
  created_at text NOT NULL DEFAULT utcnow());

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at text NOT NULL);

CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE, description text NOT NULL DEFAULT '',
  image_url text, published integer NOT NULL DEFAULT 1, display_order integer NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS vehicle_makes (id serial PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS vehicle_models (
  id serial PRIMARY KEY, make_id integer NOT NULL REFERENCES vehicle_makes(id) ON DELETE CASCADE, name text NOT NULL,
  UNIQUE (make_id, name));
CREATE TABLE IF NOT EXISTS vehicle_generations (
  id serial PRIMARY KEY, model_id integer NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE, name text NOT NULL,
  chassis_code text, year_from integer, year_to integer, engines text NOT NULL DEFAULT '');

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE,
  category_id integer REFERENCES categories(id) ON DELETE SET NULL,
  brand text NOT NULL DEFAULT '', oem_number text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '',
  main_image text, condition text NOT NULL DEFAULT 'new', authenticity text NOT NULL DEFAULT 'unverified',
  unit text NOT NULL DEFAULT 'piece',
  price_tzs integer CHECK (price_tzs IS NULL OR price_tzs > 0), previous_price_tzs integer,
  price_mode text NOT NULL DEFAULT 'request' CHECK (price_mode IN ('exact','request','message')),
  price_message text NOT NULL DEFAULT '',
  stock_qty integer CHECK (stock_qty IS NULL OR stock_qty >= 0),
  stock_status text NOT NULL DEFAULT 'tbc' CHECK (stock_status IN ('in_stock','low_stock','out_of_stock','tbc')),
  low_stock_threshold integer NOT NULL DEFAULT 3, track_stock integer NOT NULL DEFAULT 1,
  allow_enquiry_oos integer NOT NULL DEFAULT 1,
  featured integer NOT NULL DEFAULT 0, published integer NOT NULL DEFAULT 0, archived integer NOT NULL DEFAULT 0,
  is_demo integer NOT NULL DEFAULT 0, search_text text NOT NULL DEFAULT '', norm_text text NOT NULL DEFAULT '',
  created_at text NOT NULL DEFAULT utcnow(), updated_at text NOT NULL DEFAULT utcnow());
CREATE INDEX IF NOT EXISTS idx_products_oem ON products(oem_number);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS product_images (
  id serial PRIMARY KEY, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL, alt text NOT NULL DEFAULT '', sort integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS product_alt_numbers (
  id serial PRIMARY KEY, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE, part_number text NOT NULL);
CREATE INDEX IF NOT EXISTS idx_alt_pn ON product_alt_numbers(part_number);
CREATE TABLE IF NOT EXISTS product_compat (
  id serial PRIMARY KEY, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  make text NOT NULL, model text NOT NULL, generation text NOT NULL DEFAULT '', chassis_code text NOT NULL DEFAULT '',
  year_from integer, year_to integer, engine text NOT NULL DEFAULT '');
CREATE INDEX IF NOT EXISTS idx_compat ON product_compat(make, model);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY, ref text NOT NULL UNIQUE, access_token text NOT NULL, idempotency_key text NOT NULL UNIQUE,
  customer_name text NOT NULL, whatsapp text NOT NULL, alt_phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
  delivery_method text NOT NULL, delivery_location text NOT NULL DEFAULT '', region text NOT NULL DEFAULT '',
  contact_method text NOT NULL DEFAULT 'whatsapp', vehicle_info text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
  known_subtotal integer NOT NULL DEFAULT 0, unknown_count integer NOT NULL DEFAULT 0,
  delivery_fee integer, final_total integer,
  status text NOT NULL DEFAULT 'pending_confirmation', handoff_status text NOT NULL DEFAULT 'not_opened',
  created_at text NOT NULL DEFAULT utcnow(), updated_at text NOT NULL DEFAULT utcnow());
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL, part_number text NOT NULL DEFAULT '', vehicle text NOT NULL DEFAULT '',
  qty integer NOT NULL CHECK (qty > 0), unit_price integer, line_total integer, confirmed_unit_price integer);
CREATE TABLE IF NOT EXISTS order_status_history (
  id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL, note text NOT NULL DEFAULT '', user_id integer REFERENCES users(id),
  created_at text NOT NULL DEFAULT utcnow());
CREATE TABLE IF NOT EXISTS order_notes (
  id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id integer REFERENCES users(id), note text NOT NULL, created_at text NOT NULL DEFAULT utcnow());
CREATE TABLE IF NOT EXISTS stock_movements (
  id serial PRIMARY KEY, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  prev_qty integer, new_qty integer NOT NULL, diff integer, reason text NOT NULL,
  user_id integer REFERENCES users(id), created_at text NOT NULL DEFAULT utcnow());
CREATE TABLE IF NOT EXISTS enquiries (
  id serial PRIMARY KEY, ref text NOT NULL UNIQUE, access_token text NOT NULL, name text NOT NULL, phone text NOT NULL,
  part text NOT NULL DEFAULT '', vehicle text NOT NULL DEFAULT '', message text NOT NULL,
  status text NOT NULL DEFAULT 'new', created_at text NOT NULL DEFAULT utcnow());

-- Uploaded images live in the database so they survive serverless hosting.
CREATE TABLE IF NOT EXISTS uploads (
  name text PRIMARY KEY, mime text NOT NULL, data bytea NOT NULL, created_at text NOT NULL DEFAULT utcnow());
