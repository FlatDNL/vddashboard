import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full bg-[#0b1120] text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden p-6 pt-2">
          {children}
        </main>
      </div>
    </div>
  )
}
