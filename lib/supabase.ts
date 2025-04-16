// lib/supabase.ts

"use server"

import { createBrowserClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// 👇 client-side (hooks, context, etc.)
export const createClientSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 👇 server-side (middleware, server actions, etc.)
export const createServerSupabaseClient = () => {
  return createServerComponentClient({ cookies })
}
