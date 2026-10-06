import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. We need to move the Dollar card inside the Left Column.
# Find the start of Dollar card
dollar_card_regex = r'(\s*{/\* ROW 2: Dólar \(Full Width\) \*/}\s*<div className="bg-\[\#1c1c1c\].*?</div>\s*</div>)'
dollar_match = re.search(dollar_card_regex, content, re.DOTALL)
dollar_card = dollar_match.group(1) if dollar_match else ""

# Remove Dollar card from its current position
content = content.replace(dollar_card, "")

# Now find the start of the Left Column
left_col_start = r'(\s*{/\* Left Column \*/}\s*<div className="col-span-12 lg:col-span-8 flex flex-col gap-3 min-h-0">)'
left_col_match = re.search(left_col_start, content)

if left_col_match:
    # Insert Dollar card right after the start of Left Column
    insertion_point = left_col_match.end()
    
    # We also want to modify the Dollar card to make it smaller.
    modified_dollar = dollar_card.replace('ROW 2: Dólar (Full Width)', 'Dólar (Now inside left col)')
    modified_dollar = modified_dollar.replace('p-6', 'p-3 px-5')
    modified_dollar = modified_dollar.replace('text-7xl', 'text-5xl')
    modified_dollar = modified_dollar.replace('big', '') # Remove the big prop from ValChange if it's there
    modified_dollar = modified_dollar.replace('text-xl', 'text-lg')
    modified_dollar = modified_dollar.replace('<div className="w-24"></div>', '') # Remove spacer
    
    content = content[:insertion_point] + modified_dollar + content[insertion_point:]

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
