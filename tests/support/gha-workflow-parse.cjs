'use strict';
// Minimal, strict YAML-subset parser for this repository's GitHub Actions workflow files.
// Supports block mappings, block sequences, literal/folded block scalars, quoted and plain scalars,
// and one-line flow sequences. It throws on anything it does not understand, so a workflow written
// outside this subset fails the contracts that read it instead of being silently misread.
const fs=require('node:fs');
const path=require('node:path');

function stripComment(text){
  let quote=null;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quote){if(c===quote){if(quote==="'"&&text[i+1]==="'"){i++;continue;}quote=null;}continue;}
    if((c==="'"||c==='"')&&(i===0||/[\s\[,:]/.test(text[i-1])))quote=c;
    else if(c==='#'&&(i===0||/\s/.test(text[i-1])))return text.slice(0,i).trimEnd();
  }
  return text;
}
function scalar(raw,where){
  const text=raw.trim();
  if(text==='')return null;
  if(text.startsWith("'")){
    if(!text.endsWith("'")||text.length<2)throw new Error(`${where}: unterminated single-quoted scalar`);
    return text.slice(1,-1).replace(/''/g,"'");
  }
  if(text.startsWith('"')){
    if(!text.endsWith('"')||text.length<2)throw new Error(`${where}: unterminated double-quoted scalar`);
    return JSON.parse(text);
  }
  if(text.startsWith('[')){
    if(!text.endsWith(']'))throw new Error(`${where}: multi-line flow sequences are not supported`);
    const inner=text.slice(1,-1).trim();
    return inner===''?[]:inner.split(',').map(part=>scalar(part,where));
  }
  if(text.startsWith('{'))throw new Error(`${where}: flow mappings are not supported`);
  if(/^(?:true|false)$/.test(text))return text==='true';
  if(/^-?\d+$/.test(text))return Number(text);
  if(/:\s/.test(text)&&!text.includes('${{'))throw new Error(`${where}: plain scalar contains ": " (quote it): ${text}`);
  return text;
}
function parseWorkflowText(source,label='workflow'){
  const lines=source.replace(/\r\n/g,'\n').split('\n');
  let index=0;
  const indentOf=line=>line.match(/^ */)[0].length;
  const isBlank=line=>/^\s*(?:#.*)?$/.test(line);
  function skipBlank(){while(index<lines.length&&isBlank(lines[index]))index++;}
  function blockScalar(parentIndent,style){
    const out=[];let blockIndent=null;
    while(index<lines.length){
      const line=lines[index];
      if(line.trim()===''){out.push('');index++;continue;}
      const ind=indentOf(line);
      if(ind<=parentIndent)break;
      if(blockIndent===null)blockIndent=ind;
      if(ind<blockIndent)throw new Error(`${label}:${index+1}: block scalar indentation decreased`);
      out.push(line.slice(blockIndent));index++;
    }
    while(out.length&&out[out.length-1]==='')out.pop();
    return style==='|'?`${out.join('\n')}\n`:`${out.join(' ')}\n`;
  }
  function value(rest,keyIndent,where){
    const text=stripComment(rest).trim();
    if(/^[|>][-+]?$/.test(text))return blockScalar(keyIndent,text[0]);
    if(text===''){
      skipBlank();
      if(index<lines.length&&indentOf(lines[index])>keyIndent)return node(indentOf(lines[index]));
      if(index<lines.length&&indentOf(lines[index])===keyIndent&&/^\s*- /.test(lines[index]))return node(keyIndent);
      return null;
    }
    return scalar(text,where);
  }
  function mappingEntries(target,indent,firstText){
    let text=firstText;
    for(;;){
      const where=`${label}:${index}`;
      const m=text.match(/^([A-Za-z0-9_${}.\-\/]+|'[^']*'|"[^"]*"):(?:\s(.*))?$/);
      if(!m)throw new Error(`${where}: unparsed mapping line: ${text}`);
      const key=scalar(m[1],where);
      if(Object.prototype.hasOwnProperty.call(target,key))throw new Error(`${where}: duplicate key ${key}`);
      target[key]=value(m[2]||'',indent,where);
      skipBlank();
      if(index>=lines.length)return target;
      const line=lines[index];const ind=indentOf(line);
      if(ind<indent)return target;
      if(ind>indent)throw new Error(`${label}:${index+1}: unexpected indentation`);
      if(/^\s*- /.test(line)||/^\s*-$/.test(line))return target;
      text=stripComment(line.slice(ind));index++;
    }
  }
  function node(indent){
    skipBlank();
    const line=lines[index];
    if(/^\s*-(?:\s|$)/.test(line)){
      const items=[];
      while(index<lines.length){
        skipBlank();
        if(index>=lines.length)break;
        const current=lines[index];const ind=indentOf(current);
        if(ind!==indent||!/^\s*-(?:\s|$)/.test(current))break;
        const rest=current.slice(ind+1).replace(/^ /,'');
        index++;
        if(rest.trim()===''){items.push(node(indentOf(lines[index])));continue;}
        if(/^([A-Za-z0-9_${}.\-\/]+|'[^']*'|"[^"]*"):(?:\s|$)/.test(rest))items.push(mappingEntries({},ind+2,stripComment(rest)));
        else items.push(scalar(stripComment(rest),`${label}:${index}`));
      }
      return items;
    }
    const ind=indentOf(line);
    if(ind!==indent)throw new Error(`${label}:${index+1}: unexpected indentation`);
    index++;
    return mappingEntries({},indent,stripComment(line.slice(ind)));
  }
  skipBlank();
  const root=node(0);
  skipBlank();
  if(index<lines.length)throw new Error(`${label}:${index+1}: trailing content not parsed`);
  return root;
}
function stepLabel(step){
  if(step.name)return step.name;
  if(step.uses)return `uses:${step.uses}`;
  if(typeof step.run==='string')return `run:${step.run.trim().split('\n')[0]}`;
  throw new Error('step without name, uses or run');
}
function readWorkflow(root,relative){
  const parsed=parseWorkflowText(fs.readFileSync(path.join(root,relative),'utf8'),relative);
  if(!parsed||typeof parsed!=='object'||!parsed.jobs)throw new Error(`${relative}: no jobs`);
  for(const [id,job] of Object.entries(parsed.jobs)){
    if(!Array.isArray(job.steps))continue;
    for(const step of job.steps){step.label=stepLabel(step);step.job=id;}
  }
  return parsed;
}
// Logical command lines of a run block: trimmed, non-empty, non-comment, with backslash continuations joined.
function commandLines(run){
  if(typeof run!=='string')return [];
  const joined=run.replace(/\\\n\s*/g,' ');
  return joined.split('\n').map(line=>line.trim()).filter(line=>line&&!line.startsWith('#'));
}
module.exports={parseWorkflowText,readWorkflow,stepLabel,commandLines};
