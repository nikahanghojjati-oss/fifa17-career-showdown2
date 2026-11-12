# Guard for HO-074 relights: nothing gets lighter, faces are untouched, hair keeps its strand detail.
import sys, json; sys.path.insert(0, sys.argv[0].rsplit('/',1)[0])
import numpy as np, cv2
from PIL import Image
from heads import find
pairs = [a.split('=') for a in sys.argv[1:]]   # src=out[=faces_json]
ok_all = True
for p in pairs:
    src, out = p[0], p[1]
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.int16); b = np.asarray(Image.open(out).convert('RGB')).astype(np.int16)
    faces = json.loads(p[2]) if len(p)>2 else find(a.astype(np.uint8))
    d = b - a
    lighter = int(d.max())
    H,W,_ = a.shape; yy,xx = np.mgrid[0:H,0:W]
    face_max = 0
    for (x,y,w,h) in faces:
        e = ((xx-(x+w/2))/(0.56*w))**2 + ((yy-(y+0.62*h))/(0.72*h))**2 <= 1.0
        face_max = max(face_max, int(np.abs(d[e]).max()))
    chg = np.abs(d).max(2) > 2
    la = cv2.Laplacian(a.mean(2).astype(np.float32), cv2.CV_32F); lb = cv2.Laplacian(b.mean(2).astype(np.float32), cv2.CV_32F)
    detail = float(np.abs(lb[chg]).mean() / max(1e-3, np.abs(la[chg]).mean())) if chg.any() else 1.0
    ok = lighter <= 0 and face_max == 0 and detail >= 0.55
    ok_all &= ok
    print(f"{'PASS' if ok else 'FAIL'} {out.split('/')[-1]:18s} lighter={lighter} face_change={face_max} changed_px={int(chg.sum())} strand_detail_kept={detail:.0%}")
sys.exit(0 if ok_all else 1)
