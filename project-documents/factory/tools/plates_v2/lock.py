import sys, cv2, numpy as np
from PIL import Image
key, gpt, rects = sys.argv[1], sys.argv[2], eval(sys.argv[3])
src=Image.open(f'/home/claude/fifa17-career-showdown2/project-documents/factory/mockups/NEXT_{key}.png').convert('RGB')
n=np.array(src.resize((1536,864),Image.LANCZOS))[:,:,::-1].copy()
g=cv2.imread(gpt); g=g[80:944] if g.shape[0]==1024 else g
# fit GPT->original on areas outside the rects
m=np.full((864,1536),255,np.uint8)
for x0,y0,x1,y1 in rects: m[max(0,y0-20):y1+20,max(0,x0-20):x1+20]=0
orb=cv2.ORB_create(6000)
k1,d1=orb.detectAndCompute(cv2.cvtColor(g,cv2.COLOR_BGR2GRAY),m); k2,d2=orb.detectAndCompute(cv2.cvtColor(n,cv2.COLOR_BGR2GRAY),m)
ms=sorted(cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2),key=lambda x:x.distance)[:600]
A,inl=cv2.estimateAffinePartial2D(np.float32([k1[x.queryIdx].pt for x in ms]),np.float32([k2[x.trainIdx].pt for x in ms]),ransacReprojThreshold=3)
print('fit',np.round(A,4).tolist(),int(inl.sum()),'/',len(ms))
gw=cv2.warpAffine(g,A,(1536,864),flags=cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REPLICATE)
mask=np.zeros((864,1536),np.float32)
for x0,y0,x1,y1 in rects: mask[max(0,y0-12):y1+12,max(0,x0-12):x1+12]=1
mask=cv2.GaussianBlur(mask,(0,0),5)[:,:,None]
out=(gw*mask+n*(1-mask)).astype(np.uint8)
cv2.imwrite(f'plate_{key}.png',out)
# leftover cyan check
hsv=out.astype(int); cy=((hsv[:,:,0]>200)&(hsv[:,:,1]>200)&(hsv[:,:,2]<80)).sum(); print('cyan px',int(cy))
