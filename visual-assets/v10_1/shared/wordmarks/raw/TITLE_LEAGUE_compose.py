import numpy as np, cv2
from PIL import Image, ImageFilter
a=np.load('alpha.npy'); F=np.load('F.npy')
h,w=a.shape
# shadow from alpha
def make(shadow=True, pad=90):
    H,W=h+2*pad,w+2*pad
    A=np.zeros((H,W),np.float32); A[pad:pad+h,pad:pad+w]=a
    FF=np.zeros((H,W,3),np.float32); FF[pad:pad+h,pad:pad+w]=F
    # fill FF outside with bleed
    FF=cv2.copyMakeBorder(F,pad,pad,pad,pad,cv2.BORDER_REPLICATE)
    sh=cv2.GaussianBlur(A,(0,0),14)
    M=np.float32([[1,0,6],[0,1,14]]); sh=cv2.warpAffine(sh,M,(W,H))
    sh=np.clip(sh*0.85,0,1)
    # shadow colour = near black; composite letters over shadow
    oa=A+sh*(1-A)
    rgb=(FF*A[...,None]+np.array([6,5,4],np.float32)*(sh*(1-A))[...,None])/np.maximum(oa[...,None],1e-4)
    out=np.dstack([np.clip(rgb,0,255),oa*255]).astype('uint8')
    return Image.fromarray(out,'RGBA')
o=make()
bb=o.getchannel('A').point(lambda v:255 if v>3 else 0).getbbox(); print(bb)
o=o.crop(bb); o.save('wm_raw.png'); print(o.size)
for name,bg in (('black',(0,0,0)),('plate',(30,34,46)),('white',(255,255,255))):
    b=Image.new('RGBA',o.size,bg+(255,)); b.alpha_composite(o); b.convert('RGB').save(f'chk_{name}.png')
