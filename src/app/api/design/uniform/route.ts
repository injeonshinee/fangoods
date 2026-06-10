import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'

const COIN_COST = 3

const FONT_FAMILIES: Record<string, string> = {
  arial: 'Arial, sans-serif',
  pretendard: 'Pretendard, sans-serif',
  blackhansans: '"Black Han Sans", sans-serif',
  jua: 'Jua, sans-serif',
}

interface BuildOptions {
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

function buildSvg(template: string, opts: BuildOptions): string {
  let svg = template
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
    `<text id="uniform-name" x="50.75" y="${nameY}" text-anchor="middle" font-family="${FONT_FAMILIES[nameFontFamily] ?? FONT_FAMILIES.arial}" font-size="${nameFontSize}" font-weight="bold" fill="${textColor}"${textStrokeAttrs(textStrokeColor, nameTextStrokeWidth)}>${spacedText(name, nameFontSize / 2)}`,
  )
  svg = svg.replace(
    /<text id="uniform-number"[^>]*>[^<]*/,
    `<text id="uniform-number" x="50.75" y="${numberY}" text-anchor="middle" font-family="${FONT_FAMILIES[numberFontFamily] ?? FONT_FAMILIES.arial}" font-size="${numberFontSize}" font-weight="bold" fill="${textColor}"${textStrokeAttrs(textStrokeColor, numberTextStrokeWidth)}>${number}`,
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

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })

  const {
    color, strokeColor, textColor, textStrokeColor = null,
    playerName, number, logoDataUrl,
    logoX = 50.75, logoY = 57.5, logoSize = 35,
    nameY = 32, numberY = 58, nameFontSize = 11, numberFontSize = 29,
    nameFontFamily = 'arial', numberFontFamily = 'arial',
    nameTextStrokeWidth = 0.7, numberTextStrokeWidth = 1.5,
  } = await req.json()

  if (!color || !playerName?.trim() || !number?.trim()) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 })
  }

  if (logoDataUrl && !logoDataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: '올바른 이미지 형식이 아니에요' }, { status: 400 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('coin_balance')
    .eq('id', user.id)
    .single()

  if (!userData || userData.coin_balance < COIN_COST) {
    return NextResponse.json({ error: '코인이 부족해요' }, { status: 402 })
  }

  const templatesDir = path.join(process.cwd(), 'public', 'templates')
  const frontTemplate = readFileSync(path.join(templatesDir, 'front.svg'), 'utf-8')
  const backTemplate = readFileSync(path.join(templatesDir, 'back.svg'), 'utf-8')

  const buildOpts: BuildOptions = {
    color,
    strokeColor: strokeColor ?? '#000000',
    textColor: textColor ?? '#ffffff',
    textStrokeColor,
    name: playerName.trim(),
    number: number.trim(),
    logoDataUrl,
    logoX, logoY, logoSize,
    nameY, numberY, nameFontSize, numberFontSize, nameFontFamily, numberFontFamily,
    nameTextStrokeWidth, numberTextStrokeWidth,
  }
  const frontSvg = buildSvg(frontTemplate, buildOpts)
  const backSvg = buildSvg(backTemplate, { ...buildOpts, logoDataUrl: null })

  const designId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const frontPath = `${user.id}/${designId}-front.svg`
  const backPath = `${user.id}/${designId}-back.svg`

  const [frontUpload, backUpload] = await Promise.all([
    serviceSupabase.storage.from('designs').upload(frontPath, frontSvg, { contentType: 'image/svg+xml' }),
    serviceSupabase.storage.from('designs').upload(backPath, backSvg, { contentType: 'image/svg+xml' }),
  ])

  if (frontUpload.error || backUpload.error) {
    return NextResponse.json({ error: '파일 저장에 실패했어요' }, { status: 500 })
  }

  const { error: insertError } = await supabase.from('designs').insert({
    id: designId,
    user_id: user.id,
    type: 'uniform',
    file_path: frontPath,
    preview_path: backPath,
    coin_cost: COIN_COST,
    expires_at: expiresAt,
  })

  if (insertError) {
    return NextResponse.json({ error: '도안 저장에 실패했어요' }, { status: 500 })
  }

  const { error: deductError } = await supabase.rpc('deduct_coins', {
    p_user_id: user.id,
    p_amount: COIN_COST,
    p_description: '유니폼 도안 생성',
  })

  if (deductError) {
    return NextResponse.json({ error: '코인 차감에 실패했어요' }, { status: 500 })
  }

  return NextResponse.json({ designId })
}
