'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'
import { formatCoin } from '@/lib/utils'

interface NavbarProps {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="text-lg font-bold text-pink-600">
        팬굿즈 도안
      </Link>

      <nav className="flex items-center gap-6 text-sm">
        <button onClick={() => alert('준비 중입니다')} className="text-gray-600 hover:text-pink-600">슬로건</button>
        <button onClick={() => alert('준비 중입니다')} className="text-gray-600 hover:text-pink-600">포토카드</button>
        <Link href="/design/uniform" className="text-gray-600 hover:text-pink-600">유니폼</Link>
      </nav>

      <div className="flex items-center gap-4">
        <Link
          href="/coins"
          className="flex items-center gap-1.5 bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-pink-100"
        >
          <span>🪙</span>
          <span>{formatCoin(user.coin_balance)}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
