# find the two managers' faces (left = Daniel, right = Nik) and build head params + head-crop mattes
import sys, numpy as np, cv2, onnxruntime as ort
from PIL import Image
so=ort.SessionOptions(); so.intra_op_num_threads=2
sess = ort.InferenceSession('/tmp/models/human.onnx', so, providers=['CPUExecutionProvider'])
def matte(crop):
    w,h = crop.size
    x = np.asarray(crop.resize((320,320), Image.BICUBIC), np.float32)/255.
    x = ((x-[0.485,0.456,0.406])/[0.229,0.224,0.225]).transpose(2,0,1)[None].astype(np.float32)
    o = sess.run(None, {sess.get_inputs()[0].name: x})[0][0,0]
    o = (o-o.min())/(o.max()-o.min()+1e-6)
    return np.asarray(Image.fromarray((o*255).astype(np.uint8)).resize((w,h), Image.BICUBIC))
casc = cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
def find(img):
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    H,W = g.shape
    f = casc.detectMultiScale(g, 1.08, 6, minSize=(W//20,W//20))
    f = sorted(f, key=lambda r:-r[2])[:2]
    f = sorted(f, key=lambda r:r[0])
    return [tuple(int(v) for v in r) for r in f]
def heads(img, faces):
    H,W,_ = img.shape
    mask = np.zeros((H,W),np.uint8); out=[]
    for (x,y,w,h) in faces:
        x0=max(0,int(x-0.9*w)); x1=min(W,int(x+1.9*w)); y0=max(0,int(y-1.0*h)); y1=min(H,int(y+1.25*h))
        m = matte(Image.fromarray(img[y0:y1,x0:x1]))
        mask[y0:y1,x0:x1] = np.maximum(mask[y0:y1,x0:x1], m)
        out.append(dict(box=[x0,y0,x1,y1], c=[x+w/2, y+0.05*h], face=[x+w/2, y+0.62*h, 0.56*w, 0.72*h]))
    return mask, out
if __name__=='__main__':
    img = np.asarray(Image.open(sys.argv[1]).convert('RGB'))
    print(img.shape, find(img))
