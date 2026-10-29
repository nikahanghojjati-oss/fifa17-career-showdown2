# Likeness lock for phone plates: fit GPT onto PHONE_<KEY>_MARBLE, keep ONLY the approved heads (faces + hair) from the mockup,
# everything else is Nik's GPT picture (full bodies, floor, room). Changed 12 Oct 9:41 p.m. Eastern: the old rule kept every
# mockup pixel outside the cyan rects, which brought back the mockup's faded half-bodies on League (Nik caught it).
# then crop to 9:16 and save visual-assets/v10_1/plates-v2/ENV_<KEY>_PHONE_V2.webp (1179x2096) + a 2x-check png in /tmp.
import sys, cv2, numpy as np
from PIL import Image
from masks import scaled
key, gpt = sys.argv[1], sys.argv[2]
ROOT='/home/claude/fifa17-career-showdown2/'
n=cv2.imread(ROOT+f'project-documents/factory/mockups/PHONE_{key}_MARBLE.png'); H,W=n.shape[:2]
g=cv2.imread(gpt); g=cv2.resize(g,(W,H),interpolation=cv2.INTER_LANCZOS4) if g.shape[:2]!=(H,W) else g
rects=scaled(key,W,H)
m=np.full((H,W),255,np.uint8)
for x0,y0,x1,y1 in rects: m[max(0,y0-20):y1+20,max(0,x0-20):x1+20]=0
orb=cv2.ORB_create(6000)
k1,d1=orb.detectAndCompute(cv2.cvtColor(g,cv2.COLOR_BGR2GRAY),m); k2,d2=orb.detectAndCompute(cv2.cvtColor(n,cv2.COLOR_BGR2GRAY),m)
ms=sorted(cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2),key=lambda x:x.distance)[:600]
A,inl=cv2.estimateAffinePartial2D(np.float32([k1[x.queryIdx].pt for x in ms]),np.float32([k2[x.trainIdx].pt for x in ms]),ransacReprojThreshold=3)
print('fit',np.round(A,4).tolist(),int(inl.sum()),'/',len(ms))
gw=cv2.warpAffine(g,A,(W,H),flags=cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REPLICATE)
from facecheck import faces
from headmatch import match, head_box
keep=np.zeros((H,W),np.float32); head_src=n.copy(); report=[]
NOPEOPLE=("SETTINGS","RULE_BOOK","LOADING")   # empty plates: no managers (Loading: Team G layers the real Reus photo)
for i,f in enumerate([] if key in NOPEOPLE else sorted(faces(n))):   # head = face box grown for hair, ears and chin
    r=match(n,gw,f); x0,y0,x1,y1=r['box']
    # snap the approved head onto the GPT head so it sits exactly on that neck and body (position, tilt, size)
    snapped=cv2.warpAffine(n,r['M'],(W,H),flags=cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REPLICATE)
    head_src[y0:y1,x0:x1]=snapped[y0:y1,x0:x1]
    # brightness step measured on the blend edge (a 24px band along the head box border), where a seam would show
    band=np.zeros((H,W),bool); band[y0:y1,x0:x1]=True; band[y0+24:y1-24,x0+24:x1-24]=False
    La=cv2.cvtColor(snapped,cv2.COLOR_BGR2LAB)[:,:,0].astype(np.float32); Lb=cv2.cvtColor(gw,cv2.COLOR_BGR2LAB)[:,:,0].astype(np.float32)
    dL=float(np.median((La-Lb)[band]))/2.55
    ok=abs(r['dx'])<=2 and abs(r['dy'])<=2 and abs(r['tilt'])<=0.5 and abs(r['size'])<=1 and abs(dL)<=6
    report.append(ok)
    print(f"head {'Daniel' if i==0 else 'Nik'}: shift {r['dx']},{r['dy']} px, tilt {r['tilt']} deg, size {r['size']}%, brightness step {dL:.1f}% -> {'MATCH' if ok else 'CHECK BY EYE (snapped)'}")
    keep[y0:y1,x0:x1]=1
for x0,y0,x1,y1 in rects: keep[max(0,y0-12):y1+12,max(0,x0-12):x1+12]=0   # a head never sits in a game box (facecheck), but be safe
mask=1-keep
mask=cv2.GaussianBlur(mask,(0,0),9)[:,:,None]
out=(gw*mask+head_src*(1-mask)).astype(np.uint8)
cy=((out[:,:,0]>200)&(out[:,:,1]>200)&(out[:,:,2]<80)).sum(); print('cyan px',int(cy))
cw=round(H*9/16); x=(W-cw)//2
im=Image.fromarray(cv2.cvtColor(out[:,x:x+cw],cv2.COLOR_BGR2RGB)).resize((1179,2096),Image.LANCZOS)
im.save(ROOT+f'visual-assets/v10_1/plates-v2/ENV_{key}_PHONE_V2.webp',quality=88,method=6)
im.save(f'/tmp/claude-0/ph/plate_{key}.png'); print('saved',im.size)

# Face check (faces clear of every game box, visible on a 393x852 phone, same place as the approved mockup)
from facecheck import check
if key not in ("SETTINGS","RULE_BOOK","LOADING"): check(key)
