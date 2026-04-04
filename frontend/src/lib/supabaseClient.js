import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anon)

/** Singleton browser client; null if env not set (demo mode). */
export const supabase = isSupabaseConfigured ? createClient(url, anon) : null
