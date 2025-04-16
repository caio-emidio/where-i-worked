"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export const createServerSupabaseClient = async () => {
  return createServerComponentClient({ cookies })
}
// Alterando a função para ser assíncrona
export const createClient = async () => {
  return createServerComponentClient({ cookies })
}