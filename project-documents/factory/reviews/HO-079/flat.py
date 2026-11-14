import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
FONT=sys.argv[1]; OUT=sys.argv[2]
GOLD=(201,164,92); DARK=(120,90,44)
def f(px): return ImageFont.truetype(FONT,px)
def text_w(fn,t,tr): return sum(fn.getlength(c,features=["lnum"]) for c in t)+tr*(len(t)-1)
def draw(d,xy,t,fn,tr,fill=255):
    x,y=xy
    for c in t: d.text((x,y),c,font=fn,fill=fill,anchor="ls",features=["lnum"]); x+=fn.getlength(c,features=["lnum"])+tr
def layout(kind,W=2080):
    H=420; m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m)
    big=f(230); small=f(64)
    if kind in('A','B'):
        t='SHOWDOWN 17'; tr=18; w=text_w(big,t,tr); x0=(W-w)/2; base=360
        draw(d,(x0,base),t,big,tr)
        st='CAREER MODE'; tr2=26; w2=text_w(small,st,tr2); draw(d,((W-w2)/2,base-185),st,small,tr2)
    else: # C: CAREER MODE small left-aligned over SHOWDOWN, 17 at small size top-right sharing that line
        t='SHOWDOWN'; tr=18; w=text_w(big,t,tr); x0=(W-w)/2; base=360
        draw(d,(x0,base),t,big,tr)
        st='CAREER MODE'; tr2=26; draw(d,(x0+6,base-185),st,small,tr2)
        n='17'; wn=text_w(small,n,tr2); draw(d,(x0+w-wn-4,base-185),n,small,tr2)
    return m
def render(kind):
    m=layout(kind); bbox=m.getbbox(); 
    img=Image.new('RGBA',m.size,GOLD+(0,)); img.putalpha(m)
    if kind=='B':
        # engraver's inline: thin darker line set inside each stroke
        e1=m.filter(ImageFilter.MinFilter(9)); e2=e1.filter(ImageFilter.MinFilter(5))
        ring=ImageChops.subtract(e1,e2)
        dark=Image.new('RGBA',m.size,DARK+(0,)); dark.putalpha(ring)
        img.alpha_composite(dark)
    pad=20; b=(max(bbox[0]-pad,0),max(bbox[1]-pad,0),min(bbox[2]+pad,m.width),min(bbox[3]+pad,m.height))
    return img.crop(b)
for k in 'ABC':
    r=render(k); r.save(f'{OUT}/LOGO_V4_SAMPLE_{k}.png')
