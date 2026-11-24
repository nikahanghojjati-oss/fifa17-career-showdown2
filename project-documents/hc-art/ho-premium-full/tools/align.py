# usage: align.py raw.png wooden.webp out.webp  -> ORB homography fit to 3072x1728, prints residual
import sys, cv2, numpy as np
from PIL import Image
raw=np.array(Image.open(sys.argv[1]).convert('RGB')); ref=np.array(Image.open(sys.argv[2]).convert('RGB'))
H0,W0=ref.shape[:2]
r0=cv2.resize(raw,(W0,H0),interpolation=cv2.INTER_LANCZOS4)
g1=cv2.cvtColor(ref,cv2.COLOR_RGB2GRAY); g2=cv2.cvtColor(r0,cv2.COLOR_RGB2GRAY)
orb=cv2.ORB_create(8000); k1,d1=orb.detectAndCompute(g1,None); k2,d2=orb.detectAndCompute(g2,None)
m=sorted(cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2),key=lambda x:x.distance)[:1500]
p1=np.float32([k1[x.queryIdx].pt for x in m]); p2=np.float32([k2[x.trainIdx].pt for x in m])
A,inl=cv2.estimateAffinePartial2D(p2,p1,method=cv2.RANSAC,ransacReprojThreshold=4)
print('affine',np.round(A,4).tolist(),'inliers',int(inl.sum()),'/',len(m))
out=cv2.warpAffine(r0,A,(W0,H0),flags=cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REPLICATE)
Image.fromarray(out).save(sys.argv[3],'WEBP',quality=88,method=6)
Image.fromarray(np.hstack([cv2.resize(ref,(960,540)),cv2.resize(out,(960,540))])).save(sys.argv[3]+'.cmp.jpg',quality=85)
