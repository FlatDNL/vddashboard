import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export const dynamic = 'force-dynamic'

let cachedMt5Quote: { data: any; ts: number } | null = null

async function queryMt5Direct() {
  if (cachedMt5Quote && Date.now() - cachedMt5Quote.ts < 800) {
    return cachedMt5Quote.data
  }
  try {
    const pyCode = [
      'import json, MetaTrader5 as mt5, master_fluxo_ia',
      'if not mt5.initialize(): raise SystemExit(1)',
      'sym = master_fluxo_ia.detectar_simbolo_ativo()',
      'mt5.symbol_select(sym, True)',
      'tick = mt5.symbol_info_tick(sym)',
      'price = float(tick.last if tick and tick.last > 0 else (tick.bid if tick else 0))',
      'bid = float(tick.bid if tick else price)',
      'ask = float(tick.ask if tick else price)',
      'fech = float(master_fluxo_ia.obter_fechamento_anterior_mt5(sym))',
      'mt5.shutdown()',
      'print(json.dumps({"online": price > 0, "ativo": sym, "preco_atual": price, "bid": bid, "ask": ask, "fechamentoAnterior": fech}))'
    ].join('; ')

    const { stdout } = await execFileAsync('python', ['-c', pyCode], {
      cwd: process.cwd(),
      timeout: 3000
    })
    const parsed = JSON.parse(stdout.trim())
    cachedMt5Quote = { data: parsed, ts: Date.now() }
    return parsed
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const statusPath = path.join(process.cwd(), 'fluxo_ia_status.json')
    let fileData: any = null

    if (fs.existsSync(statusPath)) {
      const fileContent = fs.readFileSync(statusPath, 'utf-8')
      fileData = JSON.parse(fileContent)

      // Considera online se o arquivo foi atualizado nos últimos 10 segundos
      const nowSec = Date.now() / 1000
      const diffSec = nowSec - (fileData.updatedAt || 0)
      if (diffSec < 10) {
        return NextResponse.json({
          online: true,
          ...fileData
        })
      }
    }

    // Se o master_fluxo_ia.py não estiver atualizando o JSON, consulta o MetaTrader 5 diretamente
    const directMt5 = await queryMt5Direct()
    if (directMt5 && directMt5.online) {
      return NextResponse.json({
        ...(fileData || {}),
        online: true,
        ativo: directMt5.ativo,
        preco_atual: directMt5.preco_atual,
        bid: directMt5.bid,
        ask: directMt5.ask,
        fechamentoAnterior: directMt5.fechamentoAnterior
      })
    }

    if (fileData) {
      return NextResponse.json({
        online: false,
        ...fileData
      })
    }

    return NextResponse.json({
      online: false,
      estado: 'OFFLINE',
      mensagem: 'Aguardando conexão com o MetaTrader 5'
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
