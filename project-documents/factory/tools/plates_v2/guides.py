from PIL import Image, ImageDraw
from masks import M
R='/home/claude/fifa17-career-showdown2/project-documents/factory/'
for k,rects in M.items():
    im=Image.open(R+f'mockups/NEXT_{k}.png').convert('RGB')
    d=ImageDraw.Draw(im)
    for r in rects: d.rectangle(r,fill=(0,255,255))
    c=Image.new('RGB',(1536,1024),(0,0,0)); c.paste(im,(0,80))
    c.save(R+f'tickets/attach/GUIDE_{k}_PLATE_V2.png'); c.resize((768,512)).save(f'/tmp/claude-0/pl/s_{k}.png')
