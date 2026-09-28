'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type Marcacao = {
  id?: string
  preco: number
  descricao: string
  importancia: 'Baixa' | 'Média' | 'Alta'
}

export async function fetchMarcacoes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('marcacoes')
    .select('id, preco, descricao, importancia')
    .order('preco', { ascending: false })

  if (error) {
    console.error('Erro ao buscar marcações:', error)
    return []
  }

  return data || []
}

export async function syncMarcacoes(marcacoesParaSalvar: Marcacao[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Estratégia de Sync: Pega as atuais, deleta as removidas, e faz UPSERT das demais.
  const { data: dbMarcacoes } = await supabase.from('marcacoes').select('id')
  const dbIds = (dbMarcacoes || []).map(m => m.id)
  
  const incomingIds = marcacoesParaSalvar.filter(m => !m.id?.startsWith('temp_')).map(m => m.id)
  const idsParaDeletar = dbIds.filter(id => !incomingIds.includes(id))
  
  if (idsParaDeletar.length > 0) {
    await supabase.from('marcacoes').delete().in('id', idsParaDeletar)
  }

  for (const m of marcacoesParaSalvar) {
    const isTemp = !m.id || m.id.startsWith('temp_')
    
    if (isTemp) {
      const { error } = await supabase.from('marcacoes').insert({
        user_id: user.id,
        preco: m.preco,
        descricao: m.descricao,
        importancia: m.importancia
      })
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('marcacoes').update({
        preco: m.preco,
        descricao: m.descricao,
        importancia: m.importancia
      }).eq('id', m.id)
      if (error) throw new Error(error.message)
    }
  }

  revalidatePath('/dashboard/operacional/marcacoes')
  revalidatePath('/superdom')
  return { success: true }
}

