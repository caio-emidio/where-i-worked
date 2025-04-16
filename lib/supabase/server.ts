"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/ssr"

export const createServerSupabaseClient = async () => {
  return createServerComponentClient({ cookies })
}

export const createClient = () =>
  createServerComponentClient<Database>({ cookies })
