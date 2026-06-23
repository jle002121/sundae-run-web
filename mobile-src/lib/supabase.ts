import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Entry = {
  id: string
  user_id: string
  flavor: string
  shop_name: string | null
  shop_place_id: string | null
  shop_lat: number | null
  shop_lng: number | null
  photo_url: string | null
  rating: number | null
  notes: string | null
  price: number | null
  is_public: boolean
  created_at: string
}
