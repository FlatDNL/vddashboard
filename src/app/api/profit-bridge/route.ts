import { NextResponse } from 'next/server'
import { exec, spawn } from 'child_process'
import net from 'net'
import path from 'path'
import fs from 'fs'

function checkPort(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const statusPath = path.join(process.cwd(), 'profit_status.json')
      if (fs.existsSync(statusPath)) {
        const fileData = fs.readFileSync(statusPath, 'utf8')
        const json = JSON.parse(fileData)
        // Se o arquivo foi atualizado nos últimos 5 segundos
        if (Date.now() / 1000 - json.updatedAt < 5) {
          resolve(true)
          return
        }
      }
      resolve(false)
    } catch (e) {
      resolve(false)
    }
  })
}

function killPort8080(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('taskkill /F /FI "WINDOWTITLE eq Profit Bridge*"', () => {
      exec('netstat -ano | findstr :8080', (err, stdout) => {
        if (err || !stdout) {
          try {
            const statusPath = path.join(process.cwd(), 'profit_status.json')
            if (fs.existsSync(statusPath)) fs.unlinkSync(statusPath)
          } catch (e) {}
          resolve(true)
          return
        }
        
        const lines = stdout.trim().split('\n')
        const pids = new Set<string>()
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/)
          const pid = parts[parts.length - 1]
          if (pid && pid !== '0') pids.add(pid)
        })

        if (pids.size === 0) {
          resolve(true)
          return
        }

        const killCmds = Array.from(pids).map(pid => `taskkill /F /PID ${pid}`).join(' & ')
        exec(killCmds, () => {
          try {
            const statusPath = path.join(process.cwd(), 'profit_status.json')
            if (fs.existsSync(statusPath)) fs.unlinkSync(statusPath)
          } catch (e) {}
          resolve(true)
        })
      })
    })
  })
}

export async function GET() {
  try {
    const isRunning = await checkPort(8080, '127.0.0.1')
    
    if (!isRunning) {
      return NextResponse.json({ running: false, profitConnected: false })
    }

    try {
      const statusPath = path.join(process.cwd(), 'profit_status.json')
      
      if (fs.existsSync(statusPath)) {
        const fileData = fs.readFileSync(statusPath, 'utf8')
        const json = JSON.parse(fileData)
        
        if (Date.now() / 1000 - json.updatedAt < 10) {
          return NextResponse.json({
            running: true,
            profitConnected: json.profitConnected,
            platform: json.platform,
            asset: json.asset,
            fechamentoAnterior: json.fechamentoAnterior,
            ajusteAnterior: json.ajusteAnterior
          })
        }
      }
    } catch (e) {}

    return NextResponse.json({ running: true, profitConnected: false })
  } catch (error: any) {
    return NextResponse.json({ running: false, profitConnected: false })
  }
}

export async function POST() {
  try {
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, 'profit_bridge.py')
    
    let pythonCmd = 'python'
    const specificPython = 'C:\\Users\\daniel.reis\\AppData\\Local\\Programs\\Python\\Python313\\python.exe'
    if (fs.existsSync(specificPython)) {
      pythonCmd = specificPython
    }
    
    const command = `cmd.exe /c start "Profit Bridge" cmd.exe /k "${pythonCmd}" "${scriptPath}"`
    
    exec(command, { cwd: projectRoot }, (error) => {
      if (error) {
        console.error('Erro ao executar profit_bridge via CMD:', error)
      }
    })

    return NextResponse.json({ success: true, message: 'Servidor Python sendo iniciado...' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await killPort8080()
    return NextResponse.json({ success: true, message: 'Servidor Python encerrado.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
