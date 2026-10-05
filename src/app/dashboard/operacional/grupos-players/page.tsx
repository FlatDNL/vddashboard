'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Shield, Building2, UserCheck, RefreshCw, Edit2, AlertCircle } from 'lucide-react'

type PlayerGroup = {
  id: string
  name: string
  color: string
  description: string
}

type BrokerMapping = {
  id: string
  broker_id: number
  broker_name: string
  group_id: string
}

const COMMON_BROKERS = [
  { id: 3, name: 'XP' },
  { id: 8, name: 'BTG' },
  { id: 16, name: 'UBS' },
  { id: 17, name: 'Merrill' },
  { id: 27, name: 'Santander Institucional' },
  { id: 39, name: 'Safra' },
  { id: 49, name: 'Morgan' },
  { id: 72, name: 'Bradesco' },
  { id: 73, name: 'Ideal' },
  { id: 85, name: 'BGC Liquidez' },
  { id: 92, name: 'Goldman Sachs' },
  { id: 108, name: 'Credit Suisse' },
  { id: 114, name: 'Itaú' },
  { id: 120, name: 'Genial' },
  { id: 147, name: 'Ativa' },
  { id: 308, name: 'Rico' },
  { id: 1202, name: 'Nova Futura' }
]

export default function GruposPlayersPage() {
  const [groups, setGroups] = useState<PlayerGroup[]>([])
  const [mappings, setMappings] = useState<BrokerMapping[]>([])
  const [loading, setLoading] = useState(true)

  // Novo grupo form state
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6')
  const [newGroupDesc, setNewGroupDesc] = useState('')

  // Novo mapeamento form state
  const [brokerName, setBrokerName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/player-groups')
      const data = await res.json()
      if (data.groups) setGroups(data.groups)
      if (data.mappings) setMappings(data.mappings)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      const res = await fetch('/api/player-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_GROUP',
          payload: { name: newGroupName, color: newGroupColor, description: newGroupDesc }
        })
      })

      if (res.ok) {
        setNewGroupName('')
        setNewGroupDesc('')
        fetchData()
      } else {
        const errData = await res.json()
        alert(`Erro ao criar grupo: ${errData.error || 'Erro desconhecido'}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo? As corretoras vinculadas ficarão desassociadas.')) return

    try {
      const res = await fetch('/api/player-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_GROUP', payload: { id } })
      })
      if (res.ok) fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brokerName || !selectedGroupId) return

    // Gerar broker_id baseado no hash do nome para manter o onConflict do banco
    const nameUpper = brokerName.trim().toUpperCase()
    let hashId = 0;
    for (let i = 0; i < nameUpper.length; i++) {
      hashId = Math.imul(31, hashId) + nameUpper.charCodeAt(i) | 0;
    }
    const generatedId = Math.abs(hashId);

    try {
      const res = await fetch('/api/player-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPSERT_MAPPING',
          payload: {
            broker_id: generatedId,
            broker_name: brokerName.trim(),
            group_id: selectedGroupId
          }
        })
      })

      if (res.ok) {
        setBrokerName('')
        fetchData()
      } else {
        const errData = await res.json()
        alert(`Erro ao vincular: ${errData.error || 'Desconhecido'}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteMapping = async (bId: number) => {
    try {
      const res = await fetch('/api/player-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_MAPPING', payload: { broker_id: bId } })
      })
      if (res.ok) fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const selectPresetBroker = (name: string) => {
    setBrokerName(name)
  }

  return (
    <div className="flex flex-col gap-6 text-slate-100 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="text-blue-500" /> Grupos de Players (Corretoras)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre os perfis de atuação no mercado (ex: Estrangeiros, Bancos) e vincule o código das corretoras do Profit.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-[#1e293b] hover:bg-slate-700 text-xs px-4 py-2 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Cadastro e Lista de Grupos */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Criar Grupo */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
            <h2 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-emerald-400" /> Criar Novo Grupo
            </h2>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome do Grupo</label>
                <input
                  type="text"
                  placeholder="Ex: Varejo, Institucionais, Tesouraria"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cor de Identificação no Gráfico</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="h-9 w-12 bg-transparent border-0 cursor-pointer rounded"
                  />
                  <input
                    type="text"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="flex-1 bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Descrição / Notas</label>
                <textarea
                  placeholder="Breve resumo das características deste grupo..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2.5 rounded-xl transition shadow-lg shadow-blue-900/20"
              >
                Salvar Grupo
              </button>
            </form>
          </div>

          {/* Lista de Grupos Existentes */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
            <h2 className="text-md font-semibold text-white mb-4">Grupos Cadastrados ({groups.length})</h2>
            <div className="flex flex-col gap-3">
              {groups.map((group) => {
                const countBrokers = mappings.filter((m) => m.group_id === group.id).length
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1e293b]/50 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: group.color }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">{group.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {countBrokers} corretora(s) vinculada(s)
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 transition"
                      title="Excluir grupo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Painel Direito: Vincular Corretoras aos Grupos */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Form Vincular Corretora */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
            <h2 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-blue-400" /> Associar Corretora a um Grupo
            </h2>

            {/* Sugestões de Corretoras Populares */}
            <div className="mb-4">
              <span className="text-[11px] text-slate-400 block mb-2">Sugestões rápidas de corretoras B3:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_BROKERS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectPresetBroker(b.name)}
                    className="text-[11px] bg-[#1e293b] hover:bg-blue-900/30 hover:border-blue-500/50 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddMapping} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome da Corretora (Exatamente como aparece no Profit)</label>
                <input
                  type="text"
                  placeholder="Ex: XP, UBS, Ideal..."
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Selecione o Grupo</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Escolha --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/20"
                >
                  Vincular Corretora
                </button>
              </div>
            </form>
          </div>

          {/* Tabela de Mapeamento Atual */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h2 className="text-md font-semibold text-white">Mapeamento Atual de Corretoras ({mappings.length})</h2>

            {mappings.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <AlertCircle className="text-slate-600 mb-2" size={24} />
                <p className="text-sm text-slate-400">Nenhuma corretora mapeada ainda.</p>
                <p className="text-xs text-slate-500">
                  Adicione as corretoras para que o motor Python saiba em qual grupo computar o saldo de agressão.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#1e293b]/60 text-xs text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Nome da Corretora no Profit</th>
                      <th className="px-4 py-3">Grupo Associado</th>
                      <th className="px-4 py-3 text-right rounded-r-xl">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/40">
                    {mappings.map((m) => {
                      const group = groups.find((g) => g.id === m.group_id)
                      return (
                        <tr key={m.id} className="hover:bg-[#1e293b]/30 transition">
                          <td className="px-4 py-3 font-medium text-slate-200">{m.broker_name}</td>
                          <td className="px-4 py-3">
                            {group ? (
                              <span
                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: `${group.color}25`, border: `1px solid ${group.color}60`, color: group.color }}
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                                {group.name}
                              </span>
                            ) : (
                              <span className="text-xs text-red-400">Sem Grupo</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteMapping(m.broker_id)}
                              className="text-slate-500 hover:text-red-400 p-1 transition"
                              title="Remover vinculo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
