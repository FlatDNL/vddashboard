import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make Risco Global thinner
content = content.replace(
    '<div className="p-5 flex flex-col justify-center flex-1">',
    '<div className="p-3 px-4 flex flex-col justify-center flex-1">'
)

content = content.replace(
    '<div className="flex items-baseline justify-between mb-2">',
    '<div className="flex items-center justify-between">'
)

content = content.replace(
    'text-3xl font-bold',
    'text-2xl font-bold'
)

content = content.replace(
    '<div className="border-t border-[#333] w-full my-3"></div>',
    '<div className="border-t border-[#333] w-full my-2.5"></div>'
)

# And in RiskBar, make sure text is thin and small
content = content.replace(
    '<div className="flex flex-col">',
    '<div className="flex flex-col leading-tight">'
)

# Actually, the user might want ALL cards thinner to save space? 
# "deixe esses cards mais finos". They explicitly showed a screenshot of Risco Global and Risco Brasil.
# I will also slightly tighten the main grid gap if possible, or just the paddings.

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
