'use client'

import { useState, useRef } from 'react'
import { COIN_COSTS } from '@/types'
import { formatCoin } from '@/lib/utils'

const MOOD_OPTIONS = ['귀여운', '감성적', '화려한', '미니멀', '빈티지', '몽환적']
const BORDER_OPTIONS = ['없음', '얇은 선', '그라데이션', '꽃무늬', '별무늬', '하트']

export default function PhotocardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removeBg, setRemoveBg] = useState(false)
  const [mood, setMood] = useState<string[]>([])
  const [border, setBorder] = useState(BORDER_OPTIONS[0])
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [designId, setDesignId] = useState<string | null>(null)

  const coinCost = COIN_COSTS.photocard + (useCustom ? COIN_COSTS.custom_prompt : 0)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function toggleMood(tag: string) {
    setMood((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  async function handleGenerate() {
    if (!photo) return
    setGenerating(true)
    setPreviewUrl(null)

    try {
      const formData = new FormData()
      formData.append('type', 'photocard')
      formData.append('photo', photo)
      formData.append('removeBg', String(removeBg))
      formData.append('mood', JSON.stringify(mood))
      formData.append('border', border)
      formData.append('customPrompt', useCustom ? customPrompt : '')

      const res = await fetch('/api/design/generate', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl)
        setDesignId(data.designId)
      }
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownload() {
    if (!designId) return
    const res = await fetch('/api/design/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `photocard-${designId}.png`
      a.click()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">포토카드 도안 만들기</h2>
      <p className="text-sm text-gray-500">55×85mm 표준 포토카드 크기로 출력됩니다.</p>

      <div className="bg-white border rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">사진 업로드</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-pink-300"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="업로드된 사진" className="max-h-48 mx-auto rounded-lg" />
            ) : (
              <div className="text-gray-400 space-y-1">
                <p className="text-3xl">📸</p>
                <p className="text-sm">사진을 클릭하여 업로드</p>
                <p className="text-xs">JPG, PNG 지원</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="rounded" />
          <span className="text-sm">배경 제거 적용 <span className="text-gray-400 text-xs">(인물만 남기기)</span></span>
        </label>

        <div>
          <label className="block text-sm font-medium mb-2">배경 분위기</label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => toggleMood(m)}
                className={`px-3 py-1.5 rounded-full text-sm border ${mood.includes(m) ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">테두리 스타일</label>
          <div className="flex flex-wrap gap-2">
            {BORDER_OPTIONS.map((b) => (
              <button
                key={b}
                onClick={() => setBorder(b)}
                className={`px-3 py-1.5 rounded-full text-sm border ${border === b ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600'}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} className="rounded" />
            <span className="text-sm">직접 프롬프트 입력 <span className="text-pink-500">(+1코인)</span></span>
          </label>
          {useCustom && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="원하는 배경·분위기를 자유롭게 입력하세요"
            />
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !photo}
          className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 disabled:opacity-50"
        >
          {generating ? 'AI 생성 중...' : '도안 생성하기 (미리보기 무료)'}
        </button>
      </div>

      {previewUrl && (
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">미리보기 (워터마크 포함)</h3>
          <img src={previewUrl} alt="포토카드 미리보기" className="max-w-xs mx-auto rounded-lg border" />
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">다운로드 시 {formatCoin(coinCost)} 차감</p>
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-semibold hover:bg-pink-600"
            >
              {formatCoin(coinCost)} 차감 후 다운로드
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
