# Run from slice-02-plate/. Likeness source = owner-approved edit (Nik, 2026-09-28). Changes pixels only inside the two cleanup zones; prints the lock proof.
import cv2, numpy as np
from PIL import Image
src = cv2.imread('assets/src/ENV_TR2_PLATE_G_EDIT_V1.png')  # BGR
out = src.copy()
H, W = src.shape[:2]
zones = np.zeros((H, W), np.uint8)   # union of cleanup zones (for the lock proof)

# --- Zone D-digits: baked 05:27 on the sign screen ------------------------
poly_d = np.array([[781,93],[940,100],[940,161],[779,156]], np.int32)
zd = np.zeros((H, W), np.uint8); cv2.fillPoly(zd, [poly_d], 255)
lab = cv2.cvtColor(src, cv2.COLOR_BGR2LAB)
L = lab[...,0].astype(int)
hsv = cv2.cvtColor(src, cv2.COLOR_BGR2HSV)
bright = ((L > 120) & (hsv[...,1] > 60)).astype(np.uint8)*255
m = cv2.bitwise_and(bright, zd)
m = cv2.dilate(m, np.ones((3,3),np.uint8), iterations=2)
m = cv2.bitwise_and(m, cv2.dilate(zd, np.ones((3,3),np.uint8)))
out = cv2.inpaint(out, m, 9, cv2.INPAINT_TELEA)
# smooth inpaint residue inside the digit area only, keep a little grain
blur = cv2.GaussianBlur(out, (0,0), 3.0)
soft = (cv2.GaussianBlur(m, (0,0), 1.5).astype(np.float32)[...,None]/255.0)*0.8
out = (out*(1-soft) + blur*soft).astype(np.uint8)
zones |= cv2.dilate(m, np.ones((15,15),np.uint8))

# --- Zone R-card: AI face on the tall standing card -----------------------
poly_c = np.array([[1247,434],[1316,428],[1319,542],[1240,546]], np.int32)
zc = np.zeros((H, W), np.uint8); cv2.fillPoly(zc, [poly_c], 255)
x0,y0,x1,y1 = 1236,424,1324,552
# dark smoked-glass fill: vertical gradient from the card's own dark interior colours
top = src[426:432, 1255:1305].reshape(-1,3).mean(0)
bot = np.array([18,26,34],np.float32)  # warm-dark (BGR)
top = np.minimum(top, np.array([30,45,60])).astype(np.float32)
fill = np.zeros((y1-y0, x1-x0, 3), np.float32)
for i in range(y1-y0):
    t = i/(y1-y0-1); fill[i,:] = top*(1-t)+bot*t
# faint diagonal glass sheen + grain
yy, xx = np.mgrid[0:y1-y0, 0:x1-x0]
sheen = np.exp(-((xx*0.8 - yy*0.5 - 10)**2)/(2*9**2))*22
fill += sheen[...,None]*np.array([0.35,0.75,1.0])
rng = np.random.default_rng(17); fill += rng.normal(0,2.2,fill.shape)
fill = np.clip(fill,0,255).astype(np.uint8)
feather = cv2.GaussianBlur(zc, (0,0), 2.0).astype(np.float32)[...,None]/255.0
region = out[y0:y1, x0:x1].astype(np.float32)
f = feather[y0:y1, x0:x1]
out[y0:y1, x0:x1] = (region*(1-f) + fill*f).astype(np.uint8)
zones |= cv2.dilate(zc, np.ones((15,15),np.uint8))

cv2.imwrite('assets/ENV_TR2_PLATE_G_LOCKED_V1_1672.png', out)
cv2.imwrite('assets/CLEAN_ZONES_MASK.png', zones)
# lock proof: outside the cleanup zones the plate must be byte-identical to the approved edit
diff = np.any(out != src, axis=2)
print('changed px total', int(diff.sum()), 'changed px outside zones', int((diff & (zones==0)).sum()))
