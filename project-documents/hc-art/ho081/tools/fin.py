import math, json, numpy as np
from PIL import Image, ImageFilter
def decon(im):
    a=np.array(im).astype(np.float32); rgb=a[...,:3]; al=a[...,3]
    w=(al>240).astype(np.float32)
    num=np.stack([np.array(Image.fromarray(rgb[...,c]*w).filter(ImageFilter.GaussianBlur(4))) if False else None for c in range(0)]) if False else None
    out=rgb.copy()
    for r in (2,4,8):
        W=Image.fromarray((w*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)); Wn=np.array(W).astype(np.float32)/255
        acc=np.zeros_like(rgb)
        for c in range(3):
            acc[...,c]=np.array(Image.fromarray(np.clip(rgb[...,c]*w,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)/255*255
        fill=acc/np.maximum(Wn[...,None],1e-3)
        sel=(al<=240)&(Wn>0.05)&(out.sum(-1)>=0)
        out[sel]=fill[sel]; w=np.maximum(w,(Wn>0.05)&(al>0))
    al[al<6]=0
    return Image.fromarray(np.dstack([np.clip(out,0,255),al]).astype(np.uint8),'RGBA')
def xf(src,ang,px,py,tx,ty,pts,sc=1.0):
    im=Image.open(src); W,H=im.size; a=math.radians(ang); ca,sa=math.cos(a),math.sin(a)
    A,B,D,E=ca/sc,sa/sc,-sa/sc,ca/sc; C=px-A*(px+tx)-B*(py+ty); F=py-D*(px+tx)-E*(py+ty)
    out=im.transform((W,H),Image.AFFINE,(A,B,C,D,E,F),resample=Image.BICUBIC)
    f=lambda x,y:[round(px+sc*(ca*(x-px)-sa*(y-py))+tx,1), round(py+sc*(sa*(x-px)+ca*(y-py))+ty,1)]
    return decon(out),{k:f(*v) for k,v in pts.items()}
res={}
for key,src,ang,px,py,tx,ty,pts,sc in [
 ('RR_HAND_POV_W','w1_cut.png',8.0,1150,941,-20,80,{'muzzle':(457,130),'boreRear':(800,219),'wrist':(1030,600),'elbow':(1900,1150)},1.0),
 ('RR_HAND_POV_P','p1_cut.png',6.0,520,1672,0,40,{'muzzle':(275,65),'boreRear':(393,330),'wrist':(505,1080),'elbow':(560,2150)},1.0)]:
    im,p=xf(src,ang,px,py,tx,ty,pts,sc)
    m,b=p['muzzle'],p['boreRear']; p['boreAngleDeg']=round(math.degrees(math.atan2(b[1]-m[1],b[0]-m[0])),1)
    al=np.array(im)[...,3]; Wd,Hd=im.size
    edges={}
    for side,arr in (('left',al[:,0]),('right',al[:,-1]),('top',al[0]),('bottom',al[-1])):
        w=np.where(arr>128)[0]
        if len(w): edges[side]=[int(w.min()),int(w.max())]
    p['cutEdges']=edges; p['size']=[Wd,Hd]
    im.save(key+'_V1.webp',quality=90,alpha_quality=100,method=6); im.save(key+'_V1.png')
    res[key]=p
    bg=Image.new('RGBA',im.size,(18,14,12,255)); bg.alpha_composite(im); bg.convert('RGB').save(key+'_dark.jpg',quality=90)
json.dump(res,open('HO081_PLATE_NUMBERS.json','w'),indent=1); print(json.dumps(res,indent=1))
