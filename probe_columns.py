# -*- coding: utf-8 -*-
"""Probe which columns actually exist in public.registrations."""
import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://rnhpeefepjazvltjjwtf.supabase.co"
SUPABASE_KEY = "sb_publishable_lxmb37FMpuekLqRZWE-KGg_F2FjhDKC"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

url = f"{SUPABASE_URL}/rest/v1/registrations"

def test_insert(test_row, label):
    print(f"\n=== {label} ===")
    try:
        data = json.dumps([test_row]).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req) as response:
            print(f"SUCCESS (status {response.status})")
            # Clean up
            delete_url = f"{url}?registration_id=eq.{test_row['registration_id']}"
            del_req = urllib.request.Request(delete_url, headers=headers, method='DELETE')
            with urllib.request.urlopen(del_req) as del_response:
                pass
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            error_json = json.loads(body)
            msg = error_json.get('message', body)
            print(f"FAIL ({e.code}): {msg}")
            # Extract column name if it's a PGRST204 error
            if 'column' in msg and 'schema cache' in msg:
                # Extract column name between single quotes
                import re
                match = re.search(r"'([^']+)'", msg)
                if match:
                    print(f"  -> Missing column: {match.group(1)}")
        except:
            print(f"FAIL ({e.code}): {body}")
    return False

# Start with just registration_id
base = {"registration_id": "DSEU-FE-PROBE-001"}
print("Testing minimal payload...")
if not test_insert(base, "Only registration_id"):
    print("Cannot proceed without registration_id working")
    exit(1)

# Now test adding columns one by one
columns_to_test = [
    ("team_name", "Test Team"),
    ("captain_name", "Test Captain"),
    ("captain_mobile", "9999999999"),
    ("captain_whatsapp", "9999999999"),
    ("team_uid", "123456789"),
    ("category", "Outsider"),
    ("registration_fee", 79),
    ("player1_name", "P1"),
    ("player1_uid", "111"),
    ("player2_name", "P2"),
    ("player2_uid", "222"),
    ("player3_name", "P3"),
    ("player3_uid", "333"),
    ("player4_name", "P4"),
    ("player4_uid", "444"),
    ("substitute_name", ""),
    ("substitute_uid", ""),
    ("college_name", ""),
    ("course", ""),
    ("semester", ""),
    ("student_id", ""),
    ("instagram", ""),
    ("utr", ""),
    ("payment_screenshot", ""),
    ("payment_status", "Pending Verification"),
    ("registration_status", "Pending"),
]

existing_columns = ["registration_id"]
missing_columns = []

for col, val in columns_to_test:
    test_row = {"registration_id": f"DSEU-FE-PROBE-{len(existing_columns)+1:03d}"}
    for c in existing_columns:
        if c == "registration_fee":
            test_row[c] = 79
        elif c in ["player1_name", "player2_name", "player3_name", "player4_name"]:
            test_row[c] = "P"
        elif c in ["player1_uid", "player2_uid", "player3_uid", "player4_uid"]:
            test_row[c] = "1"
        elif c == "registration_id":
            pass
        else:
            test_row[c] = "test"
    test_row[col] = val
    
    if test_insert(test_row, f"With {col}"):
        existing_columns.append(col)
    else:
        missing_columns.append(col)

print("\n\n=== SUMMARY ===")
print("EXISTING COLUMNS:")
for c in existing_columns:
    print(f"  {c}")
print("\nMISSING COLUMNS:")
for c in missing_columns:
    print(f"  {c}")
