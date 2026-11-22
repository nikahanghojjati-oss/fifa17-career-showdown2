import sys
from rembg import remove, new_session
from PIL import Image
s=new_session(sys.argv[3] if len(sys.argv)>3 else 'isnet-general-use')
im=Image.open(sys.argv[1]).convert('RGB')
m=remove(im,session=s,only_mask=True)
m.save(sys.argv[2])
