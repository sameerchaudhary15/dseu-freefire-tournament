# -*- coding: utf-8 -*-
import urllib.request
import json

url = 'https://rnhpeefepjazvltjjwtf.supabase.co/rest/v1/'
headers = {
    'apikey': 'sb_publishable_lxmb37FMpuekLqRZWE-KGg_F2FjhDKC',
    'Accept': 'application/json'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        # Print just the paths to find the registrations schema
        print("Top-level keys:", list(data.keys()))
        if 'paths' in data:
            reg_paths = [p for p in data['paths'].keys() if 'registrations' in p]
            print("Registrations paths:", reg_paths)
            # Try to find schema components
            if 'components' in data and 'schemas' in data['components']:
                schemas = data['components']['schemas']
                reg_schema = None
                for name, schema in schemas.items():
                    if 'registration' in name.lower():
                        reg_schema = schema
                        print(f"\nSchema: {name}")
                        if 'properties' in schema:
                            print("Columns:")
                            for col, info in schema['properties'].items():
                                print(f"  {col}: {info.get('type', 'unknown')}")
                        break
                if not reg_schema:
                    print("\nNo registration schema found in components.schemas")
                    print("Available schemas:", list(schemas.keys())[:20])
            else:
                print("\nNo components.schemas found")
        else:
            print("No paths found in response")
except Exception as e:
    print(f"Error: {e}")
