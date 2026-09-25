import { login } from './actions'
import { Activity } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-[#050B14] overflow-hidden text-white font-sans">
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-900/20 rounded-[100%] blur-[150px]"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Glowing border container */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#1e293b]/80 to-[#0f172a]/90 p-[1px] shadow-[0_0_50px_rgba(30,58,138,0.3)] backdrop-blur-xl">
          <div className="rounded-2xl bg-[#0b1120]/80 p-8 sm:p-12">
            
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                <img src="/logo.png" alt="VDDashboard Logo" className="relative h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-200">
                VDDASHBOARD
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Análise Quântica</span>
              </div>
            </div>
            
            {/* Form */}
            <form className="space-y-5" action={login}>
              <div className="space-y-4">
                <div className="group">
                  <label htmlFor="email" className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 ml-1">Email de Acesso</label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="block w-full rounded-xl border border-[#1e293b] bg-[#0f172a]/50 py-3 px-4 text-sm text-white placeholder-slate-600 transition-all focus:border-blue-500 focus:bg-[#0f172a] focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner group-hover:border-slate-700"
                      placeholder="trader@exemplo.com"
                    />
                  </div>
                </div>
                
                <div className="group">
                  <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
                    <label htmlFor="password" className="block text-[11px] uppercase tracking-wider text-slate-400">Senha</label>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="block w-full rounded-xl border border-[#1e293b] bg-[#0f172a]/50 py-3 px-4 text-sm text-white placeholder-slate-600 transition-all focus:border-blue-500 focus:bg-[#0f172a] focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner group-hover:border-slate-700"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div className="mt-4 rounded-lg bg-red-900/30 border border-red-900/50 p-3 text-center">
                  <p className="text-xs text-red-400">{message}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="relative flex w-full justify-center overflow-hidden rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Autenticar <Activity size={16} />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 transition-opacity hover:opacity-100"></div>
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Acesso Restrito</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
