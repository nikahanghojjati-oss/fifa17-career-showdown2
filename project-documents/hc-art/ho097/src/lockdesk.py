from PIL import Image, ImageFilter; import numpy as np, cv2
W='/tmp/claude-0/w/'
src=np.array(Image.open(W+'ENV_BOX_PLATE_HC_V3_2X.webp').convert('RGB')).astype(np.float32)
a=Image.open(W+'astra_desk.png').convert('RGB').resize((3072,1728),Image.LANCZOS)
a=a.filter(ImageFilter.UnsharpMask(radius=2,percent=60,threshold=2))
up=np.array(a).astype(np.float32)
M=(np.array(Image.open(W+'mask_2x.png'))>8).astype(np.uint8)
M=cv2.dilate(M,np.ones((3,3),np.uint8),iterations=40)
M[40:240,2060:2290]=1
f=cv2.GaussianBlur(M.astype(np.float32),(0,0),12)[...,None]
f=np.clip(f*1.4,0,1)
out=src*(1-f)+up*f
Image.fromarray(out.round().astype(np.uint8)).save(W+'EMPTY_2X.png')
Image.fromarray((f[...,0]*255).astype(np.uint8)).save(W+'lockmask_2x.png')
o=Image.fromarray(out.round().astype(np.uint8)); o.resize((1400,788),Image.LANCZOS).save(W+'empty_prev.jpg',quality=88)
o.crop((150,100,1250,1300)).save(W+'empty_crop_L.jpg',quality=90)
