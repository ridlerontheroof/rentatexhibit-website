CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  type text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text,
  preferred_date text,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);
CREATE TABLE IF NOT EXISTS email_throttle_counters (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);