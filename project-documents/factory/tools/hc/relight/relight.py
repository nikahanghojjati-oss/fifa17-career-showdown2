# Relight one head: dim hair rim highlights on the side away from the room's lamp.
# head = dict(box, c, face=(cx,cy,rx,ry), lamp=(dx,dy), keep=0..1 strength on lamp side, tint=None|(r,g,b))
import numpy as np, cv2
from PIL import Image
def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
def relight(img, mask, head, debug=False):
    x0,y0,x1,y1 = head['box']
    rgb = img[y0:y1,x0:x1].astype(np.float32)
    m = mask[y0:y1,x0:x1].astype(np.float32)/255.
    m = (m-m.min())/max(1e-6,m.max()-m.min())
    H,W = m.shape
    # hair zone: inside or just outside the silhouette (fly-away strands), not the face
    zone = cv2.GaussianBlur(cv2.dilate((m>0.5).astype(np.uint8),np.ones((31,31),np.uint8)).astype(np.float32),(0,0),6)
    yy,xx = np.mgrid[0:H,0:W].astype(np.float32); xx+=x0; yy+=y0
    fcx,fcy,frx,fry = head['face']
    fd = ((xx-fcx)/frx)**2+((yy-fcy)/fry)**2
    zone *= smooth(0.85,1.25,fd)
    for (ocx,ocy,orx,ory) in head.get('others',[]):
        zone *= smooth(0.9,1.4,((xx-ocx)/orx)**2+((yy-ocy)/ory)**2)
    fe = 40.0   # feather the box edges so no straight seams
    zone *= np.clip(np.minimum.reduce([xx-x0, x1-1-xx, yy-y0+fe*(y0==0), y1-1-yy])/fe,0,1)
    zone *= smooth(head.get('ymax',y1), head.get('ymax',y1)-60, yy) if 'ymax' in head else 1
    L = rgb.mean(2)+1e-3
    base = cv2.GaussianBlur(cv2.erode(L,np.ones((9,9),np.uint8)),(0,0),5)
    excess = np.clip(L-base,0,None)
    hi = smooth(6,40,excess)            # how much this pixel is a highlight
    broad = cv2.GaussianBlur(cv2.erode(L,np.ones((5,5),np.uint8)),(0,0),7)
    hi *= 1-smooth(head.get('skin_lo',55),head.get('skin_hi',85),broad)   # broad bright areas = skin, leave alone
    # side: radial direction from head centre against lamp direction
    cx,cy = head['c']; dx,dy = head['lamp']; n=np.hypot(dx,dy); dx/=n; dy/=n
    r = np.hypot(xx-cx,yy-cy)+1e-3
    dot = ((xx-cx)*dx+(yy-cy)*dy)/r
    keep = smooth(-0.15,0.75,dot)*head.get('keep',1.0)
    cut = zone*hi*(1-keep)
    ratio = np.clip((base+3)/L,0,1)
    dark = rgb*ratio[...,None]*0.9
    dark = dark*0.55 + dark.mean(2,keepdims=True)*0.45 + np.array([3,2.5,2.2],np.float32)
    out = rgb*(1-cut[...,None]) + dark*cut[...,None]
    tint = head.get('tint')
    if tint is not None:   # recolour kept highlights toward the lamp colour, same brightness
        k = zone*hi*keep*head.get('tint_amt',0.8)
        lum = out.mean(2,keepdims=True)
        t = np.array(tint,np.float32); t = t/t.mean()
        out = out*(1-k[...,None]) + (lum*t)*k[...,None]
    res = img.copy(); res[y0:y1,x0:x1] = np.clip(out,0,255).astype(np.uint8)
    if debug: return res, (cut*255).astype(np.uint8)
    return res
