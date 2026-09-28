import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'profit_bridge.py')
    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'text/x-python',
        'Content-Disposition': 'attachment; filename="profit_bridge.py"'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  }
}
