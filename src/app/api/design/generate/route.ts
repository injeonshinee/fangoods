import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    body = Object.fromEntries(formData.entries())
    if (body.mood) body.mood = JSON.parse(body.mood as string)
  } else {
    body = await request.json()
  }

  const { type } = body

  const prompt = buildPrompt(body)

  const imageUrl = await generateImageWithGemini(prompt)

  const previewUrl = await addWatermark(imageUrl)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: design, error } = await supabase
    .from('designs')
    .insert({
      user_id: user.id,
      type,
      preview_path: previewUrl,
      file_path: imageUrl,
      coin_cost: getCoinCost(body),
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ previewUrl, designId: design.id })
}

function buildPrompt(body: Record<string, unknown>): string {
  const { type } = body

  if (type === 'slogan') {
    const { text, font, mood, color, customPrompt } = body
    if (customPrompt) return customPrompt as string
    const tags = [...(mood as string[]), ...(color as string[])].join(', ')
    return `Fan goods slogan design background for "${text}", ${font} font style, ${tags} mood, high quality illustration, no text`
  }

  if (type === 'photocard') {
    const { mood, border, customPrompt } = body
    if (customPrompt) return customPrompt as string
    return `K-pop photocard background design, ${(mood as string[]).join(', ')} mood, ${border} border style, 55x85mm format, pastel aesthetic, high quality`
  }

  if (type === 'uniform') {
    const { sport, teamColor, secondaryColor, number, playerName, style, customPrompt } = body
    if (customPrompt) return customPrompt as string
    return `${sport} sports uniform illustration for sticker/acrylic keyring, player number ${number}, name ${playerName}, team color ${teamColor} and ${secondaryColor}, ${style} style, flat illustration, no background`
  }

  return 'fan goods design illustration'
}

function getCoinCost(body: Record<string, unknown>): number {
  const { type, mode, customPrompt } = body
  let cost = 0
  if (type === 'slogan') cost = mode === 'double' ? 3 : 2
  else if (type === 'photocard') cost = 2
  else if (type === 'uniform') cost = 3
  if (customPrompt) cost += 1
  return cost
}

async function generateImageWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 },
      }),
    }
  )

  const data = await response.json()
  const base64Image = data.predictions?.[0]?.bytesBase64Encoded
  if (!base64Image) throw new Error('Image generation failed')

  return `data:image/png;base64,${base64Image}`
}

async function addWatermark(imageUrl: string): Promise<string> {
  // TODO: 워터마크 합성 구현 (Sharp 또는 Canvas API)
  // MVP에서는 원본 URL에 watermark 쿼리 파라미터를 붙여서 클라이언트에서 CSS overlay로 처리
  return imageUrl + '?watermark=true'
}
