'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AdminActionsProps {
  orderId: string
  userId: string
  coinAmount: number
}

export default function AdminActions({ orderId, userId, coinAmount }: AdminActionsProps) {
  const router = useRouter()

  async function handleConfirm() {
    const supabase = createClient()

    await supabase.rpc('charge_coins', {
      p_user_id: userId,
      p_amount: coinAmount,
      p_description: `입금 확인 — 주문 ${orderId.slice(0, 8)}`,
    })

    await supabase
      .from('orders')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', orderId)

    router.refresh()
  }

  async function handleReject() {
    const supabase = createClient()

    await supabase
      .from('orders')
      .update({ status: 'rejected' })
      .eq('id', orderId)

    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleConfirm}
        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
      >
        확인
      </button>
      <button
        onClick={handleReject}
        className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200"
      >
        거절
      </button>
    </div>
  )
}
