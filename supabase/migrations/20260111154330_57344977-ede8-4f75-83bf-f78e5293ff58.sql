-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule daily returns processing at 00:00 (midnight) every day
SELECT cron.schedule(
  'process-daily-returns',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ommxogzigfoavgnsvcox.supabase.co/functions/v1/process-daily-returns',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Enable pg_net extension for HTTP requests from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;