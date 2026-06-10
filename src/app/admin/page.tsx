import { createClient } from '@/lib/supabase/server'
import { formatCoin, formatDate, formatPrice } from '@/lib/utils'
import type { Order } from '@/types'
import AdminActions from './AdminActions'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, users(email)')
    .order('created_at', { ascending: false })

  const pendingOrders = orders?.filter((o) => o.status === 'pending') ?? []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-8">관리자 — 입금 확인</h1>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">신청일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">유저</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">입금자명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">패키지</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">금액</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">코인</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">처리</th>
            </tr>
          </thead>
          <tbody>
            {(orders as (Order & { users: { email: string } })[])?.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                <td className="px-4 py-3">{order.users?.email}</td>
                <td className="px-4 py-3 font-medium">{order.depositor_name}</td>
                <td className="px-4 py-3">{order.package_name}</td>
                <td className="px-4 py-3">{formatPrice(order.price)}</td>
                <td className="px-4 py-3">{formatCoin(order.coin_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status === 'pending' ? '대기' : order.status === 'confirmed' ? '확인' : '거절'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {order.status === 'pending' && (
                    <AdminActions orderId={order.id} userId={order.user_id} coinAmount={order.coin_amount} />
                  )}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">입금 신청 내역이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingOrders.length > 0 && (
        <p className="mt-4 text-sm text-gray-500">대기 중인 신청 {pendingOrders.length}건</p>
      )}
    </div>
  )
}
