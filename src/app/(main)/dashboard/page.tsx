import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCoin, formatDate } from '@/lib/utils'
import type { Design } from '@/types'

const DESIGN_LABELS: Record<string, string> = {
  slogan: '슬로건',
  photocard: '포토카드',
  uniform: '유니폼 일러스트',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const [{ data: userData }, { data: designs }] = await Promise.all([
    supabase.from('users').select('coin_balance').eq('id', authUser!.id).single(),
    supabase
      .from('designs')
      .select('*')
      .eq('user_id', authUser!.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const coinBalance = userData?.coin_balance ?? 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">대시보드</h2>
        <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-pink-600">{formatCoin(coinBalance)}</span>
          <Link href="/coins" className="text-xs text-gray-400 hover:text-pink-500 ml-1">충전</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/design/slogan', label: '슬로건 도안', icon: '✏️', desc: '텍스트 + AI 배경', comingSoon: true },
          { href: '/design/photocard', label: '포토카드 도안', icon: '🃏', desc: '사진 업로드 + AI 배경', comingSoon: true },
          { href: '/design/uniform', label: '유니폼 일러스트', icon: '⚾', desc: '' },
        ].map((item) =>
          item.comingSoon ? (
            <div
              key={item.href}
              className="relative bg-white border rounded-2xl p-6 opacity-60 cursor-not-allowed"
            >
              <span className="absolute top-4 right-4 text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">
                준비 중
              </span>
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold mb-1">{item.label}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold mb-1">{item.label}</h3>
              {item.desc && <p className="text-sm text-gray-500">{item.desc}</p>}
            </Link>
          ),
        )}
      </div>

      <div className="bg-white border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">최근 생성 도안</h3>
        {designs && designs.length > 0 ? (
          <div className="space-y-3">
            {(designs as Design[]).map((design) => {
              const row = (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm font-medium">{DESIGN_LABELS[design.type]}</span>
                    <span className="text-xs text-gray-400 ml-2">{formatDate(design.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{formatCoin(design.coin_cost)}</span>
                    {design.downloaded_at && (
                      <span className="text-xs text-green-500">다운로드 완료</span>
                    )}
                  </div>
                </div>
              )
              return (
                <div key={design.id} className="border-b last:border-0">
                  {design.file_path && design.preview_path ? (
                    <Link
                      href={`/design/view/${design.id}`}
                      className="block hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">아직 생성한 도안이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
