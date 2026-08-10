# -*- coding: utf-8 -*-
import re

path = 'c:/python programming/dseu-free-fire-tournament/js/register.js'
with open(path, 'r', encoding='utf-8-sig') as f:
    code = f.read()

lines = code.split('\n')
errors = []

# 1. Check balanced braces/parens/brackets (ignoring strings and comments)
cleaned = re.sub(r'//[^\n]*', '', code)
cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
# Remove string literals
in_str = None
result = []
i = 0
while i < len(cleaned):
    ch = cleaned[i]
    if in_str:
        if ch == '\\' and i + 1 < len(cleaned):
            result.append(ch)
            result.append(cleaned[i + 1])
            i += 2
            continue
        if ch == in_str:
            in_str = None
        result.append(ch)
    elif ch in ('"', "'"):
        in_str = ch
        result.append(ch)
    else:
        result.append(ch)
    i += 1
cleaned = ''.join(result)

stack = []
pairs = {')': '(', ']': '[', '}': '{'}
for i, ch in enumerate(cleaned):
    if ch in '([{':
        stack.append((ch, i))
    elif ch in ')]}':
        if not stack or stack[-1][0] != pairs[ch]:
            errors.append('MISMATCH: closing ' + ch + ' at position ' + str(i))
            break
        stack.pop()
if stack:
    errors.append('UNBALANCED: ' + str(len(stack)) + ' unclosed ' + stack[-1][0])

if not errors:
    print('PASS: all braces/parens/brackets balanced')
else:
    for e in errors:
        print('FAIL: ' + e)

# 2. Check specific requirements
checks = [
    ('registration_id: registrationId' in code, 'registration_id column mapping'),
    ('registration_fee: totalFee' in code, 'total fee stored as registration_fee'),
    ('registration_fee_per_player: fee' in code, 'per-player fee stored as registration_fee_per_player'),
    ('totalFee = fee * NUM_PAID_PLAYERS' in code, 'total fee uses NUM_PAID_PLAYERS'),
    ('supabaseResponse.error' in code, 'error handling checks .error'),
    ('showFormError' in code, 'user-facing error via showFormError'),
    ('console.error' in code, 'console.error for debugging'),
    ('location.href' in code, 'redirect to success page'),
    ('saveRegistrations' in code, 'localStorage save'),
    ('setLastId' in code, 'setLastId called'),
]

for passed, desc in checks:
    if passed:
        print('PASS: ' + desc)
    else:
        print('FAIL: ' + desc)

# 3. Check supabaseRow doesn't have forbidden columns
in_supabase_row = False
for line in lines:
    stripped = line.strip()
    if 'supabaseRow = {' in line or 'supabaseRow = {' in stripped:
        in_supabase_row = True
    if in_supabase_row and stripped.startswith('};') or stripped == '};':
        in_supabase_row = False
    if in_supabase_row:
        if 'whatsapp:' in line and 'captain_whatsapp' not in line:
            print('FAIL: whatsapp in supabaseRow')
        if 'team_logo:' in line:
            print('FAIL: team_logo in supabaseRow')
        if 'teamLogo:' in line and 'payment_screenshot' not in line:
            pass  # teamLogo is the JS key, not the DB column
        if 'date:' in line and 'created_at' not in line:
            print('FAIL: date in supabaseRow')

# 4. Check players.length is NOT used for totalFee
if 'totalFee = fee * players.length' in code:
    print('FAIL: totalFee still uses players.length')
else:
    print('PASS: totalFee does not use players.length')

# 5. Check redirect is after error check
redirect_idx = code.find("location.href =\n    'success.html")
error_check_idx = code.find('if (supabaseResponse.error)')
if redirect_idx > error_check_idx and error_check_idx > 0:
    print('PASS: redirect comes after error check')
else:
    print('FAIL: redirect position issue')

# 6. Check localStorage save is after Supabase success
supabase_error_idx = code.find('if (supabaseResponse.error)')
localstorage_idx = code.find('var allRegs = getRegistrations')
if localstorage_idx > supabase_error_idx:
    print('PASS: localStorage save is after Supabase error check')
else:
    print('FAIL: localStorage save position issue')

print('\nTotal lines:', len(lines))
