import re

with open('src/components/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'Demo', href: '/dashboard/demo'", "'DashBloom', href: '/dashboard/dashbloom'")

with open('src/components/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/app/dashboard/dashbloom/page.tsx', 'r', encoding='utf-8') as f:
    page_content = f.read()

page_content = page_content.replace("'Demo | VDDashboard'", "'DashBloom | VDDashboard'")

with open('src/app/dashboard/dashbloom/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_content)
