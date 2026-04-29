import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants  from 'expo-constants'

// const apiUrl = Constants.manifest2?.extra?.expoClient?.extra?.supabaseUrl
// const apiKey = Constants.manifest2?.extra?.expoClient?.extra?.supabaseKey

// console.log(apiUrl)
// console.log(apiKey)

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// sx5Fokf1gjsEgx4L


        