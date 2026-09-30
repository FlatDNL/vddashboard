'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [userName, setUserName] = useState('Carregando...')
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuário')
      }
    })
  }, [])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const encodedName = encodeURIComponent(userName)

  return (
    <div className="relative" ref={menuRef}>
      <div 
        className="flex items-center gap-3 pl-2 border-l border-[#1e293b] cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={`https://ui-avatars.com/api/?name=${encodedName}&background=1d4ed8&color=fff`} 
          alt={userName} 
          className="h-9 w-9 rounded-full object-cover ring-2 ring-[#1e293b] group-hover:ring-blue-500 transition-all"
        />
        <div className="flex flex-col hidden sm:flex">
          <span className="text-sm font-semibold text-white leading-tight">{userName}</span>
          <span className="text-[10px] text-slate-400">Trader • Premium</span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-48 rounded-xl bg-[#0f172a] border border-[#1e293b] shadow-xl py-1 z-50">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-[#1e293b] hover:text-red-300 transition-colors"
          >
            <LogOut size={16} />
            <span>Deslogar</span>
          </button>
        </div>
      )}
    </div>
  )
}
