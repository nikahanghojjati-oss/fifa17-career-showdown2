import cv2, numpy as np
from PIL import Image
ref=np.array(Image.open('/home/claude/p4in/r100-duet/p4/inputs/F-1/ARCHIVE_NIK_HEAD_CROP_1930_0_900.png').convert('RGB'))
b=np.array(Image.open('/home/claude/p4in/r100-duet/p4/inputs/F-1/raw/ENV_ARCHIVE_PLATE_HC_V4_2X_F1B_FIX1_1_RAW.png').convert('RGB'))
A0=np.array([[0.415,0.001,202.326],[-0.001,0.415,66.881]])
w0=cv2.warpAffine(b,A0,(900,900),flags=cv2.INTER_LANCZOS4)
# refine on the face box only (eyes excluded: they differ on purpose)
face=np.zeros((900,900),np.uint8); cv2.rectangle(face,(330,250),(640,560),255,-1); cv2.rectangle(face,(360,320),(620,400),0,-1)
sift=cv2.SIFT_create(4000)
k1,d1=sift.detectAndCompute(cv2.cvtColor(ref,cv2.COLOR_RGB2GRAY),face); k2,d2=sift.detectAndCompute(cv2.cvtColor(w0,cv2.COLOR_RGB2GRAY),face)
m=cv2.BFMatcher().knnMatch(d2,d1,k=2); good=[a for a,c in m if a.distance<0.8*c.distance]
p2=np.float32([k2[a.queryIdx].pt for a in good]); p1=np.float32([k1[a.trainIdx].pt for a in good])
A,inl=cv2.estimateAffinePartial2D(p2,p1,method=cv2.RANSAC,ransacReprojThreshold=3)
print('face good',len(good),'inl',int(inl.sum()),np.round(A,3).tolist())
w=cv2.warpAffine(w0,A,(900,900),flags=cv2.INTER_LANCZOS4)
np.save('B_face.npy',w)
# blink compare: alternate halves
z=lambda im: cv2.resize(im[200:620,280:700],(630,630))
Image.fromarray(np.hstack([z(ref),z(w),(z(ref)//2+z(w)//2)])).save('B_face_cmp.jpg',quality=90)
