import sys; sys.path.insert(0,'/tmp/claude-0/s')
from title_family import render
from PIL import Image, ImageDraw, ImageFont
def room(n,y0,y1):
    r=Image.open(f'room_{n}.webp').convert('RGBA').resize((1920,1080),Image.LANCZOS); return r.crop((0,y0,1920,y1))
lab=ImageFont.truetype('/tmp/claude-0/fonts/Oswald.ttf',40)
names={'A':'A  Honours Board  (gold leaf sign-writing, dark shade)','B':'B  Brass Inlay  (matte brass letters cut into the wall)','C':"C  Sign-writer's Script  (hand-painted, thin dark outline)"}
rows=[]
for o in 'ABC':
    top=room('board',0,300); t=render(o,'Transfer War',112); t=t.resize((t.width//2,t.height//2),Image.LANCZOS); top.alpha_composite(t,((1920-t.width)//2,22))
    bot=room('slab',300,480); t=render(o,'Settings',112); t=t.resize((t.width//2,t.height//2),Image.LANCZOS); bot.alpha_composite(t,((1920-t.width)//2,(180-t.height)//2))
    r=Image.new('RGBA',(1920,70+300+180),(16,13,11,255)); ImageDraw.Draw(r).text((28,10),names[o],font=lab,fill=(236,226,206))
    r.alpha_composite(top,(0,70)); r.alpha_composite(bot,(0,370)); rows.append(r)
s=Image.new('RGB',(1920,550*3+20*2),(0,0,0))
for i,r in enumerate(rows): s.paste(r.convert('RGB'),(0,i*570))
s.save('HO071_PICK_SHEET.jpg',quality=88)
z=Image.new('RGB',(1600,360*3),(0,0,0))
for i,o in enumerate('ABC'): z.paste(Image.open(f'ZOOM_{o}.jpg'),(0,i*360))
z.save('HO071_CLOSEUP.jpg',quality=88)
