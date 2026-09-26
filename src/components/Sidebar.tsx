'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Settings,
  LineChart,
  BarChart2,
  Activity,
  SlidersHorizontal,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Globe,
  User,
  Calendar
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calendário Econômico', href: '/dashboard/calendario', icon: Calendar },
  { name: 'Demo', href: '/dashboard/demo', icon: SlidersHorizontal },
  { 
    name: 'Macroeconomia', 
    icon: Globe,
    submenus: [
      { name: 'Visão Geral', href: '/dashboard/macroeconomia' },
      { name: 'Cadastro de Ativo', href: '/dashboard/macroeconomia/cadastro' },
    ]
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>('Macroeconomia')
  const pathname = usePathname()

  const toggleSubmenu = (name: string) => {
    if (collapsed) setCollapsed(false)
    setExpandedMenu(expandedMenu === name ? null : name)
  }

  return (
    <div 
      className={`flex flex-col border-r border-[#1e293b] bg-[#0f172a] transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } relative z-20`}
    >
      <div className="flex h-16 shrink-0 items-center px-6 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="max-h-full max-w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-lg font-bold text-white leading-tight tracking-wide truncate">VDDASHBOARD</span>
              <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider truncate">Análise Quântica</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 scrollbar-hide">
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const hasSubmenu = !!item.submenus
            const isExpanded = expandedMenu === item.name
            const isActive = !hasSubmenu && pathname === item.href
            
            // Verifica se algum submenu está ativo
            const isSubmenuActive = hasSubmenu && item.submenus?.some(sub => pathname === sub.href)

            return (
              <div key={item.name} className="flex flex-col gap-1">
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors w-full ${
                      isSubmenuActive
                        ? 'bg-blue-900/20 text-blue-400'
                        : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={`flex-shrink-0 ${
                          isSubmenuActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                        } ${collapsed ? 'mr-0 h-5 w-5' : 'mr-3 h-5 w-5'}`}
                        aria-hidden="true"
                      />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={`flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      } ${collapsed ? 'mr-0 h-5 w-5' : 'mr-3 h-5 w-5'}`}
                      aria-hidden="true"
                    />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                )}

                {/* Submenus */}
                {hasSubmenu && isExpanded && !collapsed && (
                  <div className="flex flex-col gap-1 mt-1 pl-4 relative">
                    <div className="absolute left-6 top-0 bottom-2 w-px bg-[#1e293b]"></div>
                    {item.submenus!.map((sub) => {
                      const isSubActive = pathname === sub.href
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`relative flex items-center rounded-xl py-2 pl-8 pr-4 text-xs font-medium transition-colors ${
                            isSubActive
                              ? 'text-blue-400 bg-blue-900/10'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-[#1e293b]/50'
                          }`}
                        >
                          <div className={`absolute left-2 w-2 h-px ${isSubActive ? 'bg-blue-400' : 'bg-[#1e293b]'}`}></div>
                          {sub.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
      
      {/* Bottom info section */}
      <div className="p-4 mt-auto border-t border-[#1e293b]">
        {!collapsed ? (
          <div className="rounded-xl bg-[#1e293b]/30 p-4 border border-[#1e293b]/50">
             <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Activity size={14} />
                <span className="text-[11px] font-medium uppercase tracking-wider">Servidor Ativo</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Ping local</span>
                <span className="text-xs text-emerald-400 font-mono">12ms</span>
             </div>
          </div>
        ) : (
          <div className="flex justify-center">
             <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          </div>
        )}
      </div>
    </div>
  )
}
