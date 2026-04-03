#!/usr/bin/env node
/**
 * Apply supabase/ALL_IN_ONE.sql using a direct Postgres connection.
 *
 * Supabase Dashboard → Project Settings → Database → Connection string → URI
 * (password is your database password, NOT the anon/service API keys.)
 *
 *   export SUPABASE_DB_URL="postgresql://postgres.[ref]:YOUR_PASSWORD@aws-0-....pooler.supabase.com:6543/postgres"
 *   node scripts/apply-supabase-sql.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

if (!dbUrl) {
  console.error(
    'Missing SUPABASE_DB_URL or DATABASE_URL.\n' +
      'Get the URI from Supabase → Settings → Database (use pooler :6543 or direct :5432).\n' +
      'Or paste supabase/ALL_IN_ONE.sql into the SQL Editor instead.'
  )
  process.exit(1)
}

const { default: postgres } = await import('postgres')
const sql = postgres(dbUrl, { ssl: 'require', max: 1 })
try {
  const file = path.join(root, 'supabase', 'ALL_IN_ONE.sql')
  const body = fs.readFileSync(file, 'utf8')
  await sql.unsafe(body)
  console.log('Applied', file)
} finally {
  await sql.end({ timeout: 5 })
}
