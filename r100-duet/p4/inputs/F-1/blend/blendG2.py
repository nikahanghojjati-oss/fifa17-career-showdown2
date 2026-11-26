import cv2, numpy as np
from PIL import Image
ref=np.array(Image.open('/home/claude/p4in/r100-duet/p4/inputs/F-1/ARCHIVE_NIK_HEAD_CROP_1930_0_900.png').convert('RGB')).astype(np.float32)
B=np.load('B_face.npy').astype(np.float32)
W,H=900,900
hm=np.asarray(Image.open('/home/claude/r100/tools/clubhouse-themes/masks/ENV_ARCHIVE_PLATE_HC_V3_1920.png').convert('L').resize((3072,1728),Image.LANCZOS),np.float32)[0:900,1930:2830]/255
inside=cv2.erode((hm>0.5).astype(np.uint8),np.ones((5,5))).astype(np.float32)
yy,xx=np.mgrid[0:H,0:W]
# B only below the eyes: forehead, brows and eyes stay as today
lower=np.clip((yy-395)/30,0,1)
# whole jaw and beard, both sides, stop before the ear on the image-left
zone=np.zeros((H,W),np.float32); cv2.ellipse(zone,(478,475),(165,150),0,0,360,1,-1)
ear=np.zeros((H,W),np.float32); cv2.ellipse(ear,(300,400),(55,95),0,0,360,1,-1)
m=cv2.GaussianBlur(zone,(0,0),10)*(1-cv2.GaussianBlur(ear,(0,0),10))*lower*cv2.GaussianBlur(inside,(0,0),2)
m=np.clip(m,0,1)
sel=m>0.5
for c in range(3):
    mu1,s1=ref[...,c][sel].mean(),ref[...,c][sel].std(); mu2,s2=B[...,c][sel].mean(),B[...,c][sel].std()
    B[...,c]=(B[...,c]-mu2)*(s1/s2)+mu1
out=np.clip(ref*(1-m[...,None])+B*m[...,None],0,255).astype(np.uint8)
Image.fromarray(out).save('G2_crop.png')
z=lambda im: cv2.resize(np.asarray(im)[180:640,260:720],(600,600))
Image.fromarray(np.hstack([z(ref.astype(np.uint8)),z(np.array(Image.open('G_crop.png'))),z(out),z((m*255).astype(np.uint8)[...,None].repeat(3,2))])).save('G2_cmp.jpg',quality=90)
