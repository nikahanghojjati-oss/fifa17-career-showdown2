# GUIDE_<KEY>_PHONE_V2.png = the approved PHONE_<KEY>_MARBLE picture with solid cyan boxes over every game part.
from PIL import Image, ImageDraw
from masks import M, scaled
R='/home/claude/fifa17-career-showdown2/project-documents/factory/'
for k in M:
    im=Image.open(R+f'mockups/PHONE_{k}_MARBLE.png').convert('RGB'); d=ImageDraw.Draw(im)
    for r in scaled(k,*im.size): d.rectangle(r,fill=(0,255,255))
    im.save(R+f'tickets/attach/GUIDE_{k}_PHONE_V2.png')
print('ok')
