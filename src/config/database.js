import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('documents').select('count').limit(1)
    if (error) throw error
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}