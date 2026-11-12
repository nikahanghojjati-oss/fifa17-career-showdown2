import json, os, numpy as np
from PIL import Image, ImageFilter
def grain(im, amt=2.0, seed=1):
    a=np.asarray(im).astype(np.float32); rng=np.random.default_rng(seed)
    n=rng.normal(0,amt,a.shape[:2])[...,None]; return Image.fromarray((a+n).clip(0,255).astype(np.uint8))
def enc(im,path,cap,q0=86):
    q=q0
    while True:
        im.save(path,'WEBP',quality=q,method=6)
        if os.path.getsize(path)<=cap*1024 or q<=50: return q,os.path.getsize(path)//1024
        q-=3
out={}
d4=Image.open('LOAD1_x4.png').convert('RGB')   # 6144x3456
D2=grain(d4.resize((3840,2160),Image.LANCZOS),1.2); D1=grain(d4.resize((1920,1080),Image.LANCZOS),1.0)
out['ENV_LOADING_PLATE_HC_2X.webp']=enc(D2,'ENV_LOADING_PLATE_HC_2X.webp',450)
out['ENV_LOADING_PLATE_HC_1X.webp']=enc(D1,'ENV_LOADING_PLATE_HC_1X.webp',145)
p4=Image.open('LOAD2_x4.png').convert('RGB')   # 3456x6144
P=grain(p4.resize((1179,2096),Image.LANCZOS),1.0)
out['ENV_LOADING_PHONE_HC.webp']=enc(P,'ENV_LOADING_PHONE_HC.webp',200)
out['ENV_LOADING_PHONE_HC_590W.webp']=enc(P.resize((590,1049),Image.LANCZOS),'ENV_LOADING_PHONE_HC_590W.webp',70)
print(out)
# composites
pl=json.load(open('placement.json'))
def comp(bg,layer,key,lipfrac):
    bg=bg.convert('RGBA'); r=Image.open(layer); p=pl[key]; c=bg.copy(); c.alpha_composite(r,(p['left_px'],p['top_px']))
    lip=int(lipfrac*bg.height)-2; c.paste(bg.crop((0,lip,bg.width,bg.height)),(0,lip)); return c.convert('RGB')
c1=comp(Image.open('ENV_LOADING_PLATE_HC_1X.webp'),'REUS_D_1X.webp','desktop_1X',0.926); c1.save('COMP_DESKTOP_1X.png')
c2=comp(Image.open('ENV_LOADING_PLATE_HC_2X.webp'),'REUS_D_2X.webp','desktop_2X',0.926); c2.save('COMP_DESKTOP_2X.png')
c3=comp(Image.open('ENV_LOADING_PHONE_HC.webp'),'REUS_P.webp','phone',0.879); c3.save('COMP_PHONE.png')
