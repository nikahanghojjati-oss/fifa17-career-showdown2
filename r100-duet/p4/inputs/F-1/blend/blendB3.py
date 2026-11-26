import cv2, numpy as np
from PIL import Image
ref=np.array(Image.open('/home/claude/p4in/r100-duet/p4/inputs/F-1/ARCHIVE_NIK_HEAD_CROP_1930_0_900.png').convert('RGB')).astype(np.float32)
B=np.load('B_face.npy').astype(np.float32)
def soft(m,r): return cv2.GaussianBlur(m,(0,0),r)
face=np.zeros((900,900),np.float32); cv2.ellipse(face,(488,445),(132,150),0,0,360,1,-1)
eye=np.zeros((900,900),np.float32); cv2.ellipse(eye,(480,340),(125,48),-4,0,360,1,-1)
face=soft(face,14); eye=soft(eye,10)
m=np.clip(face-eye,0,1)
# match B's colour to the original inside the face
sel=face>0.5
for c in range(3):
    mu1,s1=ref[...,c][sel].mean(),ref[...,c][sel].std(); mu2,s2=B[...,c][sel].mean(),B[...,c][sel].std()
    B[...,c]=(B[...,c]-mu2)*(s1/s2)+mu1
out=ref*(1-m[...,None])+B*m[...,None]
out=np.clip(out,0,255).astype(np.uint8)
Image.fromarray(out).save('G_crop.png')
z=lambda im: cv2.resize(np.asarray(im)[200:620,280:700],(630,630))
Image.fromarray(np.hstack([z(ref.astype(np.uint8)),z(out),z((m*255).astype(np.uint8)[...,None].repeat(3,2))])).save('G_cmp.jpg',quality=90)
