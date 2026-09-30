'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, Edit2, GripVertical, Eye, EyeOff } from 'lucide-react'
import { AssetQuote } from '@/components/AssetQuote'

type Ativo = {
  id: string
  codigo: string
  nome: string
  fonte: 'yahoo' | 'tradingview'
  showOnDashboard?: boolean
}

type SortableAtivoProps = {
  ativo: Ativo
  grupoId: string
  onEdit: (ativo: Ativo & { grupoId: string }) => void
  onDelete: (id: string, grupoId: string) => void
  onToggleVisibility: (id: string, grupoId: string) => void
}

export function SortableAtivo({ ativo, grupoId, onEdit, onDelete, onToggleVisibility }: SortableAtivoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ativo.id, data: { type: 'ativo', grupoId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  // Default true if undefined for backward compatibility, 
  // but let's strictly use the property. If undefined, assume true.
  const isVisible = ativo.showOnDashboard !== false

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between rounded-xl border border-[#1e293b] p-3 relative ${isVisible ? 'bg-[#0b1120]' : 'bg-[#0f172a] opacity-60'}`}
    >
      <div className="flex items-center gap-3">
        <button 
          className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-blue-400">{ativo.codigo}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${ativo.fonte === 'yahoo' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {ativo.fonte === 'yahoo' ? 'Yahoo' : 'TradingView'}
            </span>
            {!isVisible && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-500/20 text-slate-400">
                Oculto no Dashboard
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">{ativo.nome}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 mb-0.5">Cotação Atual</span>
          <AssetQuote codigo={ativo.codigo} fonte={ativo.fonte} />
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => onToggleVisibility(ativo.id, grupoId)}
            className={`p-1.5 rounded-md transition-colors ${isVisible ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-500 hover:bg-slate-500/10'}`}
            title={isVisible ? "Ocultar no Dashboard" : "Mostrar no Dashboard"}
          >
            {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button 
            onClick={() => onEdit({ ...ativo, grupoId })}
            className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(ativo.id, grupoId)}
            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
