'use client'

import React from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react'
import { SortableAtivo } from './SortableAtivo'

type Ativo = {
  id: string
  codigo: string
  nome: string
  fonte: 'yahoo' | 'tradingview'
  showOnDashboard?: boolean
}

type Grupo = {
  id: string
  nome: string
  ativos: Ativo[]
}

type SortableGrupoProps = {
  grupo: Grupo
  onEditGrupo: (grupo: Grupo) => void
  onDeleteGrupo: (id: string) => void
  onAddAtivo: (grupoId: string) => void
  onEditAtivo: (ativo: Ativo & { grupoId: string }) => void
  onDeleteAtivo: (id: string, grupoId: string) => void
  onToggleVisibilityAtivo: (id: string, grupoId: string) => void
}

export function SortableGrupo({ 
  grupo, 
  onEditGrupo, 
  onDeleteGrupo, 
  onAddAtivo, 
  onEditAtivo, 
  onDeleteAtivo,
  onToggleVisibilityAtivo
}: SortableGrupoProps) {
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: grupo.id, data: { type: 'grupo' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-lg overflow-hidden flex flex-col relative"
    >
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#131d33] px-5 py-4">
        <div className="flex items-center gap-3">
          <button 
            className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={18} />
          </button>
          <h3 className="text-lg font-semibold text-slate-200">{grupo.nome}</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEditGrupo(grupo)}
            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDeleteGrupo(grupo.id)}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-5">
        {grupo.ativos.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Nenhum ativo neste grupo.</p>
        ) : (
          <div className="space-y-3">
            <SortableContext items={grupo.ativos.map(a => a.id)} strategy={verticalListSortingStrategy}>
              {grupo.ativos.map(ativo => (
                <SortableAtivo 
                  key={ativo.id} 
                  ativo={ativo} 
                  grupoId={grupo.id} 
                  onEdit={onEditAtivo} 
                  onDelete={onDeleteAtivo} 
                  onToggleVisibility={onToggleVisibilityAtivo}
                />
              ))}
            </SortableContext>
          </div>
        )}
      </div>
      
      <div className="border-t border-[#1e293b] p-4 bg-[#0b1120]/50">
        <button 
          onClick={() => onAddAtivo(grupo.id)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors"
        >
          <Plus size={16} />
          <span>Adicionar Ativo</span>
        </button>
      </div>
    </div>
  )
}
