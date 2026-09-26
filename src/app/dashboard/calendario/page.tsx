import { EconomicCalendarWidget } from '@/components/EconomicCalendarWidget'

export default function CalendarioPage() {
  return (
    <div className="flex flex-col gap-6 h-full pb-10 overflow-y-auto">
      <div className="w-full">
        <EconomicCalendarWidget />
      </div>
    </div>
  )
}
