from PIL import Image
import numpy as np
def load(n): return np.array(Image.open(n+'_isnet-general-use.png').convert('RGBA')).astype(np.float32)
N=load('nik'); D=load('daniel')
# clean stray bottom rows
D[1392:,...,3]=0; N[1378:,...,3]=0
# --- colour match Daniel gold to Nik gold (above plinth) ---
def gold(a,ylim):
    m=(a[:ylim,:,3]>220); px=a[:ylim][m][:,:3]; L=px.mean(1); return px[L>60]
gn=gold(N,1190); gd=gold(D,1200)
mn,sn=gn.mean(0),gn.std(0); md,sd=gd.mean(0),gd.std(0)
print('nik',mn.round(1),sn.round(1),'dan',md.round(1),sd.round(1))
rgb=D[:1205,:,:3]
matched=(rgb-md)/sd*sn+mn
k=0.75
D[:1205,:,:3]=np.clip(rgb*(1-k)+matched*k,0,255)
# --- widen Daniel plinth rows ---
y0=1206; cx=(295+813)/2; f=607/971*920/519
P=Image.fromarray(D[y0:].astype(np.uint8),'RGBA')
w=P.width; nw=round(w*f)
P2=P.resize((nw,P.height),Image.LANCZOS)
off=round(cx*f-cx)
P2=P2.crop((off,0,off+w,P.height))
D[y0:]=np.array(P2).astype(np.float32)
# keep bust bottom over plinth seam: re-paste original bust rows above y0 already untouched
for name,a in (('NIK',N),('DANIEL',D)):
    im=Image.fromarray(a.astype(np.uint8),'RGBA'); bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
    im=im.crop(bb); im.save(f'BUST_{name}_cut.png'); print(name,bb,im.size)
