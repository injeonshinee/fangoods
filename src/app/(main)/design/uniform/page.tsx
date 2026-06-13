'use client'

import { useState, useEffect, useRef } from 'react'
import { COIN_COSTS } from '@/types'
import { formatCoin } from '@/lib/utils'
import { downloadPng } from '@/lib/svgExport'

const LOGO_CENTER_X = 50.75

// CSS font-family value used inside the SVG (and the live preview, via
// @font-face declarations imported in globals.css).
const FONT_FAMILIES: Record<string, string> = {
  arial: 'Arial, sans-serif',
  pretendard: 'Pretendard, sans-serif',
  blackhansans: '"Black Han Sans", sans-serif',
  jua: 'Jua, sans-serif',
}

const FONT_OPTIONS: { id: string; label: string }[] = [
  { id: 'arial', label: 'Arial (기본)' },
  { id: 'pretendard', label: 'Pretendard' },
  { id: 'blackhansans', label: 'Black Han Sans' },
  { id: 'jua', label: 'Jua' },
]

interface PatchOptions {
  color: string
  strokeColor: string
  textColor: string
  textStrokeColor: string | null
  name: string
  number: string
  logoDataUrl: string | null
  logoX: number
  logoY: number
  logoSize: number
  nameY: number
  numberY: number
  nameFontSize: number
  numberFontSize: number
  nameFontFamily: string
  numberFontFamily: string
  nameTextStrokeWidth: number
  numberTextStrokeWidth: number
}

function textStrokeAttrs(textStrokeColor: string | null, strokeWidth: number): string {
  if (!textStrokeColor) return ''
  return ` stroke="${textStrokeColor}" stroke-width="${strokeWidth.toFixed(2)}" stroke-linejoin="round" paint-order="stroke fill"`
}

// Renders each character in its own <tspan> with a leading dx gap (skipped for
// the first character) so text-anchor="middle" centers on the visible glyphs
// only, without a trailing gap after the last character.
function spacedText(text: string, spacing: number): string {
  return Array.from(text)
    .map((ch, i) => (i === 0 ? `<tspan>${ch}</tspan>` : `<tspan dx="${spacing}">${ch}</tspan>`))
    .join('')
}

function patchSvg(svgText: string, opts: PatchOptions): string {
  let svg = svgText
  const {
    color, strokeColor, textColor, textStrokeColor, name, number, logoDataUrl, logoX, logoY, logoSize,
    nameY, numberY, nameFontSize, numberFontSize, nameFontFamily, numberFontFamily,
    nameTextStrokeWidth, numberTextStrokeWidth,
  } = opts

  // Colors are written as inline style="" attributes directly on each element
  // rather than via an injected <style id> override block: Illustrator's SVG
  // importer doesn't reliably apply ID-selector overrides from <style> blocks
  // and falls back to the template's original colors, while inline styles win
  // in every renderer (and still let the template's class supply stroke-width
  // /linejoin, since we only set fill/stroke here).
  svg = svg.replace(
    /(<path id="uniform-body" class="[^"]*")/,
    `$1 style="fill:${color};stroke:${strokeColor};"`,
  )
  svg = svg.replace(
    /<circle class="st3"([^>]*)\/>/g,
    (_match, rest) => `<circle class="st3"${rest} style="fill:${color};stroke:${strokeColor};"/>`,
  )
  svg = svg.replace(
    /(<path id="uniform-neck" class="[^"]*")/,
    `$1 style="stroke:${strokeColor};"`,
  )
  svg = svg.replace(
    /(<path id="uniform-outline" class="[^"]*")/,
    `$1 style="fill:none;stroke:${strokeColor};"`,
  )

  svg = svg.replace(
    /<text id="uniform-name"[^>]*>[^<]*/,
    `<text id="uniform-name" x="50.75" y="${nameY}" text-anchor="middle" font-family="${FONT_FAMILIES[nameFontFamily] ?? FONT_FAMILIES.arial}" font-size="${nameFontSize}" font-weight="bold" fill="${textColor}"${textStrokeAttrs(textStrokeColor, nameTextStrokeWidth)}>${spacedText(name || 'NAME', nameFontSize / 2)}`,
  )
  svg = svg.replace(
    /<text id="uniform-number"[^>]*>[^<]*/,
    `<text id="uniform-number" x="50.75" y="${numberY}" text-anchor="middle" font-family="${FONT_FAMILIES[numberFontFamily] ?? FONT_FAMILIES.arial}" font-size="${numberFontSize}" font-weight="bold" fill="${textColor}"${textStrokeAttrs(textStrokeColor, numberTextStrokeWidth)}>${number || '00'}`,
  )

  // logoX/logoY mark the logo's *center*, so resizing grows/shrinks around that
  // fixed point instead of drifting from a corner.
  svg = svg.replace(
    /<g id="logo-area"[^>]*>/,
    `<g id="logo-area" transform="translate(${logoX.toFixed(2)}, ${logoY.toFixed(2)})">`,
  )

  const logoHref = logoDataUrl ? ` href="${logoDataUrl}"` : ''
  const half = (logoSize / 2).toFixed(2)
  svg = svg.replace(
    /<image id="logo-image"[^/]*\/>/,
    `<image id="logo-image"${logoHref} x="-${half}" y="-${half}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`,
  )

  return svg
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 rounded cursor-pointer border flex-shrink-0"
      />
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{value}</p>
      </div>
    </div>
  )
}

