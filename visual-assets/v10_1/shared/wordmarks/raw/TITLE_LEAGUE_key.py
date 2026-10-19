import numpy as np, cv2, sys
from PIL import Image
SRC='/tmp/claude-0/w1030/visual-assets/v10_1/league/assets/REF_GOAL_LEAGUE.jpg'
x0,y0,x1,y1=455,110,1070,232
S=4
im=Image.open(SRC).convert('RGB').crop((x0,y0,x1,y1))
raw=im
big=np.asarray(im.resize((im.width*S,im.height*S),Image.LANCZOS)).astype(np.float32)
R,G,B=big[...,0],big[...,1],big[...,2]
g=R-B
lo,hi=float(sys.argv[1]) if len(sys.argv)>1 else 12, float(sys.argv[2]) if len(sys.argv)>2 else 135
a=np.clip((g-lo)/(hi-lo),0,1)
# luminance guard: reject non-bright
a*=np.clip((R-60)/60,0,1)
# component filter
m=(a>0.25).astype('uint8')
n,lab,st,cen=cv2.connectedComponentsWithStats(m,connectivity=8)
keep=np.zeros(n,bool)
for i in range(1,n):
    if st[i,cv2.CC_STAT_AREA]>=20000 and st[i,cv2.CC_STAT_TOP]<300: keep[i]=True
print([(i,tuple(st[i]),tuple(cen[i].round())) for i in range(1,n) if st[i,4]>=200])
km=keep[lab]
# dilate kept comps slightly to include soft edges
km=cv2.dilate(km.astype('uint8'),np.ones((9,9),np.uint8))>0
a=a*km
np.save('alpha.npy',a)
# foreground colour: bleed interior colours outward
core=(a>0.92).astype(np.float32)
col=big*core[...,None]
num=cv2.GaussianBlur(col,(0,0),6); den=cv2.GaussianBlur(core,(0,0),6)[...,None]
num2=cv2.GaussianBlur(col,(0,0),18); den2=cv2.GaussianBlur(core,(0,0),18)[...,None]
f1=num/np.maximum(den,1e-4); f2=num2/np.maximum(den2,1e-4)
w=np.clip(den/0.15,0,1)
F=f1*w+f2*(1-w)
F=np.where(core[...,None]>0,big,F)
F=np.clip(F,0,255)
Image.fromarray((a*255).astype('uint8')).save('alpha.png')
np.save('F.npy',F)
