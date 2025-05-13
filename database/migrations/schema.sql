-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table work_entries
CREATE TABLE public.work_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger to update updated_at on row updatefeat
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.work_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Create a trigger to call the function periodically
CREATE OR REPLACE FUNCTION periodic_cleanup()
RETURNS VOID AS $$
BEGIN
  PERFORM delete_old_records();
END;
$$ LANGUAGE plpgsql;

-- Schedule the trigger to run daily
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('daily_cleanup', '0 0 * * *', $$CALL periodic_cleanup()$$);