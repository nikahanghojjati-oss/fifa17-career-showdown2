from PIL import Image
s=0.494
cut={n:Image.open(f'BUST_{n}_cut.png') for n in ('NIK','DANIEL')}
for n,im in cut.items():
    for W in (1024,512,256):
        H=W*3//2; sc=s*W/512
        b=im.resize((round(im.width*sc),round(im.height*sc)),Image.LANCZOS)
        c=Image.new('RGBA',(W,H),(0,0,0,0)); bottom=round(744*W/512)
        c.paste(b,((W-b.width)//2,bottom-b.height),b)
        c.save(f'TRO_HC_6_GOLDEN_{n}_V1_{W}.webp',lossless=False,quality=90,alpha_quality=100,method=6)
# previews: trophy room grid with champion trophy, on dark and light
t=Image.open('/home/user/fifa17-career-showdown2/visual-assets/v10_1/shared/trophies-hc/TRO_HC_1_V2_256.webp').convert('RGBA')
for bgc,tag in (((24,22,20),'dark'),((235,228,215),'light')):
    g=Image.new('RGBA',(256*3+40,384+20),bgc+(255,))
    for i,f in enumerate([Image.open('TRO_HC_6_GOLDEN_DANIEL_V1_256.webp'),t,Image.open('TRO_HC_6_GOLDEN_NIK_V1_256.webp')]):
        g.alpha_composite(f.convert('RGBA'),(10+i*(256+10),10))
    g.convert('RGB').save(f'grid_{tag}.jpg',quality=90)
# 2x hair edge check
for n,box in (('DANIEL',(60,0,560,420)),('NIK',(150,0,650,380))):
    im=Image.open(f'TRO_HC_6_GOLDEN_{n}_V1_1024.webp')
    for bgc,tag in (((255,255,255),'w'),((10,10,10),'k')):
        c=Image.new('RGBA',im.size,bgc+(255,));c.alpha_composite(im);c.crop(box).convert('RGB').save(f'edge_{n}_{tag}.jpg')
