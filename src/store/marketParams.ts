import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MarketParamsState {
  manualFechamento: number | null
  manualDxyPct: number | null
  fechamentoAnteriorReal: number | null
  lastUpdated: string | null
  setManualParams: (fechamento: number | null, dxyPct: number | null, fechamentoReal?: number | null, lastUpd?: string | null) => void
}

export const useMarketParamsStore = create<MarketParamsState>()(
  persist(
    (set) => ({
      manualFechamento: null,
      manualDxyPct: null,
      fechamentoAnteriorReal: null,
      lastUpdated: null,
      setManualParams: (fechamento, dxyPct, fechamentoReal = null, lastUpd = null) => set((state) => ({ 
        manualFechamento: fechamento, 
        manualDxyPct: dxyPct,
        fechamentoAnteriorReal: fechamentoReal !== null ? fechamentoReal : state.fechamentoAnteriorReal,
        lastUpdated: lastUpd !== null ? lastUpd : state.lastUpdated
      })),
    }),
    { name: 'market-params-storage' }
  )
)
