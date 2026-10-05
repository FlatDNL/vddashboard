import os
from supabase import create_client

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://wuidghlxjsvqmweezzil.supabase.co')
key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWRnaGx4anN2cW13ZWV6emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzg2NjYsImV4cCI6MjEwNTg1NDY2Nn0.j7GnGVhqammPqbOQr0qWZzUk4K8UJZ3-6k9fz5xx5wM')
supabase = create_client(url, key)

res = supabase.table('broker_group_mapping').select('*').execute()

# Move them out of the way first
for m in res.data:
    if m['broker_name'] == 'UBS' and m['broker_id'] == 8:
        supabase.table('broker_group_mapping').update({'broker_id': 9999}).eq('id', m['id']).execute()
    elif m['broker_name'] == 'BTG Pactual' and m['broker_id'] == 85:
        supabase.table('broker_group_mapping').update({'broker_id': 9998}).eq('id', m['id']).execute()

# Update to correct values
res = supabase.table('broker_group_mapping').select('*').execute()
for m in res.data:
    if m['broker_name'] == 'UBS' and m['broker_id'] == 9999:
        supabase.table('broker_group_mapping').update({'broker_id': 16}).eq('id', m['id']).execute()
    elif m['broker_name'] == 'BTG Pactual' and m['broker_id'] == 9998:
        supabase.table('broker_group_mapping').update({'broker_id': 8}).eq('id', m['id']).execute()

print("Done")
