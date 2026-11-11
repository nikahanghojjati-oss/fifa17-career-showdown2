import numpy as np, json
from PIL import Image, ImageFilter
from scipy import ndimage
c=np.asarray(Image.open('crop.png').convert('RGB')).astype(np.float32)
m=np.asarray(Image.open('m_bi.png')).astype(np.float32)/255
# alpha clean: snap interior, kill specks
m=np.where(m>0.97,1.0,m); m=np.where(m<0.03,0.0,m)
lab,n=ndimage.label(m>0.5); sz=ndimage.sum(m>0.5,lab,range(1,n+1)); big=np.argmax(sz)+1
keep=ndimage.binary_dilation(lab==big,iterations=6); m=m*keep
# head top row
rows=np.where((m>0.5).any(1))[0]; top=rows[0]
print('head top', top, 'crop size', c.shape)
# decontaminate green spill near edge
edge=ndimage.binary_dilation(m<0.999,iterations=5)&(m>0)
R,G,B=c[...,0],c[...,1],c[...,2]
mx=np.maximum(R,B); spill=edge&(G>mx)
G2=np.where(spill,mx+(G-mx)*0.15,G); c[...,1]=G2
# gentle warm grade to sit in tunnel tone (2700K room): small WB shift, -6% exposure
c[...,0]*=1.02; c[...,1]*=0.995; c[...,2]*=0.93; c*=0.90
lum=c.mean(2,keepdims=True); c=lum+(c-lum)*0.92
def rim(img,alpha,scale,side='right'):
    a=ndimage.gaussian_filter(alpha,2*scale)
    gx=ndimage.sobel(a,axis=1)
    face=np.clip(-gx/ (np.abs(gx).max()+1e-6)*6,0,1) if side=='right' else np.clip(gx/(np.abs(gx).max()+1e-6)*6,0,1)
    dist=ndimage.distance_transform_edt(alpha>0.5)
    band=np.clip(1-dist/(14*scale),0,1)
    face=ndimage.gaussian_filter(ndimage.maximum_filter(face,size=int(30*scale)),8*scale)
    w=np.clip(band*face,0,1)*(alpha>0.02)
    warm=np.array([255,186,118],np.float32)
    out=img+ (warm-img*0.5)*0.10*w[...,None]
    return out,w
def save(img,alpha,scale,name,q=88):
    h,w=alpha.shape; nw,nh=round(w*scale),round(h*scale)
    rgba=np.dstack([np.clip(img,0,255),alpha*255]).astype(np.uint8)
    im=Image.fromarray(rgba,'RGBA').resize((nw,nh),Image.LANCZOS)
    im.save(name,'WEBP',quality=q,method=6,alpha_quality=90)
    return im
cd,_=rim(c.copy(),m,1.0,'right')
# desktop: frame H, head top at 8%, lip at 92.5%; lip meets source mid-thigh row 1960
LIPSRC=1960
out={}
for tag,H in (('1X',1080),('2X',2160)):
    span=(0.925-0.05)*H; s=span/(LIPSRC-top)
    im=save(cd,m,s,f'REUS_D_{tag}.webp',86)
    out['desktop_'+tag]={'file':f'REUS_D_{tag}.webp','frame':[H*16//9,H],'scale_vs_source':round(s,3),'size':im.size,
       'top_px':round(0.05*H-top*s),'left_px':round(0.02*H*16/9),'note':'bottom of layer runs under the ledge; put LEDGE layer above it'}
# phone: frame 1179x2096, head top 18%, lip 95%
H=2096; s=((0.95-0.18)*H)/(LIPSRC-top); cp,_=(c.copy(),None)
im=save(c,m,s,'REUS_P.webp',86); im2=im.resize((round(im.width*590/1179),round(im.height*590/1179)),Image.LANCZOS); im2.save('REUS_P_590W.webp','WEBP',quality=86,method=6,alpha_quality=90)
out['phone']={'file':'REUS_P.webp','frame':[1179,2096],'scale_vs_source':round(s,3),'size':im.size,'top_px':round(0.18*H-top*s),'left_px':round((1179-im.width)/2)}
json.dump(out,open('placement.json','w'),indent=1); print(json.dumps(out,indent=1))
