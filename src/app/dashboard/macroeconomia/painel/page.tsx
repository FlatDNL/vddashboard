import { fetchInitialData } from '../cadastro/actions'
import { PanelGrid } from './PanelGrid'

export default async function PainelDeAtivosPage() {
  const grupos: any = await fetchInitialData()

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <PanelGrid grupos={grupos} />
    </div>
  )
}
