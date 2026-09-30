'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Activity, SlidersHorizontal, ChevronDown, Globe, RefreshCw, Settings, Mail } from 'lucide-react'

type SubmenuItem = {
  name: string
  href: string
  isPopup?: boolean
}

type NavigationItem = {
  name: string
  href?: string
  icon: any
  submenus?: SubmenuItem[]
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calendário Econômico', href: '/dashboard/calendario', icon: Activity },
  { name: 'Demo', href: '/dashboard/demo', icon: SlidersHorizontal },
  { name: 'Mensagens', href: '/dashboard/mensagens', icon: Mail },
  { 
    name: 'Macroeconomia', 
    icon: Globe,
    submenus: [
      { name: 'Manchetes', href: '/dashboard/macroeconomia' },
      { name: 'Painel de Ativos', href: '/dashboard/macroeconomia/painel' },
      { name: 'Cadastro de Ativo', href: '/dashboard/macroeconomia/cadastro' },
    ]
  },
  { 
    name: 'Operacional', 
    icon: Activity,
    submenus: [
      { name: 'SuperDOM', href: '/superdom', isPopup: true },
      { name: 'Marcações', href: '/dashboard/operacional/marcacoes' },
    ]
  },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

export function Sidebar() {
  const [profitStatus, setProfitStatus] = useState<boolean>(false)
  const [profitDdeConnected, setProfitDdeConnected] = useState<boolean>(false)
  const [collapsed, setCollapsed] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>('Operacional')
  const pathname = usePathname()

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/profit-bridge')
        if (res.ok) {
          const data = await res.json()
          setProfitStatus(data.running)
          setProfitDdeConnected(data.profitConnected || false)
        }
      } catch (e) {}
    }
    checkStatus()
    const interval = setInterval(checkStatus, 2000)
    return () => clearInterval(interval)
  }, [])

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
            const isActive = !hasSubmenu && item.href && pathname === item.href
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
                    href={item.href || '#'}
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

                {hasSubmenu && isExpanded && !collapsed && (
                  <div className="flex flex-col gap-1 mt-1 pl-4 relative">
                    <div className="absolute left-6 top-0 bottom-2 w-px bg-[#1e293b]"></div>
                    {item.submenus!.map((sub) => {
                      const isSubActive = pathname === sub.href

                      if (sub.isPopup) {
                        return (
                          <button
                            key={sub.name}
                            onClick={(e) => {
                              e.preventDefault()
                              window.open(sub.href, 'superdomWindow', 'width=380,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes')
                            }}
                            className={`relative flex items-center w-full text-left rounded-xl py-2 pl-8 pr-4 text-xs font-medium transition-colors text-emerald-400 hover:text-emerald-300 hover:bg-[#1e293b]/50`}
                          >
                            <div className={`absolute left-2 w-2 h-px bg-[#1e293b]`}></div>
                            {sub.name} ↗
                          </button>
                        )
                      }

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
          <div className="rounded-xl bg-[#1e293b]/30 p-4 border border-[#1e293b]/50 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                   <Activity size={14} />
                   <span className="text-[11px] font-medium uppercase tracking-wider">Ponte Profit</span>
                </div>
                {profitStatus ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
             </div>
             <div className="flex items-center justify-between my-0.5">
                {profitStatus && profitDdeConnected ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    PROFIT AO VIVO
                  </span>
                ) : profitStatus && !profitDdeConnected ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    ABRA O PROFIT PRO
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                    <RefreshCw size={10} className="animate-spin" />
                    PONTE DESCONECTADA
                  </span>
                )}
                <span className="text-xs text-emerald-400 font-mono">{profitStatus ? '12ms' : '0ms'}</span>
             </div>
          </div>
        ) : (
          <div className="flex justify-center">
             <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          </div>
        )}
      </div>
    </div>
  )
}
