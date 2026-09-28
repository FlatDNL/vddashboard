'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMensagens() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'flatdnl@yahoo.com.br') {
    return []
  }

  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching mensagens:', error)
    return []
  }
  return data || []
}

export async function approveUser(mensagemId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'flatdnl@yahoo.com.br') return { error: 'Unauthorized' }

  // 1. Aprova o usuário na tabela profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_approved: true })
    .eq('id', userId)

  if (profileError) return { error: profileError.message }

  // 2. Atualiza a mensagem
  await supabase
    .from('mensagens')
    .update({ acao_realizada: true, lida: true, tipo: 'APPROVAL_RESOLVED' })
    .eq('id', mensagemId)

  revalidatePath('/dashboard/mensagens')
  return { success: true }
}

export async function rejectUser(mensagemId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'flatdnl@yahoo.com.br') return { error: 'Unauthorized' }

  // Como o admin rejeitou, podemos manter is_approved = false ou deletar o usuário.
  // Vou manter como não aprovado, e apenas resolver a mensagem.
  await supabase
    .from('mensagens')
    .update({ acao_realizada: true, lida: true, tipo: 'APPROVAL_REJECTED' })
    .eq('id', mensagemId)

  revalidatePath('/dashboard/mensagens')
  return { success: true }
}
