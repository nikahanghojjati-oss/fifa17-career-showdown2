import sys, os, json
from PIL import Image
S='/tmp/claude-0/-home-claude-fifa17-career-showdown2/ff1afc9c-f71a-59d2-ae35-204bafabd9f3/scratchpad'
shift=int(sys.argv[1])
o=Image.open(S+'/tall/TALL_V5_locked.png')
floor=o.crop((0,2231,1179,2620)); need=2620-(2231-shift)
out=Image.new('RGB',(1179,2620)); out.paste(o.crop((0,shift,1179,2231)),(0,0)); out.paste(floor.resize((1179,need),Image.LANCZOS),(0,2231-shift))
out.save(S+'/tall/TALL_V5_shifted.png')
for q in (86,84,82,80,78):
    out.save(S+'/tall/plate/ENV_LEAGUE_PHONE_TALL.webp',quality=q,method=6); sz=os.path.getsize(S+'/tall/plate/ENV_LEAGUE_PHONE_TALL.webp')
    if sz<400000: print('shift',shift,'floor band',need,'webp q',q,sz); break
py=389-shift; px=71
z=lambda a,b,c,d:[round((a*1036+px)/1179,4),round((b*1842+py)/2620,4),round((c*1036+px)/1179,4),round((d*1842+py)/2620,4)]
Z={'zones':{'LEAGUE':[z(0.0903,0.1881,0.2539,0.3095),z(0.7461,0.1860,0.9089,0.3070)]}}
json.dump(Z,open(S+'/tall/PHONE_FACE_ZONES_TALL_V5.json','w'),indent=1); print(Z['zones'])
