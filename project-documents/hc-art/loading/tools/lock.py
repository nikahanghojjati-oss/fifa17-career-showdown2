import numpy as np
from PIL import Image
from scipy import ndimage
o=np.asarray(Image.open('/tmp/hc/HC07_TUNNEL_D_V2_TRY1.png').convert('RGB')).astype(np.float32)
a=np.asarray(Image.open('LOAD1_TUNNEL_D_TRY2.png').convert('RGB')).astype(np.float32)
m=(np.asarray(Image.open('men_mask.png'))>0).astype(np.float32)
f=ndimage.gaussian_filter(ndimage.binary_dilation(m>0,iterations=4).astype(np.float32),8)[...,None]
d=(o*(1-f)+a*f).clip(0,255).astype(np.uint8)
Image.fromarray(d).save('LOAD1_LOCKED_1536.png')
c=Image.fromarray(d).crop((0,100,1536,964)); c.save('LOAD1_16x9_1536.png')
c.resize((1920,1080),Image.LANCZOS).save('ENV_LOADING_PLATE_HC_1X_tmp.png')
# phone: keep as is (middle identical); 1179x2096 from 1024x1536 (2:3) -> crop to 9:16 width
p=Image.open('LOAD2_TUNNEL_P_TRY2.png').convert('RGB'); W=round(1536*1179/2096); x0=(1024-W)//2
pc=p.crop((x0,0,x0+W,1536)); pc.save('LOAD2_9x16.png'); print(W)
