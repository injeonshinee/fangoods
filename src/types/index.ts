export type DesignType = 'slogan' | 'photocard' | 'uniform'

export interface User {
  id: string
  email: string
  coin_balance: number
  created_at: string
}

export interface CoinLog {
  id: string
  user_id: string
  amount: number
  type: 'charge' | 'deduct'
  description: string
  created_at: string
}

export interface Design {
  id: string
  user_id: string
  type: DesignType
  file_path: string | null
  preview_path: string | null
  coin_cost: number
  expires_at: string
  downloaded_at: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  package_name: string
  coin_amount: number
  price: number
  status: 'pending' | 'confirmed' | 'rejected'
  depositor_name: string
  created_at: string
  confirmed_at: string | null
}

export interface CoinPackage {
  name: string
  coins: number
  price: number
  discount: number
}

export const COIN_PACKAGES: CoinPackage[] = [
  { name: '스타터', coins: 5, price: 5000, discount: 0 },
  { name: '기본', coins: 15, price: 13000, discount: 13 },
  { name: '팬', coins: 30, price: 24000, discount: 20 },
]

export const COIN_COSTS = {
  slogan_single: 2,
  slogan_double: 3,
  photocard: 2,
  uniform: 3,
  custom_prompt: 1,
} as const

export const BANK_INFO = {
  bank: '카카오뱅크',
  account: '3333-00-0000000',
  holder: '홍길동',
}
