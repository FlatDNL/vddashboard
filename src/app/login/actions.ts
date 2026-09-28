'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error)
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  // Verifica aprovação
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved')
    .eq('id', authData.user.id)
    .single()

  if (!profile?.is_approved) {
    // IMPORTANTE: Remove a sessão se não estiver aprovado!
    await supabase.auth.signOut()
    redirect(`/login?message=${encodeURIComponent('Seu cadastro está em análise pelo administrador. Aguarde a aprovação.')}`)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup error:', error)
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  // IMPORTANTE: No Supabase, se a confirmação de e-mail estiver desligada, 
  // o signUp loga o usuário automaticamente (cria sessão). 
  // Precisamos deslogar ele imediatamente para forçar que ele aguarde aprovação!
  await supabase.auth.signOut()

  redirect(`/login?message=${encodeURIComponent('Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar.')}`)
}
