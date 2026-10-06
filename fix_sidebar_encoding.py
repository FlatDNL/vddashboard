import json

with open('src/components/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken text
content = content.replace("Calendǭrio Econmico", "Calendário Econômico")
content = content.replace("Gestǜo", "Gestão")
content = content.replace("Configuraões", "Configurações")
content = content.replace("Aprovaões", "Aprovações")
content = content.replace("Sessǜo", "Sessão")

with open('src/components/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
