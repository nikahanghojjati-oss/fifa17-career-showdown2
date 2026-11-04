import json,struct,numpy as np,io
from PIL import Image
CT={5126:np.float32,5123:np.uint16,5125:np.uint32,5121:np.uint8}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def load(path):
    b=open(path,'rb').read(); l=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+l]); off=20+l; bl=struct.unpack('<I',b[off:off+4])[0]; bin_=b[off+8:off+8+bl]
    def acc(i):
        a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]; dt=CT[a['componentType']]; n=NC[a['type']]
        start=bv.get('byteOffset',0)+a.get('byteOffset',0); stride=bv.get('byteStride',0)
        itemsize=np.dtype(dt).itemsize*n
        if stride and stride!=itemsize:
            raw=np.frombuffer(bin_,dtype=np.uint8,count=stride*a['count'],offset=start).reshape(a['count'],stride)[:,:itemsize].copy()
            arr=raw.view(dt).reshape(a['count'],n)
        else: arr=np.frombuffer(bin_,dtype=dt,count=a['count']*n,offset=start).reshape(a['count'],n)
        return arr.astype(np.float64) if dt==np.float32 else arr.astype(np.int64)
    def img(i):
        im=j['images'][i]; bv=j['bufferViews'][im['bufferView']]; s=bv.get('byteOffset',0)
        return Image.open(io.BytesIO(bin_[s:s+bv['byteLength']])).convert('RGB')
    meshes={}
    for n in j['nodes']:
        if 'mesh' in n:
            m=j['meshes'][n['mesh']]; p=m['primitives'][0]; mat=j['materials'][p['material']]
            tex=mat.get('pbrMetallicRoughness',{}).get('baseColorTexture',{}).get('index')
            meshes[n.get('name')]=dict(pos=acc(p['attributes']['POSITION']),uv=acc(p['attributes']['TEXCOORD_0']),idx=acc(p['indices']).reshape(-1),mat=mat.get('name'),tex=tex,node=n)
    return j,meshes,img
