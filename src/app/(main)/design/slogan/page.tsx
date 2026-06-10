'use client'

import { useState } from 'react'
import { COIN_COSTS } from '@/types'
import { formatCoin } from '@/lib/utils'

const MOOD_OPTIONS = ['귀여운', '감성적', '화려한', '미니멀', '빈티지', '몽환적']
const COLOR_OPTIONS = ['핑크', '블루', '화이트', '블랙', '골드', '파스텔']
const FONT_OPTIONS = ['기본체', '손글씨', '굵은 고딕', '세리프', '필기체']

type SloganMode = 'single' | 'double'

export default function SloganPage() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<SloganMode>('single')
  const [font, setFont] = useState(FONT_OPTIONS[0])
  const [mood, setMood] = useState<string[]>([])
  const [color, setColor] = useState<string[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [removeBg, setRemoveBg] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [designId, setDesignId] = useState<string | null>(null)

  const coinCost = (mode === 'single' ? COIN_COSTS.slogan_single : COIN_COSTS.slogan_double)
    + (useCustom ? COIN_COSTS.custom_prompt : 0)

  function toggleTag(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag])
  }

  async function handleGenerate() {
    if (!text.trim()) return
    setGenerating(true)
    setPreviewUrl(null)

    try {
      const res = await fetch('/api/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'slogan',
          text,
          mode,
          font,
          mood,
          color,
          customPrompt: useCustom ? customPrompt : '',
          removeBg,
        }),
      })
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
      a.download = `slogan-${designId}.png`
      a.click()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">슬로건 도안 만들기</h2>

      <div className="bg-white border rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">슬로건 텍스트</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder="예: 이태민 영원히 사랑해"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">단면/양면</label>
          <div className="flex gap-3">
            {(['single', 'double'] as SloganMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-sm border ${mode === m ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600'}`}
              >
                {m === 'single' ? `단면 (${formatCoin(COIN_COSTS.slogan_single)})` : `양면 (${formatCoin(COIN_COSTS.slogan_double)})`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">폰트</label>
          <div className="flex flex-wrap gap-2">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                className={`px-3 py-1.5 rounded-full text-sm border ${font === f ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">배경 분위기</label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => toggleTag(mood, setMood, m)}
                className={`px-3 py-1.5 rounded-full text-sm border ${mood.includes(m) ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">색상</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => toggleTag(color, setColor, c)}
                className={`px-3 py-1.5 rounded-full text-sm border ${color.includes(c) ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={removeBg}
              onChange={(e) => setRemoveBg(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">배경 제거 적용</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="rounded"
            />
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
          disabled={generating || !text.trim()}
          className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 disabled:opacity-50"
        >
          {generating ? 'AI 생성 중...' : '도안 생성하기 (미리보기 무료)'}
        </button>
      </div>

      {previewUrl && (
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">미리보기 (워터마크 포함)</h3>
          <img src={previewUrl} alt="슬로건 미리보기" className="w-full rounded-lg border" />
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
