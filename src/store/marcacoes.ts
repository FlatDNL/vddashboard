import { create } from 'zustand'

export type Importancia = 'Baixa' | 'Média' | 'Alta'

export interface Marcacao {
  id: string
  preco: number
  descricao: string
  importancia: Importancia
}

interface MarcacoesState {
  marcacoes: Marcacao[]
  setMarcacoes: (marcacoes: Marcacao[]) => void
  addMarcacoes: (marcacoes: Marcacao[]) => void
  updateMarcacao: (id: string, updates: Partial<Marcacao>) => void
}

export const useMarcacoesStore = create<MarcacoesState>((set) => ({
  marcacoes: [],
  setMarcacoes: (marcacoes) => set({ marcacoes: [...marcacoes].sort((a, b) => b.preco - a.preco) }),
  addMarcacoes: (novas) => set((state) => {
    const todas = [...state.marcacoes, ...novas]
    return { marcacoes: todas.sort((a, b) => b.preco - a.preco) }
  }),
  updateMarcacao: (id, updates) => set((state) => {
    const marcacoesAtualizadas = state.marcacoes.map(m => 
      m.id === id ? { ...m, ...updates } : m
    )
    return { marcacoes: marcacoesAtualizadas.sort((a, b) => b.preco - a.preco) }
  })
}))
