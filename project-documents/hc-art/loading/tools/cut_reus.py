from rembg import remove, new_session
from PIL import Image
im=Image.open('reus_full.jpg').convert('RGB')
c=im.crop((2080,80,3300,2140)); c.save('crop.png')
s=new_session('birefnet-portrait')
remove(c,session=s,only_mask=True).save('m_bi.png')
s=new_session('isnet-general-use')
remove(c,session=s,only_mask=True).save('m_is.png')
