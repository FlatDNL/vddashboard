import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export const revalidate = 60 // Cache 60 segundos

export async function GET() {
  try {
    const now = new Date()
    now.setHours(now.getHours() - 1) // Últimas 1 hora (60 pontos)

    const { data, error } = await supabase
      .from('risk_history')
      .select('*')
      .gte('minute_timestamp', now.toISOString())
      .order('minute_timestamp', { ascending: true })

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      return NextResponse.json({ error: 'Falha ao buscar histórico' }, { status: 500 })
    }

    // Formata para o formato esperado pelo gráfico
    const history = data.map(row => {
      const date = new Date(row.minute_timestamp)
      const timeString = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      return {
        time: timeString,
        Global: row.global_score,
        Brasil: row.brazil_score,
        WDO: row.wdo_score
      }
    })

    return NextResponse.json(history)

  } catch (error) {
    console.error('Erro geral no histórico:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
