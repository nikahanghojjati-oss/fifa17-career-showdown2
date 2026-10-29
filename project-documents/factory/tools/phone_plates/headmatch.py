# Head/body match (Nik, 12 Oct 9:47 p.m. Eastern): the approved head comes from PHONE_<KEY>_MARBLE, the body from Nik's GPT
# picture. For each head, measure how the approved head must move to sit exactly on the GPT head (and so on its neck and body):
# shift (px), tilt (degrees), size (%), plus the colour step across the blend ring. Used by lock.py to snap each head on.
import cv2,numpy as np
def head_box(f,W,H):
    x,y,w,h=f; return [max(0,int(x-0.35*w)),max(0,int(y-0.75*h)),min(W,int(x+1.35*w)),min(H,int(y+1.2*h))]
def match(n,gw,f):
    H,W=n.shape[:2]; x0,y0,x1,y1=head_box(f,W,H)
    pad=int(0.4*(x1-x0)); X0,Y0,X1,Y1=max(0,x0-pad),max(0,y0-pad),min(W,x1+pad),min(H,y1+pad)
    a=cv2.cvtColor(n[Y0:Y1,X0:X1],cv2.COLOR_BGR2GRAY).astype(np.float32)/255
    b=cv2.cvtColor(gw[Y0:Y1,X0:X1],cv2.COLOR_BGR2GRAY).astype(np.float32)/255
    wm=np.zeros_like(a,np.uint8); wm[y0-Y0:y1-Y0,x0-X0:x1-X0]=255          # fit on the head itself
    A=np.eye(2,3,dtype=np.float32)
    try: _,A=cv2.findTransformECC(a,b,A,cv2.MOTION_AFFINE,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-6),wm,5)
    except cv2.error: pass
    s=float(np.sqrt(abs(np.linalg.det(A[:,:2])))); rot=float(np.degrees(np.arctan2(A[1,0],A[0,0])))
    cx,cy=(x0+x1)/2-X0,(y0+y1)/2-Y0; dx=float(A[0,0]*cx+A[0,1]*cy+A[0,2]-cx); dy=float(A[1,0]*cx+A[1,1]*cy+A[1,2]-cy)
    M=np.float32([[A[0,0],A[0,1],A[0,2]+X0-(A[0,0]*X0+A[0,1]*Y0)],[A[1,0],A[1,1],A[1,2]+Y0-(A[1,0]*X0+A[1,1]*Y0)]])  # full-image coords
    return dict(box=[x0,y0,x1,y1],dx=round(dx,1),dy=round(dy,1),tilt=round(rot,2),size=round(100*(s-1),2),M=M)
def ring_step(out,gw,box,W,H):
    # colour step where head meets body: mean |head-side - body-side| just inside vs just outside the blend
    x0,y0,x1,y1=box; inner=out[y0+6:y1-6,x0+6:x1-6].astype(np.float32); outer=gw[y0+6:y1-6,x0+6:x1-6].astype(np.float32)
    return round(float(np.abs(inner-outer).mean()),1)
