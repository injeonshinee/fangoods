import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCoin(coins: number) {
  return `${coins}코인`
}

export function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
