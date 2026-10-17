# One-off: Rule Book plate try 1 had PASSSION on the right banner (lock restored the old AMBITION). Removes the third S from GPT banner letters and pastes the banner cloth back.
import cv2, numpy as np
G=cv2.imread('/tmp/claude-0/pl/raw_RULE_BOOK.png')[80:944].astype(np.float32)
P=cv2.imread('/tmp/claude-0/pl/plate_RULE_BOOK.png').astype(np.float32)
H,W=G.shape[:2]
yy,xx=np.mgrid[0:H,0:W]
sep=251-(xx-1420)*0.2
lum=G.mean(2)
box=(xx>=1400)&(xx<=1481)&(yy>sep)&(yy<=292)
m=(box&(lum>70)).astype(np.uint8)*255
m=cv2.dilate(m,np.ones((5,5),np.uint8))
B=cv2.inpaint(G.clip(0,255).astype(np.uint8),m,4,cv2.INPAINT_TELEA).astype(np.float32)
out=B.copy()
a=np.clip((lum-55)/90,0,1)[...,None]
def put(x0,x1,dx,dy):
    reg=box.copy(); reg&=(xx>=x0)&(xx<=x1)
    ys,xs=np.nonzero(reg)
    ty,tx=ys+dy,xs+dx
    al=a[ys,xs]
    out[ty,tx]=out[ty,tx]*(1-al)+G[ys,xs]*al
put(1400,1444,4,-1)
put(1452,1481,-5,1)
F=out
# paste banner cloth interior into plate with feather
mask=np.zeros((H,W),np.float32); mask[100:420,1393:1487]=1
mask=cv2.GaussianBlur(mask,(0,0),2)[...,None]
R=P*(1-mask)+F*mask
cv2.imwrite('/tmp/claude-0/pl/plate_RULE_BOOK_fixed.png',R.clip(0,255).astype(np.uint8))
z=R[60:440,1360:1520].clip(0,255).astype(np.uint8)
cv2.imwrite('/tmp/claude-0/pl/ban3.png',cv2.resize(z,None,fx=3,fy=3,interpolation=cv2.INTER_NEAREST))
