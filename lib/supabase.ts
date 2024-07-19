import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqqxwdrqactiotkbmjhp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcXh3ZHJxYWN0aW90a2JtamhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTcwMTU1NDQsImV4cCI6MjAzMjU5MTU0NH0.gGy2iQx8rddhSVNwpY4eAr2liFPbiMYLwd7mLnNclag'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// sx5Fokf1gjsEgx4L


        