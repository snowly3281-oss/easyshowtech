PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (
    kind IN ('quote', 'rfq', 'configuration', 'floorplan')
  ),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  status TEXT NOT NULL CHECK (
    status IN ('received', 'email_sent', 'email_failed', 'whatsapp_opened')
  ),
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  message TEXT,
  source_url TEXT,
  solution_id TEXT,
  solution_slug TEXT,
  solution_title TEXT,
  package_key TEXT,
  package_title TEXT,
  package_snapshot_json TEXT,
  cart_snapshot_json TEXT,
  access_token_hash TEXT,
  access_expires_at TEXT,
  attachment_key TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS inquiry_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id TEXT NOT NULL,
  product_id TEXT,
  product_slug TEXT,
  product_title TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 999),
  options_json TEXT,
  source_solution_slug TEXT,
  source_package_key TEXT,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at
  ON inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_status_created_at
  ON inquiries(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_email
  ON inquiries(email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inquiries_access_token
  ON inquiries(access_token_hash)
  WHERE access_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiry_id
  ON inquiry_items(inquiry_id);
