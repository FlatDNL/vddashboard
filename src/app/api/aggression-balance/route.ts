import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const asset = searchParams.get('asset') || 'WDOFUT'
    const tf = searchParams.get('tf') || '5m' // 5m, 15m, 30m, 4h, 1d

    const supabase = await createClient()

    // Buscar grupos cadastrados
    const { data: groups, error: groupsError } = await supabase
      .from('player_groups')
      .select('*')
      .order('created_at', { ascending: true })

    if (groupsError) throw groupsError

    // Achar o último registro para saber qual o "tempo atual" do mercado (útil para Replay)
    const { data: latestRecord } = await supabase
      .from('aggression_balance_1s')
      .select('timestamp')
      .eq('asset', asset)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    let timeFilter = new Date()
    if (latestRecord && latestRecord.timestamp) {
      timeFilter = new Date(latestRecord.timestamp)
    }

    if (tf === '5m') timeFilter.setMinutes(timeFilter.getMinutes() - 5)
    else if (tf === '15m') timeFilter.setMinutes(timeFilter.getMinutes() - 15)
    else if (tf === '30m') timeFilter.setMinutes(timeFilter.getMinutes() - 30)
    else if (tf === '4h') timeFilter.setHours(timeFilter.getHours() - 4)
    else if (tf === '1d') timeFilter.setHours(0, 0, 0, 0) // Início do dia do replay

    const { data: recordsRaw, error: recordsError } = await supabase
      .from('aggression_balance_1s')
      .select('*')
      .eq('asset', asset)
      .gte('timestamp', timeFilter.toISOString())
      .order('timestamp', { ascending: false })
      .limit(100000) // limite ampliado para timeframe diário

    if (recordsError) throw recordsError

    // O gráfico precisa dos dados ordenados de forma crescente (mais antigo para o mais novo)
    const records = recordsRaw ? recordsRaw.reverse() : []

    return NextResponse.json({ groups, records })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const asset = searchParams.get('asset') || 'WDOFUT'
    const supabase = await createClient()

    // Deleta os registros daquele ativo específico
    const { error } = await supabase
      .from('aggression_balance_1s')
      .delete()
      .eq('asset', asset)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
