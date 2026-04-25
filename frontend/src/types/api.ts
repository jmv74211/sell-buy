export interface User {
  id: number
  user_name: string
  name: string
  email: string
  active: boolean
  first_login_date: string | null
  last_login_date: string | null
  created_at: string
}

export interface PlatformRange {
  id: number
  platform_name: string
  code_range: number
  created_at: string
}

export interface Article {
  article_code: number
  article_name: string
  platform_id: number
  created_at: string
}

export interface Purchase {
  id: number
  user_id: number
  article_name: string
  article_code?: number | null
  purchase_date: string
  amount: number
  created_at: string
}

export interface Sale {
  id: number
  purchase_id: number
  sale_date: string
  amount: number
  created_at: string
}

export interface Estimation {
  id: number
  purchase_id: number
  sale_id: number | null
  estimated_profit: number
  estimated_sale_price?: number | null
  actual_profit: number | null
  created_at: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

export interface SummaryStats {
  total_purchases: number
  total_sales: number
  total_profit: number
  profit_margin: number
  purchase_count: number
  sale_count: number
}
