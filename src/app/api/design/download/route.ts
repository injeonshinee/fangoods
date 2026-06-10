import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { designId } = await request.json()

  const { data: design } = await supabase
    .from('designs')
    .select('*')
    .eq('id', designId)
    .eq('user_id', user.id)
    .single()

  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 })
  }

  if (design.downloaded_at) {
    return respondWithFile(design.file_path)
  }

  const { data: userData } = await supabase
    .from('users')
    .select('coin_balance')
    .eq('id', user.id)
    .single()

  const balance = userData?.coin_balance ?? 0
  if (balance < design.coin_cost) {
    return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 })
  }

  const { error: rpcError } = await supabase.rpc('deduct_coins', {
    p_user_id: user.id,
    p_amount: design.coin_cost,
    p_description: `${design.type} 도안 다운로드`,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  await supabase
    .from('designs')
    .update({ downloaded_at: new Date().toISOString() })
    .eq('id', designId)

  return respondWithFile(design.file_path)
}

async function respondWithFile(filePath: string) {
  if (filePath.startsWith('data:')) {
    const [meta, base64Data] = filePath.split(',')
    const mimeType = meta.split(':')[1].split(';')[0]
    const buffer = Buffer.from(base64Data, 'base64')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="design.${mimeType.split('/')[1]}"`,
      },
    })
  }

  // Supabase Storage 경로 → signed URL로 다운로드
  const { data: fileData, error } = await serviceSupabase.storage
    .from('designs')
    .download(filePath)

  if (error || !fileData) {
    return NextResponse.json({ error: '파일을 찾을 수 없어요' }, { status: 404 })
  }

  const ext = filePath.split('.').pop() ?? 'svg'
  const mimeType = ext === 'svg' ? 'image/svg+xml' : 'image/png'
  const buffer = Buffer.from(await fileData.arrayBuffer())
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="design.${ext}"`,
    },
  })
}
