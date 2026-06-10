'use client'

import { useState } from 'react'
import { COIN_PACKAGES, BANK_INFO } from '@/types'
import { formatCoin, formatPrice } from '@/lib/utils'

export default function CoinsPage() {
  const [selectedPackage, setSelectedPackage] = useState(COIN_PACKAGES[0])
  const [depositorName, setDepositorName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!depositorName.trim()) return
    setLoading(true)

    const res = await fetch('/api/coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName: selectedPackage.name,
        coinAmount: selectedPackage.coins,
        price: selectedPackage.price,
        depositorName,
      }),
    })

    if (res.ok) {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-16">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold">입금 신청 완료!</h2>
        <p className="text-gray-500 text-sm">
          입금 확인 후 1~2시간 내 코인이 충전됩니다.<br />
          입금 계좌: <strong>{BANK_INFO.bank} {BANK_INFO.account}</strong><br />
          예금주: {BANK_INFO.holder}
        </p>
        <p className="text-sm text-gray-400">
          입금자명을 <strong>{depositorName}</strong>으로 입금해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold">코인 충전</h2>

      <div className="grid grid-cols-1 gap-3">
        {COIN_PACKAGES.map((pkg) => (
          <button
            key={pkg.name}
            onClick={() => setSelectedPackage(pkg)}
            className={`w-full text-left border rounded-2xl p-5 transition-all ${
              selectedPackage.name === pkg.name
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 hover:border-pink-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{pkg.name} 패키지</div>
                <div className="text-sm text-gray-500 mt-0.5">{formatCoin(pkg.coins)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{formatPrice(pkg.price)}</div>
                {pkg.discount > 0 && (
                  <div className="text-xs text-pink-500">{pkg.discount}% 할인</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gray-50 border rounded-2xl p-5 space-y-2 text-sm">
        <h3 className="font-semibold">무통장입금 안내</h3>
        <p>은행: {BANK_INFO.bank}</p>
        <p>계좌번호: {BANK_INFO.account}</p>
        <p>예금주: {BANK_INFO.holder}</p>
        <p className="text-gray-400 text-xs">
          입금 확인 후 1~2시간 내 코인 충전. 입금자명을 아래 양식에 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">입금자명</label>
          <input
            type="text"
            value={depositorName}
            onChange={(e) => setDepositorName(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder="입금하실 이름"
          />
        </div>

        <div className="bg-pink-50 rounded-xl p-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">선택 패키지</span>
            <span className="font-medium">{selectedPackage.name} ({formatCoin(selectedPackage.coins)})</span>
          </div>
          <div className="flex justify-between font-bold text-pink-600">
            <span>입금 금액</span>
            <span>{formatPrice(selectedPackage.price)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? '신청 중...' : '입금 신청하기'}
        </button>
      </form>
    </div>
  )
}
