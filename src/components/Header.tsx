'use client'

import { Bell, Moon } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { NextEventAlertWidget } from './NextEventAlertWidget'

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-8 bg-[#0b1120] border-b border-[#1e293b]">
      <div className="flex flex-1 items-center gap-4">
        {/* Alerta de Próxima Notícia na Barra Principal */}
        <NextEventAlertWidget compact={true} />
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
