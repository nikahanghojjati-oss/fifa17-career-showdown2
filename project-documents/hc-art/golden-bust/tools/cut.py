import sys
from rembg import remove, new_session
from PIL import Image
s=new_session(sys.argv[1])
for n in ['nik','daniel']:
    im=Image.open(n+'.png').convert('RGB')
    out=remove(im,session=s,post_process_mask=True)
    out.save(f'{n}_{sys.argv[1]}.png')
    bg=Image.new('RGB',im.size,(220,40,200));bg.paste(out,(0,0),out);bg.resize((561,701)).save(f'{n}_{sys.argv[1]}_check.jpg')
