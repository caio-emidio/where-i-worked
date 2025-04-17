// client.ts
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export const createClientSupabaseClient = () => {
  return createPagesBrowserClient();
};
