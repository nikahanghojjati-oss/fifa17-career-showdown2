import sys
from PIL import Image; import numpy as np, cv2
W='/tmp/claude-0/w/'; D=int(sys.argv[1])
src=np.array(Image.open(W+'ENV_BOX_PLATE_HC_V3_2X.webp').convert('RGB')).astype(np.float32)
bg=np.array(Image.open(W+'EMPTY_2X.png').convert('RGB')).astype(np.float32)
a=np.array(Image.open(W+'mask_2x.png')).astype(np.float32)/255
b=(a>0.5).astype(np.uint8)
ff=b.copy(); h,w=b.shape; m=np.zeros((h+2,w+2),np.uint8); cv2.floodFill(ff,m,(0,0),1)
holes=(ff==0); a[holes]=1.0
H,Wd=a.shape; mid=Wd//2
out=bg.copy()
for side,dx in (('L',-D),('R',D)):
    al=a.copy()
    if side=='L': al[:,mid:]=0
    else: al[:,:mid]=0
    M=np.float32([[1,0,dx],[0,1,0]])
    s2=cv2.warpAffine(src,M,(Wd,H),borderMode=cv2.BORDER_REPLICATE)
    a2=cv2.warpAffine(al,M,(Wd,H))[...,None]
    out=out*(1-a2)+s2*a2
o=Image.fromarray(out.round().clip(0,255).astype(np.uint8)); o.save(W+f'APART_{D}_2X.png')
o.resize((1400,788),Image.LANCZOS).save(W+f'apart_{D}_prev.jpg',quality=88)
o.crop((150,0,1250,900)).save(W+f'apart_{D}_hairL.png')
o.crop((1950,0,3072,900)).save(W+f'apart_{D}_hairR.png')