function NullableColorPicker({ label, value, onChange, transparentLabel }: {
  label: string; value: string | null; onChange: (v: string | null) => void; transparentLabel?: string
}) {
  const isTransparent = value === null
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value ?? '#000000'}
        disabled={isTransparent}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 rounded cursor-pointer border flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
      />
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={isTransparent}
            onChange={(e) => onChange(e.target.checked ? null : '#000000')}
            className="accent-pink-500"
          />
          {transparentLabel ?? '투명'}
        </label>
      </div>
    </div>
  )
}

function FontSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        style={{ fontFamily: FONT_FAMILIES[value] }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.id} value={f.id} style={{ fontFamily: FONT_FAMILIES[f.id] }}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
        active ? 'text-pink-500 border-pink-500' : 'text-gray-400 border-transparent hover:text-gray-600'
      }`}
    >
      {label}
    </button>
  )
}

function Slider({ label, value, min, max, step, onChange, onReset, resetLabel }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
  onReset?: () => void; resetLabel?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          {onReset && (
            <button type="button" onClick={onReset} className="text-pink-500 hover:underline">
              {resetLabel ?? '중앙 정렬'}
            </button>
          )}
          <span className="text-gray-400 font-mono w-8 text-right">{Math.round(value * 10) / 10}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-pink-500 cursor-pointer"
      />
    </div>
  )
}

export default function UniformPage() {
  const [color, setColor] = useState('#005A9C')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [textColor, setTextColor] = useState('#ffffff')
  const [playerName, setPlayerName] = useState('')
  const [number, setNumber] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [frontSvg, setFrontSvg] = useState('')
  const [backSvg, setBackSvg] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedSvgs, setSavedSvgs] = useState<{ front: string; back: string } | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [textStrokeColor, setTextStrokeColor] = useState<string | null>(null)
  const [logoX, setLogoX] = useState(LOGO_CENTER_X)
  const [logoY, setLogoY] = useState(57.5)
  const [logoSize, setLogoSize] = useState(35)
  const [nameY, setNameY] = useState(32)
  const [numberY, setNumberY] = useState(58)
  const [nameFontSize, setNameFontSize] = useState(11)
  const [numberFontSize, setNumberFontSize] = useState(29)
  const [nameFontFamily, setNameFontFamily] = useState('arial')
  const [numberFontFamily, setNumberFontFamily] = useState('arial')
  const [nameTextStrokeWidth, setNameTextStrokeWidth] = useState(0.7)
  const [numberTextStrokeWidth, setNumberTextStrokeWidth] = useState(1.5)
  const [activeTab, setActiveTab] = useState<'setting' | 'front' | 'back'>('setting')

  useEffect(() => {
    fetch('/templates/front.svg').then((r) => r.text()).then(setFrontSvg)
    fetch('/templates/back.svg').then((r) => r.text()).then(setBackSvg)
  }, [])

  useEffect(() => {
    if (!logoFile) { setLogoDataUrl(null); return }
    const reader = new FileReader()
    reader.onload = (e) => setLogoDataUrl(e.target?.result as string)
    reader.readAsDataURL(logoFile)
  }, [logoFile])

  const patchOpts: PatchOptions = {
    color, strokeColor, textColor, textStrokeColor,
    name: playerName, number,
    logoDataUrl,
    logoX, logoY, logoSize,
    nameY, numberY, nameFontSize, numberFontSize, nameFontFamily, numberFontFamily,
    nameTextStrokeWidth, numberTextStrokeWidth,
  }
  const patchedFront = frontSvg ? patchSvg(frontSvg, patchOpts) : ''
  const patchedBack = backSvg ? patchSvg(backSvg, { ...patchOpts, logoDataUrl: null }) : ''

  async function handleSave() {
    if (!playerName.trim() || !number.trim()) return
    setSaving(true)
    setSavedSvgs(null)
    try {
      const res = await fetch('/api/design/uniform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color, strokeColor, textColor, textStrokeColor,
          playerName, number, logoDataUrl,
          logoX, logoY, logoSize,
          nameY, numberY, nameFontSize, numberFontSize, nameFontFamily, numberFontFamily,
          nameTextStrokeWidth, numberTextStrokeWidth,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '저장에 실패했어요')
        return
      }
      setSavedSvgs({ front: patchedFront, back: patchedBack })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">유니폼 일러스트 도안 만들기</h2>
        <p className="text-sm text-gray-500 mt-1">아크릴 키링·스티커용 일러스트 도안 (실물 유니폼 제작용 아님)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4 space-y-2">
              <p className="text-sm font-medium text-center text-gray-600">앞면</p>
              <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4 min-h-[240px]">
                {patchedFront ? (
                  <div className="w-full max-w-[200px] drop-shadow-sm" dangerouslySetInnerHTML={{ __html: patchedFront }} />
                ) : (
                  <p className="text-sm text-gray-400">로딩 중...</p>
                )}
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4 space-y-2">
              <p className="text-sm font-medium text-center text-gray-600">뒷면</p>
              <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4 min-h-[240px]">
                {patchedBack ? (
                  <div className="w-full max-w-[200px] drop-shadow-sm" dangerouslySetInnerHTML={{ __html: patchedBack }} />
                ) : (
                  <p className="text-sm text-gray-400">로딩 중...</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">색상·이름·번호는 실시간 반영돼요</p>
        </div>

        <div className="bg-white border rounded-2xl lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-13rem)] flex flex-col">
        <div className="flex border-b flex-shrink-0">
          <TabButton label="세팅" active={activeTab === 'setting'} onClick={() => setActiveTab('setting')} />
          <TabButton label="앞면" active={activeTab === 'front'} onClick={() => setActiveTab('front')} />
          <TabButton label="뒷면" active={activeTab === 'back'} onClick={() => setActiveTab('back')} />
        </div>
        <div className="px-4 py-4 overflow-y-auto flex-1 min-h-0 space-y-3">
          {activeTab === 'setting' && (
            <div className="flex flex-wrap gap-4">
              <ColorPicker label="유니폼 색상" value={color} onChange={setColor} />
              <ColorPicker label="유니폼 선 색상" value={strokeColor} onChange={setStrokeColor} />
              <ColorPicker label="글자 색상" value={textColor} onChange={setTextColor} />
              <NullableColorPicker label="글자 외곽선" value={textStrokeColor} onChange={setTextStrokeColor} />
            </div>
          )}

          {activeTab === 'front' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  앞면 로고 <span className="text-gray-400 font-normal text-xs">(선택)</span>
                </label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-pink-300 transition-colors"
                >
                  {logoDataUrl ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={logoDataUrl} alt="로고" className="h-10 w-10 object-contain" />
                      <span className="text-sm text-gray-600">{logoFile?.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      클릭하여 로고 이미지 업로드<br />
                      <span className="text-xs">PNG, JPG, SVG 권장</span>
                    </p>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
                {logoDataUrl && (
                  <button
                    onClick={() => { setLogoFile(null); setLogoDataUrl(null) }}
                    className="mt-1 text-xs text-red-400 hover:text-red-600"
                  >
                    로고 제거
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-gray-500">위치 · 크기</h3>
                {!logoDataUrl && <span className="text-xs text-gray-400">(로고 업로드 후 적용돼요)</span>}
              </div>
              <Slider
                label="가로 위치" value={logoX} min={20} max={80} step={0.5} onChange={setLogoX}
                onReset={() => setLogoX(LOGO_CENTER_X)} resetLabel="중앙 정렬"
              />
              <Slider label="세로 위치" value={logoY} min={20} max={85} step={0.5} onChange={setLogoY} />
              <Slider label="크기" value={logoSize} min={0} max={100} step={1} onChange={setLogoSize} />
              <p className="text-xs text-gray-400">크기를 조절하면 중심을 기준으로 커지고 작아져요</p>
            </>
          )}

          {activeTab === 'back' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">등번호</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    placeholder="예: 17"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">선수 이름</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    placeholder="예: 이태민"
                  />
                </div>
              </div>

              <p className="text-xs font-medium text-gray-500 pt-1">이름</p>
              <FontSelect label="글씨체" value={nameFontFamily} onChange={setNameFontFamily} />
              <Slider label="세로 위치" value={nameY} min={15} max={55} step={0.5} onChange={setNameY} />
              <Slider label="글자 크기" value={nameFontSize} min={6} max={22} step={0.5} onChange={setNameFontSize} />
              {textStrokeColor && (
                <Slider label="외곽선 굵기" value={nameTextStrokeWidth} min={0.1} max={3} step={0.1} onChange={setNameTextStrokeWidth} />
              )}

              <p className="text-xs font-medium text-gray-500 pt-1">번호</p>
              <FontSelect label="글씨체" value={numberFontFamily} onChange={setNumberFontFamily} />
              <Slider label="세로 위치" value={numberY} min={30} max={82} step={0.5} onChange={setNumberY} />
              <Slider label="글자 크기" value={numberFontSize} min={12} max={45} step={1} onChange={setNumberFontSize} />
              {textStrokeColor && (
                <Slider label="외곽선 굵기" value={numberTextStrokeWidth} min={0.1} max={3} step={0.1} onChange={setNumberTextStrokeWidth} />
              )}
            </>
          )}
        </div>

          <div className="px-4 py-4 space-y-3 border-t flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving || !playerName.trim() || !number.trim()}
              className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 disabled:opacity-50"
            >
              {saving ? '저장 중...' : `도안 확정하기 (${formatCoin(COIN_COSTS.uniform)} 차감)`}
            </button>

            {savedSvgs && (
              <div className="border border-green-200 bg-green-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-green-700">도안이 저장되었어요!</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPng(savedSvgs.front, 'uniform-front.png')}
                    className="flex-1 py-2 bg-white border border-green-300 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50"
                  >
                    앞면 다운로드 (PNG)
                  </button>
                  <button
                    onClick={() => downloadPng(savedSvgs.back, 'uniform-back.png')}
                    className="flex-1 py-2 bg-white border border-green-300 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50"
                  >
                    뒷면 다운로드 (PNG)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
