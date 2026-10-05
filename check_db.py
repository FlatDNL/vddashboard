import os
from supabase import create_client

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://wuidghlxjsvqmweezzil.supabase.co')
key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWRnaGx4anN2cW13ZWV6emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzg2NjYsImV4cCI6MjEwNTg1NDY2Nn0.j7GnGVhqammPqbOQr0qWZzUk4K8UJZ3-6k9fz5xx5wM')
supabase = create_client(url, key)

res = supabase.table('broker_group_mapping').select('*').execute()
for m in res.data:
    print(f"{m['broker_name']} -> {m['group_id']}")

groups = supabase.table('player_groups').select('*').execute()
for g in groups.data:
    print(f"GROUP {g['id']} -> {g['name']}")
