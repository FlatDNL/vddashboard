'use client'

import { Maximize2 } from 'lucide-react'

export function SuperDOMButton() {
  const openSuperDOM = () => {
    // Abre uma nova janela sem navegação e redimensionada
    window.open(
      '/superdom',
      'SuperDOM',
      'width=380,height=750,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
    )
  }

  return (
    <button 
      onClick={openSuperDOM}
      className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
      title="Abrir Super DOM"
    >
      <Maximize2 className="h-3.5 w-3.5" />
      <span>Super DOM</span>
    </button>
  )
}
