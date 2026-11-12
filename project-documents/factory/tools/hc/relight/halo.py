# Remove a cut-out halo (soft warm fringe round the whole silhouette) on the side away from the lamp.
# usage: halo.py in.png out.png lipY 'cfg_json'   cfg = [{lamp:[dx,dy], keep:k}, ...] for [Daniel, Nik]
import sys, json; sys.path.insert(0, sys.argv[0].rsplit('/',1)[0])
import numpy as np, cv2
from PIL import Image
from heads import find, matte
src, dst, lip, cfg = sys.argv[1], sys.argv[2], int(sys.argv[3]), json.loads(sys.argv[4])
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float32); H,W,_ = img.shape
faces = find(img.astype(np.uint8)); out = img.copy()
for (x,y,w,h), c in zip(faces, cfg):
    x0=max(0,int(x-1.6*w)); x1=min(W,int(x+2.6*w)); y0=max(0,int(y-0.9*h)); y1=min(H,lip)
    m = matte(Image.fromarray(img[y0:y1,x0:x1].astype(np.uint8))).astype(np.float32)/255.
    inside = (m>0.5).astype(np.uint8)
    dist_out = cv2.distanceTransform(1-inside, cv2.DIST_L2, 5)
    dist_in = cv2.distanceTransform(inside, cv2.DIST_L2, 5)
    band = np.clip(1-dist_out/(0.18*w),0,1)*np.clip(1-dist_in/(0.06*w),0,1)
    rgb = out[y0:y1,x0:x1]; L = rgb.mean(2)+1e-3
    k = int(0.25*w)|1
    bg = cv2.GaussianBlur(cv2.erode(L,np.ones((k,k),np.uint8)),(0,0),k/3)
    excess = np.clip(L-bg-2,0,None)
    warm = np.clip((rgb[...,0]-rgb[...,2])/40,0,1)
    yy,xx = np.mgrid[y0:y1,x0:x1].astype(np.float32); cx,cy = x+w/2, y+h/2
    dx,dy = c['lamp']; n=np.hypot(dx,dy); r=np.hypot(xx-cx,yy-cy)+1e-3
    dot = ((xx-cx)*dx/n+(yy-cy)*dy/n)/r
    t=np.clip((dot+0.15)/0.9,0,1); keep=t*t*(3-2*t)*c['keep']
    # never touch the face/skin: protect broad bright areas inside the silhouette
    skin = np.clip((cv2.GaussianBlur(L,(0,0),6)-55)/30,0,1)*(dist_in>2)
    cut = band*warm*np.clip(excess/25,0,1)*(1-keep)*(1-skin)
    ratio = np.clip((bg+2)/L,0,1)[...,None]
    rgb[:] = rgb*(1-cut[...,None]) + rgb*ratio*cut[...,None]
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(dst)
print('faces',faces)
