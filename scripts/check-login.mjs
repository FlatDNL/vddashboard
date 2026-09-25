import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const supabaseUrl = 'https://wuidghlxjsvqmweezzil.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWRnaGx4anN2cW13ZWV6emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzg2NjYsImV4cCI6MjEwNTg1NDY2Nn0.j7GnGVhqammPqbOQr0qWZzUk4K8UJZ3-6k9fz5xx5wM'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: WebSocket
  }
})

async function checkLogin() {
  const { error } = await supabase.auth.signInWithPassword({
    email: 'flatdnl@yahoo.com.br',
    password: '123456',
  })

  console.log(error)
}

checkLogin()
