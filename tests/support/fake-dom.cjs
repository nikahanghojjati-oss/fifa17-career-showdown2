"use strict";
// Minimal DOM for node contract tests of the career screen renderers. No browser needed.
class FakeNode{
  constructor(tag,isFragment=false){this.tagName=String(tag).toUpperCase();this.isFragment=isFragment;this.children=[];this.attributes={};this.dataset={};this.style={};this.className="";this.id="";this.hidden=false;this.ownText="";this.parent=null;
    const self=this;this.classList={add:(...c)=>{const s=new Set(self.className.split(/\s+/).filter(Boolean));c.forEach(x=>s.add(x));self.className=[...s].join(" ");},remove:(...c)=>{self.className=self.className.split(/\s+/).filter(x=>x&&!c.includes(x)).join(" ");},contains:c=>self.className.split(/\s+/).includes(c),toggle:(c,force)=>{const on=force===undefined?!self.classList.contains(c):Boolean(force);on?self.classList.add(c):self.classList.remove(c);return on;}};}
  get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
  set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
  get childElementCount(){return this.children.length;}
  get firstChild(){return this.children[0]||null;}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return Object.prototype.hasOwnProperty.call(this.attributes,k)?this.attributes[k]:null;}
  addEventListener(){} removeEventListener(){}
  appendChild(n){if(n.isFragment){const moved=n.children.splice(0);moved.forEach(c=>{c.parent=this;this.children.push(c);});return n;}if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);return n;}
  append(...nodes){nodes.forEach(n=>this.appendChild(typeof n==="string"?Object.assign(new FakeNode("#text"),{ownText:n}):n));}
  insertBefore(n){return this.appendChild(n);}
  replaceChildren(...nodes){this.children=[];this.ownText="";this.append(...nodes);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
  all(){return this.children.flatMap(c=>[c,...c.all()]);}
  findByClass(name){return this.all().filter(n=>n.className.split(/\s+/).includes(name));}
}
function createFakeDocument(){
  const byId=new Map(),bySelector=new Map();
  const doc={
    createElement:tag=>new FakeNode(tag),
    createDocumentFragment:()=>new FakeNode("#fragment",true),
    getElementById:id=>byId.get(id)||null,
    querySelector:sel=>bySelector.get(sel)||null,
    querySelectorAll:()=>[],
    addEventListener(){},
    register(id,node=new FakeNode("div")){node.id=id;byId.set(id,node);return node;},
    registerSelector(sel,node=new FakeNode("div")){bySelector.set(sel,node);return node;}
  };
  return doc;
}
module.exports={FakeNode,createFakeDocument};
