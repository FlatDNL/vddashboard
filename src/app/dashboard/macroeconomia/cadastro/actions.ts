'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type Ativo = {
  id?: string
  codigo: string
  nome: string
  fonte: 'yahoo' | 'tradingview'
}

type Grupo = {
  id?: string
  nome: string
  ativos: Ativo[]
}

export async function syncData(gruposParaSalvar: Grupo[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Estratégia de sincronização simples:
  // Como são dados que pertencem a um usuário e mudam pouco, a forma mais segura 
  // e simples de "sync" unidirecional de uma lista inteira é obter os existentes, 
  // deletar o que não está mais na lista, e dar UPSERT no resto.
  
  // 1. Obter grupos existentes
  const { data: dbGrupos } = await supabase.from('grupos').select('id')
  const dbGrupoIds = (dbGrupos || []).map(g => g.id)
  
  const incomingGrupoIds = gruposParaSalvar.filter(g => !g.id?.startsWith('temp_')).map(g => g.id)
  const idsParaDeletar = dbGrupoIds.filter(id => !incomingGrupoIds.includes(id))
  
  if (idsParaDeletar.length > 0) {
    await supabase.from('grupos').delete().in('id', idsParaDeletar)
  }

  for (const grupo of gruposParaSalvar) {
    let grupoId = grupo.id
    const isTempGrupo = grupoId?.startsWith('temp_')
    
    if (isTempGrupo || !grupoId) {
      // Create new group
      const { data: newGroup, error: groupErr } = await supabase.from('grupos').insert({
        user_id: user.id,
        nome: grupo.nome
      }).select().single()
      
      if (groupErr) throw groupErr
      grupoId = newGroup.id
    } else {
      // Update existing group
      await supabase.from('grupos').update({ nome: grupo.nome }).eq('id', grupoId)
    }

    // Agora sincronizar os ativos deste grupo
    const { data: dbAtivos } = await supabase.from('ativos').select('id').eq('grupo_id', grupoId)
    const dbAtivoIds = (dbAtivos || []).map(a => a.id)
    
    const incomingAtivosIds = grupo.ativos.filter(a => !a.id?.startsWith('temp_')).map(a => a.id)
    const ativosParaDeletar = dbAtivoIds.filter(id => !incomingAtivosIds.includes(id))
    
    if (ativosParaDeletar.length > 0) {
      await supabase.from('ativos').delete().in('id', ativosParaDeletar)
    }

    for (const ativo of grupo.ativos) {
      const isTempAtivo = ativo.id?.startsWith('temp_') || !ativo.id
      
      if (isTempAtivo) {
        await supabase.from('ativos').insert({
          grupo_id: grupoId,
          codigo: ativo.codigo,
          nome: ativo.nome,
          fonte: ativo.fonte
        })
      } else {
        await supabase.from('ativos').update({
          codigo: ativo.codigo,
          nome: ativo.nome,
          fonte: ativo.fonte
        }).eq('id', ativo.id)
      }
    }
  }

  revalidatePath('/dashboard/macroeconomia/cadastro')
  return { success: true }
}

export async function fetchInitialData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: grupos, error } = await supabase
    .from('grupos')
    .select(`
      id, 
      nome, 
      ativos (id, codigo, nome, fonte)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar grupos:', error)
    return []
  }

  return grupos || []
}
