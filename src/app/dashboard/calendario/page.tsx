import { EconomicCalendarWidget } from '@/components/EconomicCalendarWidget'

export default function CalendarioPage() {
  return (
    <div className="flex flex-col gap-6 h-full pb-10 overflow-y-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-white tracking-wide">Calendário Econômico</h1>
        <p className="text-xs text-slate-400">
          Acompanhe ao vivo todos os indicadores, relatórios e notícias econômicas de alto impacto no Dólar (USD/BRL).
        </p>
      </div>

      <div className="w-full">
        <EconomicCalendarWidget />
      </div>
    </div>
  )
}
