import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Top Bar block with nothing
top_bar_regex = r'\s*{\s*/\*\s*Top Bar\s*\*/\s*}\s*<div className="flex flex-col items-center pb-2 mb-3 shrink-0">.*?</div>\s*</div>'
content = re.sub(top_bar_regex, '', content, flags=re.DOTALL)

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
