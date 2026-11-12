# Brushed-brass league wheel rim, drawn in code. Same canvas, centre and band as WHEEL_RIM_V1 (alpha reused).
# Satin brass matching the box-room counter rail; light from above (the box room floodlights); no mirror hotspots.
import sys, numpy as np
from PIL import Image, ImageFilter
v1 = Image.open(sys.argv[1]).convert('RGBA'); N = v1.size[0]
A = np.asarray(v1)[...,3].astype(np.float32)/255.
# band: V1's median ring (inner 609, outer 774 of 1600, measured along 720 rays), drawn as a true circle on the
# canvas centre, because the wheel box is a circle and V1's painted perspective put its hole off-centre.
cx = cy = N/2; ro, ri = 776.0, 610.0
yy, xx = np.mgrid[0:N,0:N].astype(np.float32)+0.5
dx, dy = xx-cx, yy-cy; r = np.hypot(dx,dy)+1e-3; th = np.arctan2(dy,dx)
A = np.clip(ro-r+0.5,0,1)*np.clip(r-ri+0.5,0,1)
t = np.clip((r-ri)/(ro-ri),0,1)          # 0 inner edge .. 1 outer edge
rng = np.random.default_rng(17)
# profile height: flat crowned face, small bevels at both edges, a fine step 22% in
h = 0.25*np.sin(np.pi*t) + 0.05*np.clip((t-.22)/.02,0,1)
h -= 0.10*np.clip(1-t/.05,0,1)**2 + 0.10*np.clip((t-.96)/.04,0,1)**2
dh = np.gradient(h, axis=0)*0+0
# radial slope -> normal (in image plane, radial direction) 
eps = 1.0/(ro-ri)
def H(tt):
    return 0.25*np.sin(np.pi*tt) + 0.05*np.clip((tt-.22)/.02,0,1) - 0.10*np.clip(1-tt/.05,0,1)**2 - 0.10*np.clip((tt-.96)/.04,0,1)**2
slope = (H(np.clip(t+eps,0,1))-H(np.clip(t-eps,0,1)))/(2*eps)/(ro-ri)*60
nx, ny, nz = -slope*dx/r, -slope*dy/r, np.ones_like(r)
nn = np.sqrt(nx**2+ny**2+nz**2); nx/=nn; ny/=nn; nz/=nn
L = np.array([0.0,-0.55,0.84]); L/=np.linalg.norm(L)
diff = np.clip(nx*L[0]+ny*L[1]+nz*L[2],0,1)
# brushed: concentric fine streaks (noise in r), slowly varying along the ring
rad = np.arange(int(ro)+4)
s1 = rng.normal(0,1,len(rad)); s1 = np.convolve(s1, np.ones(2)/2, 'same')
s2 = rng.normal(0,1,len(rad)); s2 = np.convolve(s2, np.ones(6)/6, 'same')
ri_ = np.clip(r.astype(int),0,len(rad)-1)
brush = 0.045*s1[ri_] + 0.035*s2[ri_]*(0.6+0.4*np.sin(th*3+1.3))
# satin sheen: broad, perpendicular to brushing -> a soft vertical band at top and bottom
sheen = 0.18*np.exp(-((th+np.pi/2)/0.55)**2) + 0.06*np.exp(-((th-np.pi/2)/0.5)**2)
lum = 0.40 + 0.52*diff**1.6 + sheen*np.clip(diff,0,1) + brush
lum *= 0.80 + 0.28*np.clip(-np.sin(th),0,1)**1.5 - 0.10*np.clip(np.sin(th),0,1)   # lit from above, falls off below
# brass colour ramp from the box-room rail: shadow / base / light
c0 = np.array([46,32,19.]); c1 = np.array([132,97,58.]); c2 = np.array([206,160,98.])
lumc = np.clip(lum,0,1.25)[...,None]
col = np.where(lumc<0.75, c0+(c1-c0)*(lumc/0.75), c1+(c2-c1)*np.clip((lumc-0.75)/0.5,0,1))
# fine dark groove lines at the step and both edges
for g,w,k in [(.22,.006,.35),(.035,.008,.3),(.965,.008,.3)]:
    col *= (1-k*np.exp(-((t-g)/w)**2))[...,None]
# 12 flat screw heads, matte, slot along the ring
rs = ri + (ro-ri)*0.61; sr = (ro-ri)*0.055
for k in range(12):
    a = -np.pi/2 + k*np.pi/6
    sx, sy = cx+rs*np.cos(a), cy+rs*np.sin(a)
    d = np.hypot(xx-sx, yy-sy)
    m = np.clip(sr-d,0,1)
    if m.max()==0: continue
    face = np.clip(1-(d/sr)**2,0,1)
    shade = 0.82 + 0.16*np.clip(-(yy-sy)/sr,-1,1)
    head = c1[None,None,:]*shade[...,None]*(0.9+0.1*face[...,None])
    ring = np.exp(-((d-sr)/1.6)**2)
    slot = (np.abs((xx-sx)*np.cos(a)+(yy-sy)*np.sin(a)) < 2.2) & (d < sr*0.78)
    col = col*(1-m[...,None]) + head*m[...,None]
    col *= (1-0.45*ring)[...,None]
    col[slot] *= 0.45
col = np.clip(col,0,255)
out = np.dstack([col, A*255]).astype(np.uint8)
im = Image.fromarray(out,'RGBA')
im.save(sys.argv[2], 'WEBP', quality=88, method=6)
print('centre',cx,cy,'ri',ri,'ro',ro)
