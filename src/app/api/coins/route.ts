import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { packageName, coinAmount, price, depositorName } = await request.json()

  const { error } = await supabase.from('orders').insert({
    user_id: user.id,
    package_name: packageName,
    coin_amount: coinAmount,
    price,
    depositor_name: depositorName,
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
