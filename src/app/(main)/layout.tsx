import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import type { User } from '@/types'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  const user: User = userData ?? {
    id: authUser.id,
    email: authUser.email ?? '',
    coin_balance: 0,
    created_at: authUser.created_at,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
