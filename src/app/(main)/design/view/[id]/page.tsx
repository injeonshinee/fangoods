'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { downloadPng } from '@/lib/svgExport'

const TYPE_LABELS: Record<string, string> = {
  slogan: '슬로건',
  photocard: '포토카드',
  uniform: '유니폼 일러스트',
}

export default function DesignViewPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [data, setData] = useState<{ type: string; front: string; back: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/design/${id}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || '도안을 불러오지 못했어요')
        setData(json)
      })
      .catch((e) => setError(e.message))
  }, [id])

  async function handleDownload(svg: string, filename: string) {
    await downloadPng(svg, filename)
    const supabase = createClient()
    await supabase
      .from('designs')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('id', id)
      .is('downloaded_at', null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{data ? TYPE_LABELS[data.type] : '도안'} 미리보기</h2>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-pink-600">
          대시보드로
        </Link>
      </div>

      {error && (
        <div className="bg-white border rounded-2xl p-8 text-center text-sm text-red-500">{error}</div>
      )}

      {!data && !error && (
        <div className="bg-white border rounded-2xl p-8 text-center text-sm text-gray-400">불러오는 중...</div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-medium text-center text-gray-600">앞면</p>
            <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4 min-h-[240px]">
              <div className="w-full max-w-[260px]" dangerouslySetInnerHTML={{ __html: data.front }} />
            </div>
            <button
              onClick={() => handleDownload(data.front, `${data.type}-front.png`)}
              className="w-full py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600"
            >
              앞면 다운로드 (PNG)
            </button>
          </div>

          <div className="bg-white border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-medium text-center text-gray-600">뒷면</p>
            <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4 min-h-[240px]">
              <div className="w-full max-w-[260px]" dangerouslySetInnerHTML={{ __html: data.back }} />
            </div>
            <button
              onClick={() => handleDownload(data.back, `${data.type}-back.png`)}
              className="w-full py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600"
            >
              뒷면 다운로드 (PNG)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
