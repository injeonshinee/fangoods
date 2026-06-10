import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })

  const { data: design, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !design) {
    return NextResponse.json({ error: '도안을 찾을 수 없어요' }, { status: 404 })
  }

  if (!design.file_path || !design.preview_path) {
    return NextResponse.json({ error: '도안 파일을 찾을 수 없어요' }, { status: 404 })
  }

  const [frontFile, backFile] = await Promise.all([
    serviceSupabase.storage.from('designs').download(design.file_path),
    serviceSupabase.storage.from('designs').download(design.preview_path),
  ])

  if (frontFile.error || backFile.error) {
    return NextResponse.json({ error: '도안 파일을 불러오지 못했어요' }, { status: 404 })
  }

  const [front, back] = await Promise.all([
    frontFile.data.text(),
    backFile.data.text(),
  ])

  return NextResponse.json({ type: design.type, front, back })
}
