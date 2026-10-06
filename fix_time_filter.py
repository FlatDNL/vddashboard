import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the news filter logic with a more robust one
old_logic = '''        // News (now Events)
        const eventsList = calendarData?.events || []
        const now = new Date()
        const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
        const upcomingEvents = eventsList.filter((e: any) => e.time >= currentTime)
        setNews(upcomingEvents.slice(0, 15)) // Top 15 upcoming events'''

new_logic = '''        // News (now Events)
        const eventsList = calendarData?.events || []
        const now = new Date()
        const hh = String(now.getHours()).padStart(2, '0')
        const mm = String(now.getMinutes()).padStart(2, '0')
        const currentTime = `${hh}:${mm}`
        
        // Ensure we parse time safely, assuming format "HH:MM"
        const upcomingEvents = eventsList.filter((e: any) => {
          if (!e.time || typeof e.time !== 'string') return false
          const timeStr = e.time.trim()
          return timeStr >= currentTime
        })
        setNews(upcomingEvents.slice(0, 15)) // Top 15 upcoming events'''

content = content.replace(old_logic, new_logic)

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
