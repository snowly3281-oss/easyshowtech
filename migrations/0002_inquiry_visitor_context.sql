ALTER TABLE inquiries ADD COLUMN visitor_ip TEXT;
ALTER TABLE inquiries ADD COLUMN visitor_country TEXT;
ALTER TABLE inquiries ADD COLUMN visitor_city TEXT;

CREATE INDEX IF NOT EXISTS idx_inquiries_country_created_at
  ON inquiries(visitor_country, created_at DESC);
