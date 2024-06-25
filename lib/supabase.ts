import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lssblzdyxyblkqlrncsj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzc2JsemR5eHlibGtxbHJuY3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg4NjcwNTYsImV4cCI6MjAzNDQ0MzA1Nn0.SY-TIfsEhlnOs3AlkSVQcZ2k_Mf4_BNYQZ5L32OvKmU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// sx5Fokf1gjsEgx4L


        