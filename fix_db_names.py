import os
from supabase import create_client

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://wuidghlxjsvqmweezzil.supabase.co')
key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWRnaGx4anN2cW13ZWV6emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzg2NjYsImV4cCI6MjEwNTg1NDY2Nn0.j7GnGVhqammPqbOQr0qWZzUk4K8UJZ3-6k9fz5xx5wM')
supabase = create_client(url, key)

res = supabase.table('broker_group_mapping').select('*').execute()
for m in res.data:
    old_name = m['broker_name']
    new_name = old_name
    
    if old_name == 'XP Investimentos': new_name = 'XP'
    elif old_name == 'BTG Pactual': new_name = 'BTG'
    elif old_name == 'Santander': new_name = 'Santander Institucional'
    elif old_name.startswith('Ita'): new_name = 'Itaú'
    
    if new_name != old_name:
        supabase.table('broker_group_mapping').update({'broker_name': new_name}).eq('id', m['id']).execute()
        print(f"Updated {old_name} to {new_name}")
print("Done DB Fix")
