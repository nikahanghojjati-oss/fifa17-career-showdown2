# Likeness lock for phone plates: fit GPT onto PHONE_<KEY>_MARBLE, keep the approved pixels outside the cyan rects,
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
mask=np.zeros((H,W),np.float32)
for x0,y0,x1,y1 in rects: mask[max(0,y0-12):y1+12,max(0,x0-12):x1+12]=1
mask=cv2.GaussianBlur(mask,(0,0),5)[:,:,None]
out=(gw*mask+n*(1-mask)).astype(np.uint8)
cy=((out[:,:,0]>200)&(out[:,:,1]>200)&(out[:,:,2]<80)).sum(); print('cyan px',int(cy))
cw=round(H*9/16); x=(W-cw)//2
im=Image.fromarray(cv2.cvtColor(out[:,x:x+cw],cv2.COLOR_BGR2RGB)).resize((1179,2096),Image.LANCZOS)
im.save(ROOT+f'visual-assets/v10_1/plates-v2/ENV_{key}_PHONE_V2.webp',quality=88,method=6)
im.save(f'/tmp/claude-0/ph/plate_{key}.png'); print('saved',im.size)
