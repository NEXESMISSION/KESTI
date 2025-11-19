import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
})

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'super_admin' | 'business_user'
  subscription_ends_at: string | null
  is_suspended: boolean
  pin_code: string | null
  history_auto_clear_days: number | null
  history_auto_clear_minutes: number | null
  last_history_clear: string | null
}

export type ProductCategory = {
  id: string
  owner_id: string
  name: string
  created_at: string
}

export type Product = {
  id: string
  owner_id: string
  name: string
  selling_price: number
  cost_price: number
  unit_type: 'item' | 'kg' | 'g' | 'l' | 'ml'
  image_url: string | null
  category_id: string | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  created_at: string
  category?: ProductCategory
}

export type Sale = {
  id: string
  owner_id: string
  total_amount: number
  created_at: string
}

export type SaleItem = {
  id: number
  sale_id: string
  product_id: string
  quantity: number
  price_at_sale: number
}
