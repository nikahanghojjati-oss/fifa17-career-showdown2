# HO-074: remove gold "light-emitting" glows from CSS. Keeps inset edges and dark contact shadows.
import re, sys
WARM = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)')
def warm(term):
    m = WARM.search(term)
    if not m: return 'shadow-glow' in term
    r,g,b = map(int, m.groups()); return r >= 200 and g >= 140 and b <= 200 and r > b + 40
def split_top(s):
    out, d, cur = [], 0, ''
    for ch in s:
        if ch == '(': d += 1
        if ch == ')': d -= 1
        if ch == ',' and d == 0: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur); return [x.strip() for x in out]
def glow(term):   # an outer warm shadow (not inset) = a glow
    return 'inset' not in term and warm(term)
changes = []
def fix_decl(m):
    prop, val, end = m.group(1), m.group(2), m.group(3)
    terms = split_top(val); keep = [t for t in terms if not glow(t)]
    if len(keep) == len(terms): return m.group(0)
    new = ', '.join(keep) if keep else ('0 1px 2px rgba(0, 0, 0, .7)' if prop == 'text-shadow' else 'none')
    changes.append((prop, val.strip(), new)); return f'{prop}: {new}{end}'
def fix_filter(line):
    def rep(m):
        if warm(m.group(0)): changes.append(('drop-shadow', m.group(0), '')); return ''
        return m.group(0)
    new = re.sub(r'drop-shadow\((?:[^()]|\([^()]*(?:\([^()]*\)[^()]*)*\))*\)', rep, line)
    if new != line:
        new = re.sub(r'filter:\s*;', 'filter: none;', new); new = re.sub(r'filter:\s*}', 'filter: none; }', new)
        new = re.sub(r'(filter:)\s+(\S)', r'\1 \2', new); new = re.sub(r'  +(?=[;)])', '', new)
    return new
src = open(sys.argv[1]).read().split('\n'); out = []
for src_line in src:
    line = src_line
    line = re.sub(r'(text-shadow|box-shadow):\s*([^;{}]+?)(\s*;|\s*})', fix_decl, line)
    if 'drop-shadow' in line: line = fix_filter(line)
    if line.strip()=='' and src_line.strip()!='': continue   # a whole line was one glow
    out.append(line)
txt = re.sub(r'\)\s+;', ');', '\n'.join(out))
open(sys.argv[2], 'w').write(txt)
for c in changes: print(' | '.join(c))
print(len(changes), 'glow terms removed', file=sys.stderr)
