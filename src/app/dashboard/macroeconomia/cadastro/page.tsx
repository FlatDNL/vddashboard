'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Trash2, TrendingUp, Save, X, AlertTriangle, Loader2 } from 'lucide-react'
import { AssetQuote } from '@/components/AssetQuote'
import { fetchInitialData, syncData } from './actions'

type Ativo = {
  id: string
  codigo: string
  nome: string
  fonte: 'yahoo' | 'tradingview'
}

type Grupo = {
  id: string
  nome: string
  ativos: Ativo[]
}

export default function MacroeconomiaCadastroPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  
  useEffect(() => {
    fetchInitialData().then(data => {
      setGrupos(data as any)
      setLoading(false)
    })
  }, [])
  
  // Modal States
  const [modalGrupo, setModalGrupo] = useState(false)
  const [novoGrupoNome, setNovoGrupoNome] = useState('')

  const [modalAtivo, setModalAtivo] = useState(false)
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null)
  const [novoAtivo, setNovoAtivo] = useState({ codigo: '', nome: '', fonte: 'yahoo' as const })

  const [modalConfirm, setModalConfirm] = useState<{ isOpen: boolean; id: string; tipo: 'grupo' | 'ativo', grupoId?: string } | null>(null)

  // Handlers
  const handleAdicionarGrupo = (e: React.FormEvent) => {
    e.preventDefault()
    if (novoGrupoNome.trim()) {
      setGrupos([...grupos, { id: `temp_${Date.now()}`, nome: novoGrupoNome, ativos: [] }])
      setModalGrupo(false)
      setNovoGrupoNome('')
    }
  }

  const handleAdicionarAtivo = (e: React.FormEvent) => {
    e.preventDefault()
    if (novoAtivo.codigo && novoAtivo.nome && grupoSelecionado) {
      setGrupos(grupos.map(g => {
        if (g.id === grupoSelecionado) {
          return {
            ...g,
            ativos: [...g.ativos, { id: `temp_${Date.now()}`, codigo: novoAtivo.codigo.toUpperCase(), nome: novoAtivo.nome, fonte: novoAtivo.fonte }]
          }
        }
        return g
      }))
      setModalAtivo(false)
      setNovoAtivo({ codigo: '', nome: '', fonte: 'yahoo' })
    }
  }

  const handleRemover = () => {
    if (!modalConfirm) return
    
    if (modalConfirm.tipo === 'grupo') {
      setGrupos(grupos.filter(g => g.id !== modalConfirm.id))
    } else if (modalConfirm.tipo === 'ativo' && modalConfirm.grupoId) {
      setGrupos(grupos.map(g => {
        if (g.id === modalConfirm.grupoId) {
          return { ...g, ativos: g.ativos.filter(a => a.id !== modalConfirm.id) }
        }
        return g
      }))
    }
    setModalConfirm(null)
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto scrollbar-hide pb-10 relative">
      
      {/* Botão Global de Adicionar Grupo */}
      <div className="flex justify-end">
        <button 
          onClick={() => setModalGrupo(true)}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]"
        >
          <Plus size={18} />
          <span>Novo Grupo</span>
        </button>
      </div>
      
      {grupos.length === 0 ? (
        <div className="flex-1 rounded-2xl border border-dashed border-[#1e293b] bg-[#0f172a]/50 p-12 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
            <TrendingUp size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-2">Nenhum grupo cadastrado</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Comece criando um grupo (como Futuros, Cripto ou Ações) e depois adicione os ativos que deseja monitorar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {grupos.map(grupo => (
            <div key={grupo.id} className="rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#131d33] px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-200">{grupo.nome}</h3>
                <button 
                  onClick={() => setModalConfirm({ isOpen: true, id: grupo.id, tipo: 'grupo' })}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex-1 p-5">
                {grupo.ativos.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">Nenhum ativo neste grupo.</p>
                ) : (
                  <div className="space-y-3">
                    {grupo.ativos.map(ativo => (
                      <div key={ativo.id} className="flex items-center justify-between rounded-xl border border-[#1e293b] bg-[#0b1120] p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-blue-400">{ativo.codigo}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${ativo.fonte === 'yahoo' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {ativo.fonte === 'yahoo' ? 'Yahoo' : 'TradingView'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">{ativo.nome}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-500 mb-0.5">Cotação Atual</span>
                            <AssetQuote codigo={ativo.codigo} fonte={ativo.fonte} />
                          </div>
                          <button 
                            onClick={() => setModalConfirm({ isOpen: true, id: ativo.id, tipo: 'ativo', grupoId: grupo.id })}
                            className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t border-[#1e293b] p-4 bg-[#0b1120]/50">
                <button 
                  onClick={() => { setGrupoSelecionado(grupo.id); setModalAtivo(true); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors"
                >
                  <Plus size={16} />
                  <span>Adicionar Ativo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {grupos.length > 0 && (
        <div className="flex justify-end pt-4">
          <button 
            onClick={() => {
              startTransition(async () => {
                try {
                  await syncData(grupos)
                  const refreshed = await fetchInitialData()
                  setGrupos(refreshed as any)
                  setToast('Salvo com sucesso!')
                  setTimeout(() => setToast(null), 3000)
                } catch (e) {
                  setToast('Erro ao salvar!')
                  setTimeout(() => setToast(null), 3000)
                }
              })
            }}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      )}

      {/* OVERLAYS (MODALS) */}
      
      {/* Modal Grupo */}
      {modalGrupo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1e293b] p-4">
              <h3 className="font-semibold text-slate-200">Novo Grupo</h3>
              <button onClick={() => setModalGrupo(false)} className="text-slate-500 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleAdicionarGrupo} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome do Grupo</label>
                <input 
                  autoFocus
                  required
                  value={novoGrupoNome}
                  onChange={e => setNovoGrupoNome(e.target.value)}
                  placeholder="Ex: Futuros, Ações BR..."
                  className="w-full rounded-xl border border-[#1e293b] bg-[#0b1120] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
                Criar Grupo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ativo */}
      {modalAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1e293b] p-4">
              <h3 className="font-semibold text-slate-200">Adicionar Ativo</h3>
              <button onClick={() => setModalAtivo(false)} className="text-slate-500 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleAdicionarAtivo} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Código (Ticker)</label>
                  <input 
                    autoFocus
                    required
                    value={novoAtivo.codigo}
                    onChange={e => setNovoAtivo({ ...novoAtivo, codigo: e.target.value })}
                    placeholder="Ex: PETR4.SA"
                    className="w-full rounded-xl border border-[#1e293b] bg-[#0b1120] px-4 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Fonte de Dados</label>
                  <select
                    value={novoAtivo.fonte}
                    onChange={e => setNovoAtivo({ ...novoAtivo, fonte: e.target.value as 'yahoo'|'tradingview' })}
                    className="w-full rounded-xl border border-[#1e293b] bg-[#0b1120] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none appearance-none"
                  >
                    <option value="yahoo">Yahoo Finance</option>
                    <option value="tradingview">TradingView</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome do Ativo</label>
                <input 
                  required
                  value={novoAtivo.nome}
                  onChange={e => setNovoAtivo({ ...novoAtivo, nome: e.target.value })}
                  placeholder="Ex: Petrobras PN"
                  className="w-full rounded-xl border border-[#1e293b] bg-[#0b1120] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors mt-2">
                Salvar Ativo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {modalConfirm?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-2xl overflow-hidden p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-400 mb-6">
              Tem certeza que deseja excluir este {modalConfirm.tipo}? Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setModalConfirm(null)}
                className="flex-1 rounded-xl bg-[#1e293b] py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRemover}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <Save size={16} />
          </div>
          <span className="text-sm font-semibold text-slate-200">{toast}</span>
        </div>
      )}
    </div>
  )
}
