import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Filter out past events
old_news_logic = '''        // News (now Events)
        const eventsList = calendarData?.events || []
        setNews(eventsList.slice(0, 8)) // Top 8 events'''

new_news_logic = '''        // News (now Events)
        const eventsList = calendarData?.events || []
        const now = new Date()
        const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
        const upcomingEvents = eventsList.filter((e: any) => e.time >= currentTime)
        setNews(upcomingEvents.slice(0, 15)) // Top 15 upcoming events'''

content = content.replace(old_news_logic, new_news_logic)

# 2. Compact the table UI
# Find the <td> tags with py-3 and replace with py-1
content = content.replace(
'''                              <td className="py-3 px-1 text-gray-400">{item.time}</td>
                              <td className="py-3 px-1 text-center">{item.country === 'US' ? '🇺🇸' : item.country === 'BR' ? '🇧🇷' : item.country}</td>
                              <td className="py-3 px-1 text-gray-300 truncate max-w-[200px]" title={item.title}>{item.title}</td>
                              <td className={`py-3 px-1 ${impactColor}`}>{impactText}</td>
                              <td className="py-3 px-1 text-right text-gray-200">{item.actual !== '-' ? item.actual : ''}</td>''',
'''                              <td className="py-1 px-1 text-gray-400">{item.time}</td>
                              <td className="py-1 px-1 text-center">{item.country === 'US' ? '🇺🇸' : item.country === 'BR' ? '🇧🇷' : item.country}</td>
                              <td className="py-1 px-1 text-gray-300 truncate max-w-[200px]" title={item.title}>{item.title}</td>
                              <td className={`py-1 px-1 ${impactColor}`}>{impactText}</td>
                              <td className="py-1 px-1 text-right text-gray-200">{item.actual !== '-' ? item.actual : ''}</td>'''
)

# And make the table header more compact
content = content.replace(
'''                        <tr className="text-gray-500 border-b border-[#333]">
                          <th className="py-2 px-1 font-normal">HORA</th>''',
'''                        <tr className="text-gray-500 border-b border-[#333]">
                          <th className="py-1 px-1 font-normal">HORA</th>'''
)
content = content.replace('<th className="py-2 px-1', '<th className="py-1 px-1')

# And add leading-none to the row
content = content.replace(
'''<tr key={i} className="border-b border-[#222] hover:bg-[#333] transition-colors">''',
'''<tr key={i} className="border-b border-[#222] hover:bg-[#333] transition-colors leading-tight">'''
)

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
