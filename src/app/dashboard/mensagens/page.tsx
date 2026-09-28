'use client'

import { useEffect, useState, useTransition } from 'react'
import { getMensagens, approveUser, rejectUser } from './actions'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

type Mensagem = {
  id: string
  remetente: string
  titulo: string
  conteudo: string
  tipo: string
  referencia_id: string
  lida: boolean
  acao_realizada: boolean
  created_at: string
}

export default function MensagensPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getMensagens().then(data => {
      setMensagens(data as Mensagem[])
      setLoading(false)
    })
  }, [])

  const handleApprove = (msgId: string, userId: string) => {
    startTransition(async () => {
      await approveUser(msgId, userId)
      setMensagens(await getMensagens() as Mensagem[])
    })
  }

  const handleReject = (msgId: string, userId: string) => {
    startTransition(async () => {
      await rejectUser(msgId, userId)
      setMensagens(await getMensagens() as Mensagem[])
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full text-slate-200">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="text-blue-500" /> Gerenciador de Mensagens
        </h1>
      </div>

      <div className="flex-1 bg-[#1e293b] rounded-2xl border border-[#1e293b] shadow-lg p-5 overflow-y-auto">
        {mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Mail size={48} className="mb-4 opacity-20" />
            <p>Sua caixa de entrada está vazia.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mensagens.map(msg => (
              <div 
                key={msg.id} 
                className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-xl border ${
                  !msg.lida ? 'bg-[#131d33] border-blue-500/30' : 'bg-[#0b1120] border-[#1e293b]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-slate-200">{msg.titulo}</span>
                    {!msg.lida && (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-blue-500/20 text-blue-400">
                        Nova
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{msg.conteudo}</p>
                  <p className="text-xs text-slate-500 mt-2 font-mono">{new Date(msg.created_at).toLocaleString()}</p>
                </div>

                <div className="mt-4 md:mt-0 flex gap-2">
                  {msg.tipo === 'APPROVAL_REQUEST' && !msg.acao_realizada ? (
                    <>
                      <button
                        onClick={() => handleApprove(msg.id, msg.referencia_id)}
                        disabled={isPending}
                        className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle size={16} /> Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(msg.id, msg.referencia_id)}
                        disabled={isPending}
                        className="flex items-center gap-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <XCircle size={16} /> Rejeitar
                      </button>
                    </>
                  ) : msg.tipo === 'APPROVAL_RESOLVED' ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-sm font-medium">
                      <CheckCircle size={16} /> Aprovado
                    </span>
                  ) : msg.tipo === 'APPROVAL_REJECTED' ? (
                    <span className="text-red-400 flex items-center gap-1 text-sm font-medium">
                      <XCircle size={16} /> Rejeitado
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
