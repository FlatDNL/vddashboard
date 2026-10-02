import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: groups, error: groupsError } = await supabase
      .from('player_groups')
      .select('*')
      .order('created_at', { ascending: true })

    if (groupsError) throw groupsError

    const { data: mappings, error: mappingsError } = await supabase
      .from('broker_group_mapping')
      .select('*')

    if (mappingsError) throw mappingsError

    return NextResponse.json({ groups, mappings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, payload } = body
    const supabase = await createClient()

    if (action === 'CREATE_GROUP') {
      const { name, color, description } = payload
      const { data, error } = await supabase
        .from('player_groups')
        .insert([{ name, color, description }])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ group: data })
    }

    if (action === 'DELETE_GROUP') {
      const { id } = payload
      const { error } = await supabase
        .from('player_groups')
        .delete()
        .eq('id', id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'UPSERT_MAPPING') {
      const { broker_id, broker_name, group_id } = payload
      const { data, error } = await supabase
        .from('broker_group_mapping')
        .upsert(
          { broker_id, broker_name, group_id, updated_at: new Date().toISOString() },
          { onConflict: 'broker_id' }
        )
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ mapping: data })
    }

    if (action === 'DELETE_MAPPING') {
      const { broker_id } = payload
      const { error } = await supabase
        .from('broker_group_mapping')
        .delete()
        .eq('broker_id', broker_id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error: any) {
    console.error('Player Groups API Error:', error)
    return NextResponse.json({ error: error?.message || error?.details || 'Erro desconhecido' }, { status: 500 })
  }
}
