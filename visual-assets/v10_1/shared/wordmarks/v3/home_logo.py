import sys; sys.path.insert(0,'/tmp/claude-0/s/v3')
import build_titles_v3 as B
from PIL import Image, ImageDraw
FP='/tmp/claude-0/s/v3/CormorantSC-Bold.ttf'
def line(d,text,cx,base,cap,track_em,ss):
    f=B.font_for_cap(FP,cap,ss); B.draw_line(d,f,text,cx*ss,base*ss,track_em*f.size); return B.line_width(f,text,track_em*f.size)/ss
def L1():
    W,H,ss=2800,760,2
    m=Image.new('L',(W*ss,H*ss),0); d=ImageDraw.Draw(m)
    w=line(d,'CAREER MODE',W/2,170,62,0.32,ss)
    for x0,x1 in ((W/2-w/2-230,W/2-w/2-40),(W/2+w/2+40,W/2+w/2+230)):
        d.rectangle((x0*ss,(170-31-3)*ss,x1*ss,(170-31+3)*ss),fill=255)
    line(d,'SHOWDOWN',W/2,430,210,0.08,ss)
    w=line(d,'17',W/2,640,130,0.04,ss)
    for x0,x1 in ((W/2-w/2-330,W/2-w/2-50),(W/2+w/2+50,W/2+w/2+330)):
        d.rectangle((x0*ss,(640-65-3)*ss,x1*ss,(640-65+3)*ss),fill=255)
    return B.material(m.resize((W,H),Image.LANCZOS),210)
def L2():
    W,H,ss=3600,560,2
    m=Image.new('L',(W*ss,H*ss),0); d=ImageDraw.Draw(m)
    f=B.font_for_cap(FP,220,ss); sw=B.line_width(f,'SHOWDOWN',0.06*f.size)/ss
    f17=B.font_for_cap(FP,390,ss); w17=B.line_width(f17,'17',0.02*f17.size)/ss
    gap=60; total=sw+gap+w17; x0=(W-total)/2
    line(d,'SHOWDOWN',x0+sw/2,470,220,0.06,ss)
    line(d,'17',x0+sw+gap+w17/2,470,390,0.02,ss)
    # small spaced kicker above SHOWDOWN, left-aligned with its first letter, plus a rule to the 17
    fk=B.font_for_cap(FP,64,ss); wk=B.line_width(fk,'CAREER MODE',0.34*fk.size)/ss
    line(d,'CAREER MODE',x0+wk/2,190,64,0.34,ss)
    d.rectangle(((x0+wk+40)*ss,(190-32-3)*ss,(x0+sw-10)*ss,(190-32+3)*ss),fill=255)
    return B.material(m.resize((W,H),Image.LANCZOS),220)
for n,fn in (('L1',L1),('L2',L2)):
    im=fn(); im=im.crop(im.getbbox()); im.save(f'/tmp/claude-0/s/HOME_LOGO_{n}.png')
