import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export const revalidate = 0 // Não fazer cache para o gráfico ao vivo

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tf = searchParams.get('tf') || '1m'

    let interval_minutes = 1
    let lookback_hours = 2

    switch (tf) {
      case '1m': interval_minutes = 1; lookback_hours = 2; break; // Últimas 2 horas
      case '5m': interval_minutes = 5; lookback_hours = 12; break; // Últimas 12 horas
      case '15m': interval_minutes = 15; lookback_hours = 24; break; // Últimas 24 horas
      case '30m': interval_minutes = 30; lookback_hours = 48; break; // Últimas 48 horas
      case '1h': interval_minutes = 60; lookback_hours = 120; break; // Últimos 5 dias
      case '4h': interval_minutes = 240; lookback_hours = 480; break; // Últimos 20 dias
      case '1d': interval_minutes = 1440; lookback_hours = 2160; break; // Últimos 90 dias
    }

    const { data, error } = await supabase.rpc('get_risk_history_downsampled', {
      interval_minutes,
      lookback_hours
    })

    if (error) {
      console.error('Erro ao buscar histórico RPC:', error)
      return NextResponse.json({ error: 'Falha ao buscar histórico' }, { status: 500 })
    }

    // Formata para o formato esperado pelo gráfico
    const history = (data || []).map((row: any) => {
      const date = new Date(row.bucket_time)
      let timeString = ''
      
      // Se for gráfico diário, mostra a data. Se não, mostra a hora.
      if (tf === '1d') {
        timeString = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      } else {
        timeString = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }

      return {
        time: timeString,
        Global: Math.round(row.global_score),
        Brasil: Math.round(row.brazil_score),
        WDO: Math.round(row.wdo_score)
      }
    })

    return NextResponse.json(history)

  } catch (error) {
    console.error('Erro geral no histórico:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
