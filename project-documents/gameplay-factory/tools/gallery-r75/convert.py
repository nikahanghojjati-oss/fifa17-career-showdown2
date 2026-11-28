import sys
from PIL import Image
src,dst,q=sys.argv[1],sys.argv[2],int(sys.argv[3])
im=Image.open(src).convert("RGB")
im.save(dst,"JPEG",quality=q,optimize=True,progressive=True,subsampling="4:2:0")
