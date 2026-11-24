# save2.py <silver|black|matte> NAME raw.png aligned.webp
import sys, shutil, hashlib, json, os
c,n,raw,al=sys.argv[1:5]
O=f'/home/user/work/project-documents/hc-art/ho-premium-full/{c}/'
os.makedirs(O,exist_ok=True)
shutil.copy(raw,O+n+'_RAW.png'); shutil.copy(al,O+n+'.webp')
p=O+'SHA256.json'; d=json.load(open(p)) if os.path.exists(p) else {}
for f in (n+'_RAW.png',n+'.webp'): d[f]=hashlib.sha256(open(O+f,'rb').read()).hexdigest()
json.dump(d,open(p,'w'),indent=1,sort_keys=True); print('saved',c,n)
