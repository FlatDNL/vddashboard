'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search, Moon } from 'lucide-react'
import { UserMenu } from './UserMenu'

export function Header() {
  const pathname = usePathname()
  
  // Condição para esconder a barra de busca
  const hideSearch = pathname === '/dashboard/macroeconomia/cadastro' || pathname === '/dashboard'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-8 bg-[#0b1120]">
      <div className="flex flex-1">
        {!hideSearch && (
          <div className="relative w-full max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-full border border-[#1e293b] bg-[#0f172a] py-2 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Buscar ativo, indicador ou funcionalidade..."
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-white relative transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0b1120]" />
        </button>
        
        <button className="flex items-center gap-2 rounded-full border border-[#1e293b] bg-[#0f172a] px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors">
          <Moon className="h-3.5 w-3.5" />
          <span>Modo Escuro</span>
        </button>

        <UserMenu />
      </div>
    </header>
  )
}
