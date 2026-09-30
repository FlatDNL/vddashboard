import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const configPath = path.join(process.cwd(), 'profit_config.json')
    
    let existingConfig = {}
    if (fs.existsSync(configPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      } catch (e) {}
    }
    
    const newConfig = { ...existingConfig, ...data }
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'profit_config.json')
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8')
      return NextResponse.json(JSON.parse(data))
    }
    return NextResponse.json({})
  } catch (error) {
    return NextResponse.json({}, { status: 500 })
  }
}
