import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export const revalidate = 0 // Não fazer cache para o gráfico ao vivo

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tf = searchParams.get('tf') || '30m'

    let interval_minutes = 1
    let lookback_minutes = 30

    switch (tf) {
      case '1m': interval_minutes = 1; lookback_minutes = 2; break; // Mostra pelo menos 2 min para formar linha
      case '5m': interval_minutes = 1; lookback_minutes = 5; break; 
      case '15m': interval_minutes = 1; lookback_minutes = 15; break;
      case '30m': interval_minutes = 1; lookback_minutes = 30; break;
      case '1h': interval_minutes = 1; lookback_minutes = 60; break;
      case '4h': interval_minutes = 1; lookback_minutes = 240; break;
      case '1d': interval_minutes = 5; lookback_minutes = 1440; break;
    }

    const { data, error } = await supabase.rpc('get_risk_history_downsampled', {
      interval_minutes,
      lookback_minutes
    })

    if (error) {
      console.error('Erro ao buscar histórico RPC:', error)
      return NextResponse.json({ error: 'Falha ao buscar histórico' }, { status: 500 })
    }

    // Formata para o formato esperado pelo gráfico
    const history = (data || []).map((row: any) => {
      const date = new Date(row.bucket_time)
      const timeString = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

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
