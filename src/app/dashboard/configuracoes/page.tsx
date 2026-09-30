"use client"

import { useState, useEffect } from 'react'
import { Save, Key, CheckCircle, Bot, Play, XCircle, Download } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [geminiKey, setGeminiKey] = useState('')
  const [profitTicker, setProfitTicker] = useState('WDOZ26')
  const [saved, setSaved] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null)

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key')
    if (key) setGeminiKey(key)
    
    const ticker = localStorage.getItem('profit_ticker')
    if (ticker) setProfitTicker(ticker)
  }, [])

  const handleSave = async () => {
    localStorage.setItem('gemini_api_key', geminiKey)
    localStorage.setItem('profit_ticker', profitTicker)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profitTicker, geminiKey })
      })
    } catch (e) {
      console.error('Falha ao salvar configurações no servidor', e)
    }
  }

  const handleTest = async () => {
    if (!geminiKey) {
      setTestResult({ success: false, message: 'Insira o token antes de testar.' })
      return
    }
    
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKey })
      })
      const data = await res.json()
      setTestResult({ success: data.success, message: data.message })
    } catch (error: any) {
      setTestResult({ success: false, message: 'Erro de conexão com o servidor.' })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between bg-[#0f172a] p-6 rounded-2xl border border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Configurações do Sistema</h1>
          <p className="text-sm text-slate-400">
            Ajustes globais, integrações e inteligência artificial.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco de IA */}
        <div className="bg-[#0f172a] p-6 rounded-2xl border border-[#1e293b] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
            <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Bot className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Inteligência Artificial</h2>
              <p className="text-xs text-slate-400">Integração com o Google Gemini para análise macroeconômica.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Key size={14} className="text-slate-400" /> API Token do Gemini (Google AI)
            </label>
            <input
              type="password"
              placeholder="Cole sua chave (AIzaSy...)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Com o token configurado, a aba de Visão Geral passará a usar IA para classificar a pressão do WDO com alta assertividade.
            </p>
          </div>

          {testResult && (
            <div className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 mt-1 ${testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {testResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {testResult.message}
            </div>
          )}

          <div className="mt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle size={16} /> Salvo!
                </>
              ) : (
                <>
                  <Save size={16} /> Salvar Integração
                </>
              )}
            </button>

            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 px-6 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin"></div>
                  Testando...
                </span>
              ) : (
                <>
                  <Play size={16} /> Testar Token
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Bloco do Profit Pro */}
        <div className="bg-[#0f172a] p-6 rounded-2xl border border-[#1e293b] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Bot className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Integração Profit Pro</h2>
              <p className="text-xs text-slate-400">Ativo para envio de dados em Tempo Real na Régua.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Key size={14} className="text-slate-400" /> Cógido do Contrato WDO
            </label>
            <input
              type="text"
              placeholder="Ex: WDOZ26"
              value={profitTicker}
              onChange={(e) => setProfitTicker(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600 uppercase"
            />
            <p className="text-xs text-slate-500 mt-1">
              Coloque o contrato de mini dólar atual. Este valor será enviado automaticamente para o script Python "profit_bridge.py".
            </p>
          </div>

          <div className="mt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle size={16} /> Salvo!
                </>
              ) : (
                <>
                  <Save size={16} /> Salvar Integração
                </>
              )}
            </button>

            <a
              href="/api/download-bridge"
              download="profit_bridge.py"
              className="flex-1 px-6 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-[#334155]"
            >
              <Download size={16} className="text-blue-400" /> Baixar Script Ponte (.py)
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
