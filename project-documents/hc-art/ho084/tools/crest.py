import sys, hashlib, json, os, numpy as np
from PIL import Image
from rembg import remove,new_session
exec(open('../ho081/fin.py').read().split('def xf')[0])  # decon
src,key=sys.argv[1],sys.argv[2]
im=Image.open(src).convert('RGB')
import os
if os.environ.get('KEY'):
    from scipy.ndimage import binary_fill_holes, label, binary_opening, gaussian_filter
    A=np.array(im).astype(float); bgc=np.median(np.concatenate([A[:20].reshape(-1,3),A[-20:].reshape(-1,3),A[:,:20].reshape(-1,3),A[:,-20:].reshape(-1,3)]),0)
    d=np.sqrt(((A-bgc)**2).sum(-1)); m=d>28; m=binary_opening(m,iterations=2)
    lab,n=label(m); sizes=np.bincount(lab.ravel()); sizes[0]=0; m=lab==sizes.argmax(); m=binary_fill_holes(m)
    al=np.clip(gaussian_filter(m.astype(float),1.0)*255,0,255).astype(np.uint8)
    cut=Image.fromarray(np.dstack([np.array(im),al]),'RGBA')
else:
    cut=remove(im,session=new_session('isnet-general-use'),post_process_mask=True)
from scipy.ndimage import binary_fill_holes, binary_erosion
a=np.array(cut); al=a[...,3]; solid=binary_fill_holes(al>128); inner=binary_erosion(solid,iterations=6)
a[...,:3][inner]=np.array(im)[inner]; al[inner]=255; a[...,3]=al; cut=Image.fromarray(a,'RGBA')
cut=decon(cut); bb=cut.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox(); cut=cut.crop(bb)
H=1024; W=round(H*5/6); m=0.04
s=min((W*(1-2*m))/cut.width,(H*(1-2*m))/cut.height)
c=cut.resize((round(cut.width*s),round(cut.height*s)),Image.LANCZOS)
can=Image.new('RGBA',(W,H),(0,0,0,0)); can.paste(c,((W-c.width)//2,(H-c.height)//2),c)
res={}
for h in (1024,256,64):
    o=can if h==1024 else can.resize((round(h*5/6),h),Image.LANCZOS)
    p=f'out/{key}_{h}.png'; o.save(p,optimize=True); res[p]=hashlib.sha256(open(p,'rb').read()).hexdigest()
for bgc,t in (((18,14,12),'dark'),((240,236,228),'light')):
    b=Image.new('RGBA',can.size,bgc+(255,)); b.alpha_composite(can); b.convert('RGB').save(f'out/{key}_preview_{t}.jpg',quality=88)
# 28px readability strip
sm=can.resize((23,28),Image.LANCZOS); strip=Image.new('RGBA',(23*4,28),(18,14,12,255)); strip.alpha_composite(sm,(0,0)); strip.resize((23*4*4,28*4),Image.NEAREST).save(f'out/{key}_28px_x4.png')
j='out/SHA256.json'; d=json.load(open(j)) if os.path.exists(j) else {}; d.update(res); json.dump(d,open(j,'w'),indent=1)
print(res)
