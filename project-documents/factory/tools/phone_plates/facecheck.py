# Face check for phone backgrounds (Nik, 12 Oct: the layout must never cover the managers' faces).
# For each key: finds the managers' faces in the approved PHONE_<KEY>_MARBLE mockup and checks
#  1) no face touches a game box (masks.py), 2) every face sits inside the narrowest phone view
#     (393x852, background shown with cover), 3) the finished ENV_<KEY>_PHONE_V2 has the same faces in the same place.
# Usage: python3 -B facecheck.py [KEY ...]   (no keys = every mockup with managers)
# Model: OpenCV Zoo YuNet face_detection_yunet_2023mar.onnx (MIT), sha256 8f2383e4...52fa4.
import os,sys,cv2,numpy as np
from masks import M,scaled
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../../..'))+'/'
MODEL=os.path.join(os.path.dirname(__file__),'face_detection_yunet_2023mar.onnx')
def faces(im):
    H,W=im.shape[:2]; d=cv2.FaceDetectorYN.create(MODEL,'',(W,H),0.8)
    _,f=d.detect(im); f=[] if f is None else f
    return [tuple(int(v) for v in r[:4]) for r in f if r[2]>0.08*W]   # managers only, not tiny tile art
def check(k):
    m=cv2.imread(ROOT+f'project-documents/factory/mockups/PHONE_{k}_MARBLE.png'); H,W=m.shape[:2]
    F=faces(m); R=scaled(k,W,H); bad=[]
    for x,y,w,h in F:
        for a,b,c,e in R:
            if max(0,min(x+w,c)-max(x,a))*max(0,min(y+h,e)-max(y,b)): bad.append(f'face at ({x},{y}) touches box {a,b,c,e}')
    cw=round(H*9/16); x0=(W-cw)//2; s=2096/H
    vis=cw*(393/852)/(9/16); vx0=x0+(cw-vis)/2; vx1=vx0+vis   # visible strip on a 393x852 phone
    for x,y,w,h in F:
        if x<vx0 or x+w>vx1: bad.append(f'face at ({x},{y}) is cut off on a 393x852 phone')
    p=ROOT+f'visual-assets/v10_1/plates-v2/ENV_{k}_PHONE_V2.webp'; note='no background yet'
    if os.path.exists(p):
        P=faces(cv2.imread(p)); exp=[((x-x0)*s,y*s) for x,y,w,h in F]
        miss=[e for e in exp if not any(abs(px-e[0])<25 and abs(py-e[1])<25 for px,py,pw,ph in P)]
        note=f'background faces {len(P)}/{len(F)}'+(f', MOVED or missing {len(miss)}' if miss else ', same place')
        if miss or len(P)!=len(F): bad.append(note)
    print(f"{k}: {len(F)} faces, {'OK' if not bad else 'FAIL'}; {note}"+''.join('\n  - '+b for b in bad))
    return not bad
if __name__=='__main__':
    keys=sys.argv[1:] or [k for k in M if k not in ('SETTINGS','RULE_BOOK','LOADING')]
    sys.exit(0 if all([check(k) for k in keys]) else 1)
