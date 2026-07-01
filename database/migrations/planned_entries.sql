CREATE TABLE public.planned_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TRIGGER set_planned_entries_updated_at
BEFORE UPDATE ON public.planned_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
