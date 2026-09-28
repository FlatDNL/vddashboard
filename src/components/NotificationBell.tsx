"use client"

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Trash2, X, AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useNotificationStore } from '@/store/notifications'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationStore()
  
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle size={16} className="text-red-400" />
      case 'success': return <CheckCircle2 size={16} className="text-emerald-400" />
      case 'warning': return <AlertTriangle size={16} className="text-amber-400" />
      default: return <Info size={16} className="text-blue-400" />
    }
  }

  const getBg = (type: string, read: boolean) => {
    if (read) return 'bg-transparent'
    switch (type) {
      case 'error': return 'bg-red-500/10'
      case 'success': return 'bg-emerald-500/10'
      case 'warning': return 'bg-amber-500/10'
      default: return 'bg-blue-500/10'
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-[#1e293b] transition-colors text-slate-400 hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#0f172a]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#1e293b] bg-[#0f172a] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between p-4 border-b border-[#1e293b] bg-[#0b1120]">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              Notificações
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                  {unreadCount} novas
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors disabled:opacity-50"
                title="Marcar todas como lidas"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                title="Limpar todas"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Bell size={32} className="mb-2 opacity-20" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  className={`relative group flex gap-3 p-3 rounded-lg border ${notif.read ? 'border-transparent opacity-70 hover:opacity-100 hover:bg-[#1e293b]/50' : `border-[#1e293b] ${getBg(notif.type, notif.read)}`} transition-all`}
                >
                  <div className="pt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 flex flex-col gap-1 pr-6">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-semibold ${notif.read ? 'text-slate-300' : 'text-slate-100'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
                        {new Date(notif.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 bg-[#0f172a] rounded shadow-md border border-[#1e293b]">
                    {!notif.read && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                        title="Marcar como lida"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Excluir"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  {!notif.read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
