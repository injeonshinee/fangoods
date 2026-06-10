'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-pink-600 mb-1">팬굿즈 도안</h1>
        <p className="text-gray-500 text-sm">로그인</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder="비밀번호 입력"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-pink-500 font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
