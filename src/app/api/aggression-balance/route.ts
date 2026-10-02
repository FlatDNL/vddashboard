import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const asset = searchParams.get('asset') || 'WDOFUT'
    const limit = parseInt(searchParams.get('limit') || '3600', 10)

    const supabase = await createClient()

    // Buscar grupos cadastrados
    const { data: groups, error: groupsError } = await supabase
      .from('player_groups')
      .select('*')
      .order('created_at', { ascending: true })

    if (groupsError) throw groupsError

    // Buscar os últimos registros de saldo por segundo do ativo (desc para pegar os mais recentes, depois inverte)
    const { data: recordsRaw, error: recordsError } = await supabase
      .from('aggression_balance_1s')
      .select('*')
      .eq('asset', asset)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (recordsError) throw recordsError

    // O gráfico precisa dos dados ordenados de forma crescente (mais antigo para o mais novo)
    const records = recordsRaw ? recordsRaw.reverse() : []

    return NextResponse.json({ groups, records })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
