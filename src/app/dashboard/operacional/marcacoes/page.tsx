'use client'

import { useState, useEffect, useTransition } from 'react'
import { fetchMarcacoes, syncMarcacoes } from './actions'
import { Save, Loader2, Plus, Calculator } from 'lucide-react'
import { useMarcacoesStore, Importancia, Marcacao } from '@/store/marcacoes'
import { useMarketParamsStore } from '@/store/marketParams'

export default function MarcacoesPage() {
  const { marcacoes, setMarcacoes, updateMarcacao } = useMarcacoesStore()
  const { manualFechamento, manualDxyPct, setManualParams } = useMarketParamsStore()
  
  const [pasteText, setPasteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  // Local state for the inputs to allow typing freely before saving to store
  const [localFechamento, setLocalFechamento] = useState<string>(manualFechamento ? manualFechamento.toString() : '')
  const [localDxy, setLocalDxy] = useState<string>(manualDxyPct ? manualDxyPct.toString() : '')

  useEffect(() => {
    fetchMarcacoes().then(data => {
      setMarcacoes(data as Marcacao[])
      setLoading(false)
    })
  }, [])

  const handlePasteProcess = () => {
    if (!pasteText.trim()) return

    const lines = pasteText.split('\n')
    const novasMarcacoes: Marcacao[] = []

    lines.forEach((line) => {
      const parts = line.split('\t') // O Excel usa tabulação (\t) ao copiar colunas
      if (parts.length >= 2) {
        // Trata o número do Brasil: "5.230,00" -> "5230.00"
        let rawPrice = parts[0].trim().replace(/\./g, '').replace(',', '.')
        const preco = parseFloat(rawPrice)
        const descricao = parts[1].trim()
        
        let importancia: Importancia = 'Média'
        if (parts.length >= 3) {
          const imp = parts[2].trim().toLowerCase()
          if (imp.includes('alta')) importancia = 'Alta'
          if (imp.includes('baixa')) importancia = 'Baixa'
        }

        if (!isNaN(preco) && descricao) {
          novasMarcacoes.push({
            id: 'temp_' + Math.random().toString(36).substring(7),
            preco,
            descricao,
            importancia
          })
        }
      }
    })

    setMarcacoes([...marcacoes, ...novasMarcacoes])
    setPasteText('')
  }

  const handleDelete = (id: string) => {
    setMarcacoes(marcacoes.filter(m => m.id !== id))
  }

  const handleSaveParams = () => {
    const fechamento = localFechamento ? parseFloat(localFechamento.replace(',', '.')) : null
    const dxy = localDxy ? parseFloat(localDxy.replace(',', '.')) : null
    setManualParams(fechamento, dxy)
    setToast('Parâmetros salvos e aplicados no SuperDOM!')
    setTimeout(() => setToast(null), 3000)
  }

  const handleClearParams = () => {
    setLocalFechamento('')
    setLocalDxy('')
    setManualParams(null, null)
    setToast('Parâmetros zerados. Usando dados do Yahoo.')
    setTimeout(() => setToast(null), 3000)
  }

  const getColor = (imp: Importancia) => {
    switch (imp) {
      case 'Alta': return 'text-red-500'
      case 'Média': return 'text-yellow-500'
      case 'Baixa': return 'text-blue-500'
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span>Carregando marcações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto scrollbar-hide pb-10 relative text-slate-200">
      
      {/* Botões do Topo e Toast */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Marcações</h1>
        <div className="flex items-center gap-4">
          {toast && (
            <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg transition-all animate-in fade-in slide-in-from-right-4">
              {toast}
            </span>
          )}
          <button 
            onClick={() => {
              startTransition(async () => {
                try {
                  await syncMarcacoes(marcacoes)
                  const refreshed = await fetchMarcacoes()
                  setMarcacoes(refreshed as Marcacao[])
                  setToast('Marcações salvas com sucesso!')
                  setTimeout(() => setToast(null), 3000)
                } catch (e) {
                  console.error(e)
                }
              })
            }}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Grid: Params e Importação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Container de Parâmetros Manuais */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4 text-emerald-400">
            <Calculator size={20} />
            <h2 className="text-lg font-semibold">Cálculo de Abertura (Frajola)</h2>
          </div>
          <p className="text-sm text-slate-500 mb-5">
            Preencha os dados do Profit para o sistema calcular o Justo e Justíssimo exatos. 
            Se deixar em branco, o sistema usará a base atrasada do Yahoo Finance.
          </p>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Fechamento Anterior</label>
              <input 
                type="text" 
                value={localFechamento}
                onChange={(e) => setLocalFechamento(e.target.value)}
                placeholder="Ex: 5202.5"
                className="w-full bg-[#0b1120] border border-[#1e293b] rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Variação DXY (%)</label>
              <input 
                type="text" 
                value={localDxy}
                onChange={(e) => setLocalDxy(e.target.value)}
                placeholder="Ex: -0.15"
                className="w-full bg-[#0b1120] border border-[#1e293b] rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-5">
            <button 
              onClick={handleSaveParams}
              className="flex-1 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 hover:text-white transition-all"
            >
              Aplicar no SuperDOM
            </button>
            <button 
              onClick={handleClearParams}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Container de Importação Rápida */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Importação do Excel</h2>
              <p className="text-sm text-slate-500 mt-1">
                <strong>Preço | Descrição | Importância</strong>
              </p>
            </div>
            <button 
              onClick={handlePasteProcess}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500"
            >
              Processar Dados
            </button>
          </div>
          <textarea 
            className="w-full flex-1 bg-[#0b1120] border border-[#1e293b] rounded-xl p-3 text-sm font-mono text-slate-300 focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
            placeholder="5230,00&#9;Suporte Diário&#9;Alta&#10;5240,00&#9;VWAP&#9;&#9;Média"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
        </div>

      </div>

      {/* Tabela de Marcações */}
      <div className="flex-1 rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#131d33] px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-200">Marcações Cadastradas ({marcacoes.length})</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const id = 'temp_' + Date.now()
                setMarcacoes([{ id, preco: 5000, descricao: 'Nova Marcação', importancia: 'Média' }, ...marcacoes])
              }}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus size={16} /> Adicionar Manual
            </button>
            <button 
              onClick={() => setMarcacoes([])}
              className="text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Limpar Tudo
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 bg-[#0b1120]">
          {marcacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <div className="h-16 w-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">M</span>
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">Nenhuma marcação</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Cole os dados do Excel acima para preencher suas marcações operacionais.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-[#131d33] text-slate-400 sticky top-0 border-b border-[#1e293b]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Preço</th>
                  <th className="px-6 py-4 font-semibold">Descrição</th>
                  <th className="px-6 py-4 font-semibold">Importância</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {marcacoes.map((m) => (
                  <tr key={m.id} className="hover:bg-[#131d33]/50 transition-colors group">
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        step="0.5"
                        value={m.preco}
                        onChange={(e) => updateMarcacao(m.id, { preco: parseFloat(e.target.value) || 0 })}
                        className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 w-28 text-slate-200 font-mono font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-inner"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="text" 
                        value={m.descricao}
                        onChange={(e) => updateMarcacao(m.id, { descricao: e.target.value })}
                        className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 w-full text-slate-200 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-inner"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select 
                        value={m.importancia}
                        onChange={(e) => updateMarcacao(m.id, { importancia: e.target.value as Importancia })}
                        className={`bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 w-32 font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer transition-all shadow-inner ${getColor(m.importancia)}`}
                      >
                        <option value="Baixa" className="text-blue-500 font-bold">Baixa</option>
                        <option value="Média" className="text-yellow-500 font-bold">Média</option>
                        <option value="Alta" className="text-red-500 font-bold">Alta</option>
                      </select>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => handleDelete(m.id)} 
                        className="text-red-500/80 hover:text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-md transition-colors font-medium"
                        title="Remover"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

