# Checks a Gazette playground JSON answer against the Showdown rules. Usage: python3 check_copy.py JOB1_season_stories.json
import json,re,sys
d=json.load(open(sys.argv[1]))
ALLOW=set("winner loser winnerClub loserClub margin winnerPoints loserPoints managerA managerB clubA clubB points leader trailer seasonNo seasonsTotal".split())
NOWIN={'draw','level-overall','showdown-drawn'}
BAN=r"\b(goal|goals|scor(ed|er|ing)|striker|keeper|injur\w*|transfer\w*|crowd|fans?|tactic\w*|formation|penalt\w*|hat-trick|minute|daniel|nik|stadium|sacked|signing)\b"
lim={'season':[(28,40),(30,45),(20,35)],'final':[(30,42),(30,45),(20,35)]}
bad=0
for r in d['stories']:
    probs=[]
    ps=r['paragraphs']
    if len(ps)!=3: probs.append('paras %d'%len(ps))
    for i,p in enumerate(ps):
        for ph in re.findall(r'\{(\w+)\}',p):
            if ph not in ALLOW: probs.append('ph '+ph)
        if r['situation'] in NOWIN and re.search(r'\{(winner|loser|winnerClub|loserClub|margin|winnerPoints|loserPoints)\}',p): probs.append('win-ph in draw')
        if re.search(r'\d',re.sub(r'\{\w+\}','',p)): probs.append('digit p%d'%i)
        if '—' in p or '–' in p: probs.append('dash p%d'%i)
        m=re.findall(BAN,p,re.I)
        if m: probs.append('ban p%d %s'%(i,[x[0] if isinstance(x,tuple) else x for x in m]))
        n=len(p.split()); lo,hi=lim[r['edition']][i] if i<3 else (0,99)
        if n<lo-3 or n>hi+5: probs.append('words p%d=%d'%(i,n))
    if probs: bad+=1; print(r['id'],r['situation'],probs)
print('rows',len(d['stories']),'flagged',bad)
