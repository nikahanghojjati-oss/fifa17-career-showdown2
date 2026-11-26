import cv2, numpy as np, sys
from PIL import Image, ImageFilter
X0,Y0,S=1930,0,900
plate=np.array(Image.open('/home/claude/p4in/r100-duet/p4/inputs/F-1/ENV_ARCHIVE_PLATE_HC_V3_2X.png').convert('RGB'))
H,W=plate.shape[:2]; print('plate',W,H)
ref=plate[Y0:Y0+S,X0:X0+S].copy()
raw=np.array(Image.open(sys.argv[1]).convert('RGB'))
r0=cv2.resize(raw,(S,S),interpolation=cv2.INTER_LANCZOS4)
g1=cv2.cvtColor(ref,cv2.COLOR_RGB2GRAY); g2=cv2.cvtColor(r0,cv2.COLOR_RGB2GRAY)
# match on the room only (outside the hero) so the face change does not pull the fit
mfull=Image.open('/home/claude/r100/tools/clubhouse-themes/masks/ENV_ARCHIVE_PLATE_HC_V3_1920.png').convert('L').resize((W,H),Image.LANCZOS)
hm=np.asarray(mfull,np.float32)[Y0:Y0+S,X0:X0+S]/255
room=(cv2.dilate((hm>0.05).astype(np.uint8),np.ones((25,25)))==0).astype(np.uint8)*255
orb=cv2.ORB_create(8000); k1,d1=orb.detectAndCompute(g1,room); k2,d2=orb.detectAndCompute(g2,None)
m=sorted(cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2),key=lambda x:x.distance)[:1500]
p1=np.float32([k1[x.queryIdx].pt for x in m]); p2=np.float32([k2[x.trainIdx].pt for x in m])
A,inl=cv2.estimateAffinePartial2D(p2,p1,method=cv2.RANSAC,ransacReprojThreshold=3)
print('affine',np.round(A,4).tolist(),'inliers',int(inl.sum()),'/',len(m))
al=cv2.warpAffine(r0,A,(S,S),flags=cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REPLICATE)
rr=np.abs(al.astype(int)-ref.astype(int)).mean(2)
print('room residual (mean abs, outside hero):',round(float(rr[room>0].mean()),2))
# likeness lock: edited pixels only inside the hero zone, ~6px feather
lock=np.asarray(Image.fromarray((hm*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)),np.float32)/255
lock=np.clip(lock*np.clip(hm*1.0+0.0,0,1)**0,0,1)
out=ref*(1-lock[...,None])+al*lock[...,None]
full=plate.copy(); full[Y0:Y0+S,X0:X0+S]=np.clip(out,0,255).astype(np.uint8)
assert (full[:,:X0]==plate[:,:X0]).all()
Image.fromarray(full).save(sys.argv[2])
np.save(sys.argv[2]+'.al.npy',al)
# never-slimmer: inside the old outline band, does the edit look like the old hero or like the room?
inside=(hm>0.5).astype(np.uint8); band=(inside - cv2.erode(inside,np.ones((31,31)))).astype(bool)
d=np.abs(al.astype(int)-ref.astype(int)).mean(2)
print('edge band (15px inside old outline): mean diff',round(float(d[band].mean()),1),' pixels >40:',round(float((d[band]>40).mean())*100,1),'%')
# picture: old outline drawn over the new head
vis=np.clip(out,0,255).astype(np.uint8).copy()
cnt,_=cv2.findContours(inside,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
v2=vis.copy(); cv2.drawContours(v2,cnt,-1,(0,255,255),2)
Image.fromarray(np.hstack([ref,vis,v2])).resize((1350,450)).save(sys.argv[2]+'.cmp.jpg',quality=88)
heat=(np.clip(d/80,0,1)*255).astype(np.uint8); hv=np.ascontiguousarray(cv2.applyColorMap(heat,cv2.COLORMAP_INFERNO)[...,::-1])
cv2.drawContours(hv,cnt,-1,(0,255,255),2)
Image.fromarray(hv).resize((450,450)).save(sys.argv[2]+'.diff.jpg',quality=85)
