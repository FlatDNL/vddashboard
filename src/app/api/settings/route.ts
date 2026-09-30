import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Save to Supabase if authenticated
    if (user) {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        profit_ticker: data.profitTicker,
        gemini_api_key: data.geminiKey,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
    }

    // Also save to local disk for the Python bridge to read instantly
    const configPath = path.join(process.cwd(), 'profit_config.json')
    let existingConfig: Record<string, any> = {}
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let dbSettings = null
    if (user) {
      const { data } = await supabase
        .from('user_settings')
        .select('profit_ticker, gemini_api_key')
        .eq('user_id', user.id)
        .single()
      dbSettings = data
    }

    // Try reading from disk as fallback
    const configPath = path.join(process.cwd(), 'profit_config.json')
    let diskSettings: Record<string, any> = {}
    if (fs.existsSync(configPath)) {
      try {
        diskSettings = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      } catch (e) {}
    }

    // Sync disk with DB if DB exists but disk is outdated
    if (dbSettings && dbSettings.profit_ticker && dbSettings.profit_ticker !== diskSettings.profitTicker) {
      diskSettings.profitTicker = dbSettings.profit_ticker
      if (dbSettings.gemini_api_key) diskSettings.geminiKey = dbSettings.gemini_api_key
      fs.writeFileSync(configPath, JSON.stringify(diskSettings, null, 2))
    }
    
    return NextResponse.json(dbSettings ? { profitTicker: dbSettings.profit_ticker, geminiKey: dbSettings.gemini_api_key } : diskSettings)
  } catch (error) {
    return NextResponse.json({}, { status: 500 })
  }
}
