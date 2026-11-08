from PIL import Image, ImageFilter
import numpy as np, sys
o=Image.open('src/orig.png').convert('RGB').resize((3840,2160),Image.LANCZOS)
e=Image.open('sr6144.png').convert('RGB').resize((3840,2160),Image.LANCZOS)
sig=float(sys.argv[1]); k=float(sys.argv[2])
O=np.asarray(o,np.float32); E=np.asarray(e,np.float32)
lo=lambda im:np.asarray(Image.fromarray(im.astype(np.uint8)).filter(ImageFilter.GaussianBlur(sig)),np.float32) if False else None
def blur(a):
  return np.stack([np.asarray(Image.fromarray(np.clip(a[...,c],0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sig)),np.float32) for c in range(3)],-1)
# tones from original, fine detail from restored
R=blur(O)+k*(E-blur(E))
out=Image.fromarray(np.clip(R+.5,0,255).astype(np.uint8))
out.save('m.png')
print('mean diff vs orig-lanczos',abs(np.asarray(out,np.float32)-O).mean(), 'mean lum',O.mean(),np.asarray(out,np.float32).mean())
