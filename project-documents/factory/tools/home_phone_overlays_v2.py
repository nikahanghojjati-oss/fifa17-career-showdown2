#!/usr/bin/env python3
"""HO-005 / V-243: Home phone overlays V2 (each manager only, no ghost coat, no plate text, no jacket line).
Run from visual-assets/v10_1/home/assets: python3 <repo>/project-documents/factory/tools/home_phone_overlays_v2.py
Needs: pip install rembg onnxruntime scipy pillow numpy (isnet-general-use person matte of the desktop plate).
Writes /tmp/claude-0/ho005/out/OVL_HOME_{DANIEL,NIK}_PHONE_V2{.webp,_2X.png}; same crop box and pixel size as V1,
so the phone placement CSS is unchanged."""
import os
MASK = '/tmp/claude-0/ho005/mask_isnet-general-use.png'
if not os.path.exists(MASK):
    from PIL import Image
    from rembg import remove, new_session
    os.makedirs(os.path.dirname(MASK), exist_ok=True)
    crop = Image.open('ENV_HOME_PLATE_V1_2X.png').convert('RGB').crop((960, 0, 3000, 1882))
    remove(crop, session=new_session('isnet-general-use'), only_mask=True).save(MASK)
import numpy as np, json, os
from PIL import Image
from scipy import ndimage
P=Image.open('ENV_HOME_PLATE_V1_2X.png').convert('RGB')
p=np.asarray(P).astype(float); H,W=p.shape[:2]
for x in range(1850,W):            # thin plate line at 2x rows ~1314-1318
    top,bot=p[1312,x].copy(),p[1320,x].copy()
    for r in range(1313,1320):
        t=(r-1312)/8; p[r,x]=top*(1-t)+bot*t
clean=p.clip(0,255).astype(np.uint8)
Lum=p.mean(-1)
m=np.zeros((H,W)); mk=np.asarray(Image.open('/tmp/claude-0/ho005/mask_isnet-general-use.png').convert('L')).astype(float)/255
m[:,960:960+mk.shape[1]]=mk
# 'The Maestro' plate text left of Daniel's head (2x coords)
# 'The Maestro / SKILL. VISION. MAGIC.' plate text left of Daniel's head (1x geometry, applied at 2x)
C=[(560,440),(600,437),(630,433),(660,428),(690,418),(712,408),(745,392)]
cx=np.array([c[0] for c in C])*2.; cy=np.array([c[1] for c in C])*2.
Xg=np.arange(W); coat=np.interp(Xg,cx,cy)            # coat top edge per column (2x)
Yg=np.arange(H)[:,None]
above=Yg<coat[None,:]
R=np.zeros_like(m,bool)
R[600:690,1200:1336]=True
R[640:712,1336:1396]=True                               # 'stro' tail under the hair                               # beside the hair, y 300-345
R[690:900,1200:1424]=True                               # beside the ear and neck, y 345-450
soft_edge=np.clip((Yg-coat[None,:])/6.0+0.5,0,1)   # 6 px (2x) soft cut along the coat top
m[R]=(m*soft_edge)[R]
letters=np.zeros_like(m,bool); letters[825:890,1220:1360]=True   # tail of 'MAGIC.' over the coat edge
lm=ndimage.gaussian_filter(((Lum>45)&letters).astype(float),1.5)
m*=1-np.clip(lm*2.0,0,1)

# split: Nik's silhouette edge, 1x (y, x)
B=[(330,1030),(370,1045),(387,1040),(405,1025),(422,1010),(432,980),(440,950),(450,920),(462,900),(470,892),(490,884),(520,882),(560,882),(600,884),(640,893),(680,910),(705,928),(730,950),(762,975),(800,1000),(840,1012),(880,1008),(941,998)]
ys=np.array([b[0] for b in B])*2.; xs=np.array([b[1] for b in B])*2.
yy=np.arange(H); bx=np.interp(yy,ys,xs)
bx[yy<660]=2000
X=np.arange(W)[None,:]
side=np.clip((X-bx[:,None])/4.0+0.5,0,1)
dan=m*(1-side); nik=m*side
pm=json.load(open('phonemap.json'))['cutouts']
for arr,k in ((dan,'daniel_phone'),(nik,'nik_phone')):
    f=pm[k]['bottom_alpha_fade']; s,e=f['start_y']*2,f['end_y']*2
    g=np.clip(1-(yy-s)/(e-s),0,1); arr*=g[:,None]
os.makedirs('/tmp/claude-0/ho005/out',exist_ok=True)
for arr,who,ref in ((dan,'DANIEL','OVL_HOME_DANIEL_PHONE_V1'),(nik,'NIK','OVL_HOME_NIK_PHONE_V1')):
    im=Image.fromarray(np.dstack([clean,(arr*255).clip(0,255).astype(np.uint8)]),'RGBA')
    im.save(f'/tmp/claude-0/ho005/out/OVL_HOME_{who}_PHONE_V2_2X.png')
    bb=Image.open(ref+'_2X.png').getchannel('A').getbbox(); size=Image.open(ref+'.webp').size
    r=im.crop(bb).resize(size,Image.LANCZOS)
    for q in (85,82,80,78,75,72,70):
        o=f'/tmp/claude-0/ho005/out/OVL_HOME_{who}_PHONE_V2.webp'; r.save(o,'WEBP',quality=q,method=6)
        if os.path.getsize(o)<=60000: break
    print(who,size,'q',q,os.path.getsize(o))
