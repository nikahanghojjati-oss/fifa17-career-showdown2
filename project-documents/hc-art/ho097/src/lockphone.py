from PIL import Image, ImageFilter; import numpy as np, cv2
W='/tmp/claude-0/w/'
src=np.array(Image.open(W+'ENV_BOX_PHONE_HC_V3.webp').convert('RGB')).astype(np.float32)
tall=np.array(Image.open(W+'ENV_BOX_PHONE_HC_V3_TALL.webp').convert('RGB')).astype(np.float32)
a=Image.open(W+'astra_phone.png').convert('RGB').resize((1179,2096),Image.LANCZOS)
a=a.filter(ImageFilter.UnsharpMask(radius=1.5,percent=40,threshold=2))
up=np.array(a).astype(np.float32)
M=(np.array(Image.open(W+'mask_phone.png'))>8).astype(np.uint8)
M=cv2.dilate(M,np.ones((3,3),np.uint8),iterations=25)
M[480:1208,10:1170]=1
f=np.clip(cv2.GaussianBlur(M.astype(np.float32),(0,0),8)*1.4,0,1)[...,None]
out=src*(1-f)+up*f
Image.fromarray(out.round().astype(np.uint8)).save(W+'PHONE_EMPTY.png')
# tall: same region; tall equals upright above counter
ys=np.where(f[...,0].max(1)>0)[0]; print('mask rows',ys.min(),ys.max())
ft=np.zeros(tall.shape[:2]+(1,),np.float32); ft[:2096]=f
outt=tall*(1-ft)+np.pad(up,((0,tall.shape[0]-2096),(0,0),(0,0)))*ft
Image.fromarray(outt.round().astype(np.uint8)).save(W+'TALL_EMPTY.png')
for n,o in (('phone',out),('tall',outt)):
  im=Image.fromarray(o.round().astype(np.uint8)); im.thumbnail((700,1400)); im.save(W+f'{n}_empty_prev.jpg',quality=88)
Image.fromarray(outt.round().astype(np.uint8)).crop((0,900,1179,1400)).save(W+'tall_seam.png')
