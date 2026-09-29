import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MarketParamsState {
  manualFechamento: number | null
  manualDxyPct: number | null
  setManualParams: (fechamento: number | null, dxyPct: number | null) => void
}

export const useMarketParamsStore = create<MarketParamsState>()(
  persist(
    (set) => ({
      manualFechamento: null,
      manualDxyPct: null,
      setManualParams: (fechamento, dxyPct) => set({ manualFechamento: fechamento, manualDxyPct: dxyPct }),
    }),
    { name: 'market-params-storage' }
  )
)
