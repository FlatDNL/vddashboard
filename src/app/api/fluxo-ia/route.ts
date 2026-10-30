import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const statusPath = path.join(process.cwd(), 'fluxo_ia_status.json')

    if (!fs.existsSync(statusPath)) {
      return NextResponse.json({
        online: false,
        estado: 'OFFLINE',
        mensagem: 'Aguardando inicialização do master_fluxo_ia.py'
      })
    }

    const fileContent = fs.readFileSync(statusPath, 'utf-8')
    const data = JSON.parse(fileContent)

    // Considera online se o arquivo foi atualizado nos últimos 10 segundos
    const nowSec = Date.now() / 1000
    const diffSec = nowSec - (data.updatedAt || 0)
    const isOnline = diffSec < 10

    return NextResponse.json({
      online: isOnline,
      ...data
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        online: false,
        estado: 'OFFLINE',
        error: error.message
      },
      { status: 500 }
    )
  }
}
